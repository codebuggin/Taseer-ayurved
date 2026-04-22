import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartSidebar({ isOpen, setIsOpen }) {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[60] bg-[#0d1f14]/40 backdrop-blur-sm transition-opacity"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-[100dvh] w-full max-w-[400px] bg-theme-bg-primary shadow-[-20px_0_40px_rgba(13,92,58,0.1)] z-[70] flex flex-col border-l border-theme"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-theme flex items-center justify-between">
              <h2 className="font-heading font-semibold text-2xl text-theme-text-primary">Your Cart</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-theme-bg-secondary rounded-full transition-colors text-theme-text-muted"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto px-6 py-4 no-scrollbar">
              {cartItems.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {/* Item Image */}
                      <div className="w-[80px] h-[80px] bg-theme-bg-secondary border border-theme rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image_url || item.img ? (
                          <img 
                            src={item.image_url || item.img} 
                            alt={item.name} 
                            className="w-full h-full object-cover mix-blend-multiply opacity-80"
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.target.onerror = null;
                              e.target.parentNode.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 font-mono text-[8px] tracking-widest text-[#0d5c3a]">TASEER</div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 font-mono text-[8px] tracking-widest text-[#0d5c3a]">TASEER</div>
                        )}
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex flex-col flex-grow py-1">
                        <h3 className="font-heading font-medium text-[15px] text-theme-text-primary mb-1 line-clamp-2 leading-tight">
                          {item.name}
                        </h3>
                        <p className="font-body font-semibold text-theme-bg-deep text-[14px]">
                          ₹{item.price}
                        </p>
                        
                        {/* Qty Controls */}
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-3 border border-theme rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-theme-text-muted hover:text-theme-bg-deep transition-colors"><Minus size={14} /></button>
                            <span className="font-mono text-[12px]">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-theme-text-muted hover:text-theme-bg-deep transition-colors"><Plus size={14} /></button>
                          </div>
                          
                          <button onClick={() => removeFromCart(item.id)} className="text-[12px] font-body text-theme-text-muted underline underline-offset-2 hover:text-red-500 transition-colors">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-theme-bg-secondary rounded-full flex items-center justify-center mb-6 text-theme-bg-deep/50">
                    <ShoppingBag size={32} />
                  </div>
                  <h3 className="font-heading text-xl text-theme-text-primary mb-2">Your cart is empty</h3>
                  <p className="font-body text-theme-text-muted text-[15px] max-w-[200px]">
                    Looks like you haven't added any formulations yet.
                  </p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="mt-8 px-8 py-3 bg-theme-accent text-theme-text-primary font-medium rounded-full hover:shadow-lg transition-all"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            {cartItems.length > 0 && (
              <div className="border-t border-theme p-6 bg-theme-bg-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-[15px] text-theme-text-muted">Subtotal</span>
                  <span className="font-body font-bold text-[18px] text-theme-text-primary">₹{subtotal}</span>
                </div>
                <p className="font-body text-[12px] text-theme-text-muted mb-6">
                  Taxes and shipping calculated at checkout.
                </p>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full bg-theme-bg-deep text-white py-4 rounded-xl font-body font-medium uppercase tracking-wide hover:bg-theme-accent hover:text-theme-text-primary transition-all duration-300"
                >
                  Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
