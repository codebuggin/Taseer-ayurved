import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// This is a placeholder for the Razorpay server-side integration.
// You will need to add razorpay to your deno imports or use standard fetch to Razorpay API.

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'INR', receipt } = await req.json()

    // 1. Initialize Razorpay (Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Supabase Secrets)
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys not configured in Edge Function secrets.')
    }

    // 2. Call Razorpay API to create an order
    const auth = btoa(`${keyId}:${keySecret}`);
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt
      })
    })

    const orderData = await rzpResponse.json()

    if (!rzpResponse.ok) {
      throw new Error(orderData.error?.description || 'Failed to create Razorpay order')
    }

    // 3. Return the order ID to the client
    return new Response(
      JSON.stringify(orderData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
