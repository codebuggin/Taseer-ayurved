import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, PhoneCall } from 'lucide-react';

export default function OrderSuccessPage() {
  const { orderId } = useParams();

  const shortOrderId = orderId ? orderId.split('-')[0] : 'xxxxxx';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-[160px] pb-24 bg-white min-h-screen flex flex-col items-center justify-center -mt-20"
    >
      <div className="max-w-xl mx-auto px-6 w-full text-center">
        
        {/* Animated Checkmark */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-emerald-100 text-[#0d5c3a] rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle size={48} strokeWidth={2.5} />
        </motion.div>

        <h1 className="font-heading italic text-[36px] md:text-[42px] text-theme-text-primary leading-tight mb-2">
          Order Placed Successfully!
        </h1>
        <p className="font-body text-[16px] text-emerald-700 font-medium mb-10">
          Jazak Allah Khair for your trust
        </p>

        {/* Order Details Box */}
        <div className="bg-[#f8faf8] border border-emerald-100 rounded-3xl p-8 mb-10 text-left">
          <div className="font-mono text-xs uppercase tracking-widest text-[#0d5c3a] font-bold mb-4">
            Order Reference
          </div>
          <p className="font-body text-[20px] font-bold text-gray-900 mb-6">
            #{shortOrderId}
          </p>
          
          <div className="flex flex-col gap-3 font-body text-[15px] text-gray-700 border-t border-emerald-100/60 pt-6">
            <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e8a500]"></span>
              Our team will call you within 24 hours to confirm your order details and dispatch your package.
            </p>
            <p className="flex items-center gap-3 font-medium text-[#0d5c3a] mt-2">
              <PhoneCall size={16} />
              Questions? Call: +91 74054 10856
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/shop" 
            className="w-full sm:w-auto px-8 py-3.5 bg-[#0d5c3a] text-white font-body font-semibold rounded-full hover:bg-emerald-800 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to="/my-orders"
            className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-[#0d5c3a] text-[#0d5c3a] font-body font-semibold rounded-full hover:bg-emerald-50 transition-colors"
          >
            View My Orders
          </Link>
        </div>

      </div>
    </motion.div>
  );
}
