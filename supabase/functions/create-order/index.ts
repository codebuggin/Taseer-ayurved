import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, items, receipt } = await req.json()

    if (!order_id || !Array.isArray(items) || items.length === 0) {
      throw new Error('order_id and a non-empty items array are required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Look up authoritative prices from the products table — never trust a
    // client-supplied price, only product id + quantity. A tampered request
    // (e.g. calling this function directly with fabricated cheap prices)
    // gets priced from the DB instead.
    const productIds: string[] = [...new Set(items.map((item: { id: string }) => item.id))]
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds)

    if (productsError || !products || products.length !== productIds.length) {
      throw new Error('One or more products in the cart could not be verified')
    }

    const priceById = new Map(products.map((p: { id: string; price: number }) => [p.id, p.price]))
    const total = items.reduce((sum: number, item: { id: string; quantity: number }) => {
      const price = priceById.get(item.id)
      if (price === undefined) throw new Error(`Unknown product: ${item.id}`)
      return sum + (Number(price) * Number(item.quantity))
    }, 0)

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys not configured in Edge Function secrets.')
    }

    const auth = btoa(`${keyId}:${keySecret}`)
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(total * 100), // Razorpay expects amount in paise
        currency: 'INR',
        receipt: receipt || order_id
      })
    })

    const orderData = await rzpResponse.json()

    if (!rzpResponse.ok) {
      throw new Error(orderData.error?.description || 'Failed to create Razorpay order')
    }

    // Persist the Razorpay order id AND the server-verified total (correcting any
    // client-supplied total from the initial insert) on the pending order row.
    // orders' RLS only allows admin UPDATEs, so this uses the service-role key.
    const { error: updateError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: orderData.id, total })
      .eq('id', order_id)

    if (updateError) {
      throw new Error(`Failed to save Razorpay order id: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        razorpay_order_id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        key_id: keyId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
