import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { order } = await req.json()

  // Generate PDF invoice HTML
  const invoiceHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a4731; color: white; padding: 20px; text-align: center;">
        <h1>Taseer Ayurved</h1>
        <p>68/30, Nagpur Vora Ki Chawl, Opp. Jhulta Minara, Gomtipur, Ahmedabad - 380021</p>
        <p>Phone: +91 7405410856</p>
      </div>

      <div style="padding: 20px; background: #f9f5f0;">
        <h2 style="color: #1a4731;">Invoice / Order Confirmation</h2>
        <p><strong>Order ID:</strong> ${order.id.slice(0,8).toUpperCase()}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-IN')}</p>
        <p><strong>Payment:</strong> Cash on Delivery (COD)</p>
      </div>

      <div style="padding: 20px;">
        <h3 style="color: #1a4731;">Customer Details</h3>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Address:</strong> ${order.address}, ${order.city} - ${order.pincode}</p>
      </div>

      <div style="padding: 20px;">
        <h3 style="color: #1a4731;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #1a4731; color: white;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
          ${order.items.map((item: any) => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px;">${item.name}</td>
              <td style="padding: 10px; text-align: center;">${item.qty}</td>
              <td style="padding: 10px; text-align: right;">₹${item.price}</td>
              <td style="padding: 10px; text-align: right;">₹${item.price * item.qty}</td>
            </tr>
          `).join('')}
          <tr style="background: #f9f5f0;">
            <td colspan="3" style="padding: 10px; text-align: right;">
              <strong>Shipping:</strong>
            </td>
            <td style="padding: 10px; text-align: right;">FREE</td>
          </tr>
          <tr style="background: #1a4731; color: white;">
            <td colspan="3" style="padding: 10px; text-align: right;">
              <strong>TOTAL:</strong>
            </td>
            <td style="padding: 10px; text-align: right;">
              <strong>₹${order.total}</strong>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding: 20px; background: #f9f5f0; text-align: center;">
        <p style="color: #1a4731;">
          <strong>Thank you for your order!</strong>
        </p>
        <p>Our team will call you within 24 hours to confirm delivery.</p>
        <p>For support: +91 7405410856</p>
        <p style="font-size: 12px; color: #666;">
          Taseer Ayurved | Ancient Medicine. Personally Prepared.
        </p>
      </div>
    </div>
  `

  // Send email via Resend
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Taseer Ayurved <onboarding@resend.dev>',
      to: [order.email],
      subject: `Order Confirmed - ${order.id.slice(0,8).toUpperCase()} | Taseer Ayurved`,
      html: invoiceHTML
    })
  })

  const result = await resendResponse.json()

  return new Response(
    JSON.stringify({ success: true, result }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
