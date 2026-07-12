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

  try {
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('order_id, razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required')
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keySecret) {
      throw new Error('Razorpay key secret not configured in Edge Function secrets.')
    }

    const expectedSignature = await computeSignature(razorpay_order_id, razorpay_payment_id, keySecret)
    const verified = expectedSignature === razorpay_signature

    // orders' RLS only allows admin UPDATEs, so this uses the service-role key.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: updateError } = await supabase
      .from('orders')
      .update(
        verified
          ? { payment_status: 'paid', payment_id: razorpay_payment_id, razorpay_signature }
          : { payment_status: 'failed' }
      )
      .eq('id', order_id)

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ verified }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: verified ? 200 : 400 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
