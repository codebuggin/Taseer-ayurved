import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Star, ShieldCheck, Leaf, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

const fallbackProduct = {
  id: "fallback",
  name: "Product Not Found",
  category: "Unknown",
  price: 0,
  oldPrice: 0,
  description: "We couldn't find the product you're looking for.",
  benefit: "",
  image_url: ""
};

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      // Fetch strictly by slug to avoid UUID casting errors
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (!error && data) {
        setProduct(data);
      } else {
        setProduct(fallbackProduct);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-[140px] pb-24 bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-bg-deep"></div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.id === 'fallback') return;
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
  };

  const handleBuyNow = () => {
    if (product.id === 'fallback') return;
    handleAddToCart();
    navigate('/checkout');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-[80px] pb-24 bg-white min-h-screen"
    >
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
        <div className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider flex items-center gap-2">
          <Link to="/" className="hover:text-theme-bg-deep transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-theme-bg-deep transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-theme-text-primary truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-16">
        <div className="flex flex-col lg:flex-row gap-12 xl:gap-16">
          
          {/* Left: Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="w-full aspect-square bg-[#f0f7f3] rounded-3xl overflow-hidden border border-theme flex flex-col justify-center items-center relative group p-12">
               {product.original_price > product.price && (
                 <div className="absolute top-6 left-6 bg-theme-accent text-theme-text-primary font-mono text-[12px] font-bold px-4 py-1.5 rounded-full shadow-sm z-10">
                   {Math.round((1 - product.price/product.original_price) * 100)}% off
                 </div>
               )}

               {product.image_url ? (
                 <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl shadow-sm mix-blend-multiply group-hover:scale-105 transition-transform duration-700" />
               ) : (
                <div className="w-1/2 h-2/3 bg-white border border-theme rounded-2xl shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                  <div className="absolute top-0 w-full h-12 bg-[#0d5c3a]/10 border-b border-theme/30" />
                  <div className="absolute top-16 left-4 right-4 bottom-4 bg-white border border-theme/30 rounded-xl p-4 flex flex-col items-center justify-center">
                    <div className="w-full h-px bg-theme-accent/50 mb-4" />
                    <div className="font-heading border border-theme-accent/30 p-2 rounded text-[16px] text-theme-bg-deep text-center leading-none">{product.name.split(' ')[0]}</div>
                    <div className="font-mono text-[10px] tracking-widest text-theme-accent mt-3">TASEER</div>
                  </div>
                </div>
               )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-theme-bg-secondary border border-theme rounded-xl overflow-hidden cursor-pointer hover:border-theme-bg-deep transition-colors">
                   <img src={`https://images.unsplash.com/photo-1545843804-5f4e5deae5d7?w=200&h=200&fit=crop&q=80&sig=${i}`} alt="Thumbnail" className="w-full h-full object-cover mix-blend-multiply opacity-50" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center py-4">
            
            <div className="font-mono text-[11px] text-theme-accent font-bold uppercase tracking-widest mb-3">
              {product.category?.replace('-', ' ')}
            </div>
            
            <h1 className="font-heading text-[32px] md:text-[40px] text-theme-text-primary leading-[1.1] mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-3 mb-6 font-mono text-[12px] text-theme-text-muted">
              <div className="flex text-theme-accent">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} />
              </div>
              <span>(4.2)</span>
              <span>—</span>
              <a href="#reviews" className="underline hover:text-theme-bg-deep">124 reviews</a>
            </div>
            
            <div className="flex items-end gap-3 mb-8">
              <span className="font-body font-bold text-[32px] md:text-[40px] text-theme-bg-deep leading-none">
                ₹{product.price}
              </span>
              {product.original_price > product.price && (
                <>
                  <span className="font-body font-normal text-[18px] text-theme-text-muted line-through mb-1">
                    ₹{product.original_price}
                  </span>
                  <span className="bg-theme-accent text-theme-text-primary font-mono text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm mb-2 ml-2">
                    Save {Math.round((1 - product.price/product.original_price) * 100)}%
                  </span>
                </>
              )}
            </div>
            
            <div className="w-full h-px bg-theme mb-8" />
            
            <div className="mb-8">
              <h4 className="font-body font-semibold text-[15px] mb-3 text-theme-text-primary">Key Benefits</h4>
              <ul className="flex flex-col gap-2">
                <li className="flex items-start gap-3 font-body text-[14px] text-theme-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-theme-accent mt-2 flex-shrink-0" />
                  <span>{product.benefit || 'Promotes holistic wellness'}</span>
                </li>
                <li className="flex items-start gap-3 font-body text-[14px] text-theme-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-theme-accent mt-2 flex-shrink-0" />
                  <span>100% natural, vegetarian formula</span>
                </li>
                <li className="flex items-start gap-3 font-body text-[14px] text-theme-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-theme-accent mt-2 flex-shrink-0" />
                  <span>Sourced from premium herbs</span>
                </li>
              </ul>
            </div>
            
            {/* Action Area */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex items-center justify-between border border-theme-bg-deep rounded-full px-4 w-full sm:w-[120px] h-[52px]">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-theme-bg-deep hover:text-theme-accent transition-colors"><Minus size={16} /></button>
                <span className="font-mono text-[14px] text-theme-text-primary font-bold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="text-theme-bg-deep hover:text-theme-accent transition-colors"><Plus size={16} /></button>
              </div>
              
              <button onClick={handleAddToCart} className="flex-1 h-[52px] bg-theme-bg-deep text-white rounded-full font-body font-medium text-[15px] hover:shadow-lg hover:bg-theme-bg-deep/90 transition-all magnetic-btn disabled:opacity-50" disabled={product?.id === 'fallback'}>
                Add to Cart
              </button>
            </div>
            
            <button onClick={handleBuyNow} className="w-full h-[52px] bg-theme-accent text-theme-text-primary rounded-full font-body font-semibold text-[15px] hover:shadow-lg transition-all mb-8 disabled:opacity-50" disabled={product?.id === 'fallback'}>
              Buy Now
            </button>

            <div className="w-full h-px bg-theme mb-8" />
            
            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f0f7f3] text-theme-bg-deep flex items-center justify-center">
                  <Leaf size={18} />
                </div>
                <span className="font-mono text-[11px] text-theme-text-primary uppercase tracking-tight">100% Natural</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f0f7f3] text-theme-bg-deep flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <span className="font-mono text-[11px] text-theme-text-primary uppercase tracking-tight">AYUSH Certified</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f0f7f3] text-theme-bg-deep flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <span className="font-mono text-[11px] text-theme-text-primary uppercase tracking-tight">Free Shipping ₹499+</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="bg-theme-bg-secondary py-16 border-t border-theme border-b">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          
          <div className="flex items-center gap-8 border-b border-theme mb-10 overflow-x-auto no-scrollbar">
            {['description', 'how to use', 'ingredients'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-mono text-[13px] uppercase tracking-widest pb-4 transition-colors whitespace-nowrap relative ${
                  activeTab === tab ? 'text-theme-bg-deep font-bold' : 'text-theme-text-muted hover:text-theme-text-primary'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-[2px] bg-theme-bg-deep" />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="font-body text-[15px] text-theme-text-muted leading-relaxed"
              >
                {activeTab === 'description' && (
                  <p className="text-balance">{product.description || "The ancient botanical extract is tailored to balance and restore body functions naturally, offering deep holistic wellness."}</p>
                )}
                {activeTab === 'how to use' && (
                  <p>Take 1 {product.form === 'capsules' ? 'capsule' : product.form === 'churna' ? 'spoon' : product.form === 'oil' ? 'application' : 'dose'} twice daily with warm water or milk, preferably after meals. For optimal results, use consistently for a minimum of 3 months.</p>
                )}
                {activeTab === 'ingredients' && (
                  <ul className="list-disc pl-5 flex flex-col gap-2">
                    <li>Pure proprietary Ayurvedic herbs blend</li>
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
        </div>
      </div>
      
    </motion.div>
  );
}
