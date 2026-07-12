import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

async function computeSignature(orderId: string, paymentId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}|${paymentId}`))
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // orders' RLS only allows admin UPDATEs/reads of other users' rows, so this uses the service-role key.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const markFailed = async (order_id: string) => {
    await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order_id)
  }

  try {
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('order_id, razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required')
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys not configured in Edge Function secrets.')
    }

    // 1. The razorpay_order_id must match the one create-order generated and stored for
    //    THIS specific order — otherwise a valid signature from a completely different
    //    (e.g. much cheaper) order could be replayed here to mark this order as paid.
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('id, total, razorpay_order_id')
      .eq('id', order_id)
      .single()

    if (orderFetchError || !order) {
      throw new Error('Order not found')
    }

    if (order.razorpay_order_id !== razorpay_order_id) {
      await markFailed(order_id)
      return new Response(
        JSON.stringify({ verified: false, error: 'razorpay_order_id does not match the order on record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. The signature must be one Razorpay itself computed for this exact order/payment pair.
    const expectedSignature = await computeSignature(razorpay_order_id, razorpay_payment_id, keySecret)
    if (expectedSignature !== razorpay_signature) {
      await markFailed(order_id)
      return new Response(
        JSON.stringify({ verified: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 3. Independently fetch the payment from Razorpay and confirm it was actually captured
    //    for the expected amount — never trust the client's word (or the signature alone)
    //    for how much money actually moved.
    const auth = btoa(`${keyId}:${keySecret}`)
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    })
    const payment = await paymentResponse.json()

    const expectedAmountPaise = Math.round(Number(order.total) * 100)
    const paymentValid =
      paymentResponse.ok &&
      payment.order_id === razorpay_order_id &&
      payment.status === 'captured' &&
      payment.amount === expectedAmountPaise

    if (!paymentValid) {
      await markFailed(order_id)
      return new Response(
        JSON.stringify({ verified: false, error: 'Payment could not be confirmed with Razorpay' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', payment_id: razorpay_payment_id, razorpay_signature })
      .eq('id', order_id)

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ verified: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
