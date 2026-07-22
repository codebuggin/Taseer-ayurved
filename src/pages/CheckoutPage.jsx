import { motion } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  
  const [placing, setPlacing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: user?.email || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: ''
  });

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const finalTotal = cartTotal;

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) return;

    if (!formData.name || !formData.phone || !formData.address1 || !formData.city || !formData.state || !formData.pincode) {
      alert('Please fill all required fields');
      return;
    }

    if (formData.phone.length !== 10) {
      alert('Enter valid 10-digit phone number');
      return;
    }

    if (formData.pincode.length !== 6) {
      alert('Enter valid 6-digit pincode');
      return;
    }

    setPlacing(true);

    const fullAddress = formData.address2 ? `${formData.address1}, ${formData.address2}` : formData.address1;

    // Generated client-side rather than read back after insert: orders' RLS only lets a
    // logged-in customer (or admin) SELECT their own rows, which a guest checkout
    // (user_id: null) can never satisfy — auth.uid() = NULL is never true in SQL.
    const orderId = crypto.randomUUID();

    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          user_id: user?.id || null,
          items: cartItems,
          total: finalTotal,
          status: 'pending',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: fullAddress,
          city: formData.city,
          pincode: formData.pincode,
          payment_method: 'razorpay',
          payment_status: 'created',
          payment_id: null
        });

      if (error) {
        console.error('Order Insert Error details:', error);
        setPlacing(false);
        setTimeout(() => alert(`Order placement failed: ${error.message}. Please try again or contact support.`), 10);
        return;
      }

      const order = { id: orderId, payment_method: 'razorpay', payment_id: null };
      await startRazorpayPayment(order, fullAddress);
    } catch (err) {
      console.error('Unexpected error during order placement:', err);
      setPlacing(false);
      setTimeout(() => alert(`Unexpected error: ${err.message}. Please try again later.`), 10);
    }
  };

  // Shared by both payment methods once an order is confirmed (COD immediately, online after verification).
  const finalizeOrder = async (order, fullAddress) => {
    if (formData.email) {
      supabase.functions.invoke('send-invoice', {
        body: {
          order: {
            id: order.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: fullAddress,
            city: formData.city,
            pincode: formData.pincode,
            // Map quantity → qty to match edge function template
            items: cartItems.map(item => ({ ...item, qty: item.quantity })),
            total: finalTotal,
            payment_method: order.payment_method,
            payment_id: order.payment_id,
            created_at: new Date().toISOString()
          }
        }
      }).catch(err => console.error('Invoice email failed (non-critical):', err));
    }

    await clearCart();
    navigate(`/order-success/${order.id}`);
  };

  const startRazorpayPayment = async (order, fullAddress) => {
    const { data: rzpOrder, error: rzpError } = await supabase.functions.invoke('create-order', {
      body: {
        order_id: order.id,
        receipt: order.id,
        items: cartItems.map(item => ({ id: item.id, quantity: item.quantity }))
      }
    });

    if (rzpError || !rzpOrder?.razorpay_order_id) {
      console.error('Razorpay order creation failed:', rzpError || rzpOrder);
      setPlacing(false);
      alert('Could not start online payment. Please try again in a moment.');
      return;
    }

    if (!window.Razorpay) {
      setPlacing(false);
      alert('Payment gateway failed to load. Please refresh the page and try again.');
      return;
    }

    const rzp = new window.Razorpay({
      key: rzpOrder.key_id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      order_id: rzpOrder.razorpay_order_id,
      name: 'Taseer Ayurved',
      description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone
      },
      theme: { color: '#0d5c3a' },
      handler: async (rzpResponse) => {
        const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: {
            order_id: order.id,
            razorpay_order_id: rzpResponse.razorpay_order_id,
            razorpay_payment_id: rzpResponse.razorpay_payment_id,
            razorpay_signature: rzpResponse.razorpay_signature
          }
        });

        if (verifyError || !verifyResult?.verified) {
          setPlacing(false);
          alert(`Payment verification failed. If money was deducted, contact support with order ID: ${order.id.slice(0, 8).toUpperCase()}`);
          return;
        }

        await finalizeOrder({ ...order, payment_id: rzpResponse.razorpay_payment_id }, fullAddress);
      },
      modal: {
        ondismiss: () => {
          setPlacing(false);
          alert('Payment was not completed. Your order is saved as pending — you can try paying again from this page.');
        }
      }
    });

    rzp.open();
  };

  if (cartItems.length === 0) {
    return (
      <div className="pt-[140px] pb-24 bg-theme-bg-secondary min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-3xl border border-gray-200">
          <p className="font-body text-gray-500 mb-6 text-lg">Your cart is empty.</p>
          <Link to="/shop" className="bg-[#0d5c3a] text-white px-8 py-3 rounded-full font-body font-medium transition-colors hover:bg-emerald-800">Return to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-[140px] pb-24 bg-white min-h-screen"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/shop" className="text-[#0d5c3a] font-body text-[14px] font-medium hover:underline flex items-center gap-1">
            ← Continue Shopping
          </Link>
          <div className="flex items-center gap-2 text-theme-text-muted font-mono text-[10px] tracking-wider uppercase">
            <span>Secure Checkout</span>
          </div>
        </div>

        <h1 className="font-heading italic text-[40px] text-theme-text-primary mb-10 text-center">Checkout</h1>
        
        <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT COLUMN: Order Form */}
          <div className="flex-1">
            <h2 className="font-body font-bold text-2xl text-theme-text-primary mb-6">Delivery Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="md:col-span-2">
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Full Name *" 
                  className="w-full text-[15px] p-3 md:px-4 md:py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0d5c3a] focus:ring-2 focus:ring-[#0d5c3a]/20 transition-all font-body" 
                />
              </div>

              <div>
                <input 
                  required 
                  type="tel" 
                  maxLength={10}
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
                  placeholder="Phone Number (10 digits) *" 
                  className="w-full text-[15px] p-3 md:px-4 md:py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0d5c3a] focus:ring-2 focus:ring-[#0d5c3a]/20 transition-all font-body" 
                />
              </div>

              <div>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="Email Address (optional)" 
                  className="w-full text-[15px] p-3 md:px-4 md:py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0d5c3a] focus:ring-2 focus:ring-[#0d5c3a]/20 transition-all font-body" 
                />
              </div>

              <div className="md:col-span-2">
                <input 
                  required 
                  type="text" 
                  value={formData.address1} 
                  onChange={e => setFormData({...formData, address1: e.target.value})} 
                  placeholder="Address Line 1 (House No, Building, Street) *" 
                  className="w-full text-[15px] p-3 md:px-4 md:py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0d5c3a] focus:ring-2 focus:ring-[#0d5c3a]/20 transition-all font-body" 
                />
              </div>

              <div className="md:col-span-2">
                <input 
                  type="text" 
                  value={formData.address2} 
                  onChange={e => setFormData({...formData, address2: e.target.value})} 
                  placeholder="Address Line 2 (Area, Landmark) (optional)" 
                  className="w-full text-[15px] p-3 md:px-4 md:py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0d5c3a] focus:ring-2 focus:ring-[#0d5c3a]/20 transition-all font-body" 
                />
              </div>

              <div>
                <input 
                  required 
                  type="text" 
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})} 
                  placeholder="City *" 
                  className="w-full text-[15px] p-3 md:px-4 md:py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0d5c3a] focus:ring-2 focus:ring-[#0d5c3a]/20 transition-all font-body" 
                />
              </div>

              <div>
                <input 
                  required 
                  type="text" 
                  maxLength={6}
                  value={formData.pincode} 
                  onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} 
                  placeholder="Pincode (6 digits) *" 
                  className="w-full text-[15px] p-3 md:px-4 md:py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0d5c3a] focus:ring-2 focus:ring-[#0d5c3a]/20 transition-all font-body" 
                />
              </div>

              <div className="md:col-span-2">
                <select 
                  required
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                  className="w-full text-[15px] p-3 md:px-4 md:py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0d5c3a] focus:ring-2 focus:ring-[#0d5c3a]/20 transition-all font-body bg-white"
                >
                  <option value="" disabled>Select State *</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

            </div>
          </div>
          
          {/* RIGHT COLUMN: Order Summary */}
          <div className="w-full lg:w-[450px] shrink-0">
            <div className="bg-[#f8faf8] rounded-2xl p-6 lg:p-8 sticky top-32">
              <h2 className="font-body font-bold text-xl text-theme-text-primary mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-[64px] h-[64px] rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                      {item.image_url || item.img ? (
                        <img 
                          src={item.image_url || item.img} 
                          alt={item.name} 
                          className="w-full h-full object-cover mix-blend-multiply" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.parentNode.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 font-mono text-[8px] tracking-widest text-[#0d5c3a]">TASEER</div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 font-mono text-[8px] tracking-widest text-[#0d5c3a]">TASEER</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-body text-[14px] font-medium text-gray-800 leading-tight">{item.name}</h4>
                      <p className="font-mono text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4 space-y-3 font-body text-[15px]">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{cartTotal}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center mb-8">
                <span className="font-body font-bold text-[18px]">TOTAL</span>
                <span className="font-mono font-bold text-[24px]">₹{finalTotal}</span>
              </div>

              {/* PAYMENT SECTION */}
              <div className="mb-8">
                <h3 className="font-body font-semibold text-[16px] mb-3">Payment Method</h3>

                <div className="flex items-start gap-3 p-4 border-2 border-[#0d5c3a] rounded-xl bg-emerald-50">
                  <span className="mt-1">💳</span>
                  <div>
                    <h4 className="font-body font-semibold text-[#0d5c3a]">Online Payment</h4>
                    <p className="text-xs text-emerald-700/80 mt-1 font-medium">Card / UPI / Netbanking via Razorpay</p>
                  </div>
                </div>
              </div>

              <button
                disabled={placing}
                type="submit"
                className="w-full bg-[#e8a500] text-[#0d1f14] rounded-xl font-body font-bold text-[16px] py-4 transition-colors hover:bg-[#c9900a] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {placing ? 'Processing...' : `Pay ₹${finalTotal} →`}
              </button>

            </div>
          </div>

        </form>
      </div>
    </motion.div>
  );
}
