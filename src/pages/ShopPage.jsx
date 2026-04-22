import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

const categories = [
  { name: "All", slug: "all" },
  { name: "Thyroid", slug: "thyroid" },
  { name: "Piles & Fissure", slug: "piles" },
  { name: "Gallbladder", slug: "gallbladder" },
  { name: "Knee & Body Pain", slug: "bone-joint" },
  { name: "Hair Loss", slug: "hair-loss" },
  { name: "Weight Loss", slug: "weight-loss" },
  { name: "Cholesterol & BP", slug: "thyroid" },
  { name: "Men's Health", slug: "mens-health" },
  { name: "Women's Care", slug: "womens-care" },
  { name: "Women's Health", slug: "womens-health" },
  { name: "Gynecology", slug: "gynecology" },
  { name: "Women's Special", slug: "womens-special" },
  { name: "Skin & Glow", slug: "skin-care" },
  { name: "Cervical", slug: "cervical" },
  { name: "Spondylitis", slug: "spondylitis" }
];

const sensitiveCategories = [
  "mens-health", "womens-care", "womens-health", "gynecology", "womens-special"
];

export default function ShopPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState('');

  const [showFilterBar, setShowFilterBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlFilterBar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 150) {
          setShowFilterBar(false);
        } else {
          setShowFilterBar(true);
        }
        setLastScrollY(window.scrollY);
      }
    };
    window.addEventListener('scroll', controlFilterBar);
    return () => window.removeEventListener('scroll', controlFilterBar);
  }, [lastScrollY]);

  const { addToCart } = useCart();

  useEffect(() => {
    if (location.state?.orderSuccess) {
      setShowOrderSuccess(true);
      setOrderSuccessId(location.state.orderId);
      // Clean state so refresh doesn't trigger modal again
      navigate(location.pathname, { replace: true, state: {} });
    }

    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat && categories.some(c => c.slug === cat)) {
      setActiveCategory(cat);
    }
  }, [location, navigate]);

  useEffect(() => {
    async function fetchTopSellers() {
      const { data } = await supabase.from('products').select('*').eq('is_top_seller', true);
      if (data) setTopSellers(data);
    }
    fetchTopSellers();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      
      const isAll = !activeCategory || activeCategory.toLowerCase() === 'all';
      
      if (!isAll) {
        const matchingCategory = categories.find(c => c.slug.toLowerCase() === activeCategory.toLowerCase());
        query = query.eq('category', matchingCategory ? matchingCategory.slug : activeCategory);
      }
      
      const { data, error } = await query;
      if (!error && data) {
        if (isAll) {
          setProducts(data.filter(p => !sensitiveCategories.includes(p.category)));
        } else {
          setProducts(data);
        }
      }
      setLoading(false);
    }
    
    fetchProducts();
  }, [activeCategory]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-24 bg-theme-bg-secondary min-h-screen relative"
    >
      <AnimatePresence>
        {showOrderSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center border border-theme shadow-2xl"
            >
              <div className="w-20 h-20 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} />
              </div>
              <h2 className="font-heading font-bold text-2xl text-theme-text-primary mb-2">Order Confirmed!</h2>
              <p className="font-body text-[14px] text-theme-text-muted mb-6">
                Order placed successfully! 
                Our team will call you to confirm.
              </p>
              <div className="bg-theme-bg-secondary p-4 rounded-xl border border-theme mb-8">
                <div className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted mb-1">Order ID</div>
                <div className="font-mono font-bold text-theme-bg-deep">{orderSuccessId || 'Processing...'}</div>
              </div>
              <button 
                onClick={() => setShowOrderSuccess(false)}
                className="w-full bg-theme-bg-deep text-white font-body font-medium px-6 py-4 rounded-xl hover:bg-theme-accent hover:text-theme-text-primary transition-colors"
              >
                Continue Shopping
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner */}
      <div className="bg-theme-bg-deep py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="font-heading italic text-[48px] md:text-[64px] text-white leading-tight mb-4">
            Our Formulations
          </h1>
          <p className="font-body text-[16px] text-white/70 max-w-xl mx-auto">
            Traditional Ayurvedic remedies intuitively designed for modern wellness.
          </p>
        </div>
      </div>

      <div className="bg-theme-bg-secondary w-full py-12 border-b border-theme/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="font-heading font-bold text-[28px] text-theme-text-primary mb-8 flex items-center gap-3">
            <span className="text-theme-accent">⭐</span> Top Sellers
          </h2>
          
          <div className="flex overflow-x-auto no-scrollbar gap-6 pb-6 -mx-6 px-6 lg:mx-0 lg:px-0">
            {topSellers.map((product, i) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                key={`ts-${product.id}`}
                className="flex-none w-[280px] sm:w-[320px]"
              >
                <div className="block group bg-white rounded-[16px] overflow-hidden border border-theme hover:-translate-y-2 hover:shadow-xl transition-all duration-300 h-[480px] flex flex-col">
                  <Link to={`/shop/${product.slug}`} className="flex flex-col flex-grow overflow-hidden">
                    <div className="w-full h-[220px] relative bg-[#f0f7f3] border-b border-theme flex items-center justify-center shrink-0">
                      {product.original_price > product.price && (
                        <div className="absolute top-3 left-3 bg-theme-accent text-theme-text-primary font-mono text-[10px] font-bold px-3 py-1 rounded-full shadow-sm z-10">
                          {Math.round((1 - product.price / product.original_price) * 100)}% off
                        </div>
                      )}
                      {product.sale_active && product.sale_label && (
                        <div className="absolute top-3 right-3 z-20 bg-[#e53e3e] text-white font-bold text-[11px] px-2.5 py-1 shadow-md transform -rotate-[10deg] rounded-sm uppercase tracking-wide">
                          {product.sale_label}
                        </div>
                      )}
                      
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover shadow-sm mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-1/3 h-2/3 bg-white border border-theme/50 rounded-lg shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                          <div className="absolute top-0 w-full h-8 bg-[#0d5c3a]/10 border-b border-theme/30" />
                          <div className="absolute top-12 left-3 right-3 bottom-3 bg-white border border-theme/30 rounded p-2 flex flex-col items-center justify-center">
                            <div className="w-full h-px bg-theme-accent/50 mb-3" />
                            <div className="font-mono text-[8px] tracking-widest text-[#0d5c3a]">TASEER</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow justify-between">
                      <div>
                        <div className="font-mono text-[9px] text-theme-bg-deep uppercase tracking-wider mb-1 line-clamp-1">
                          {product.category?.replace('-', ' ')}
                        </div>
                        <h3 className="font-heading font-semibold text-[16px] text-theme-text-primary leading-snug mb-1 line-clamp-2" title={product.name}>
                          {product.name}
                        </h3>
                        <p className="font-body text-[12px] text-theme-text-muted mb-4 line-clamp-2" title={product.benefit}>
                          {product.benefit || 'Pure botanical extract'}
                        </p>
                      </div>
                      
                      <div className="flex items-baseline gap-2 mt-auto">
                        <span className="font-body font-bold text-[20px] text-theme-bg-deep">
                          ₹{product.price}
                        </span>
                        {product.original_price > product.price && (
                          <span className="font-body font-normal text-[13px] text-theme-text-muted line-through">
                            ₹{product.original_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="p-5 pt-0 flex gap-2 shrink-0">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                        navigate('/checkout');
                      }}
                      className="flex-1 py-2.5 bg-theme-bg-deep text-white font-body font-medium text-[12px] uppercase text-center rounded-xl hover:bg-theme-accent hover:text-theme-text-primary transition-colors duration-300 shadow-sm"
                    >
                      Buy Now
                    </button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }} className="flex-1 py-2.5 bg-theme-bg-secondary border border-theme text-theme-text-primary font-body font-medium text-[12px] uppercase rounded-xl hover:bg-emerald-50 transition-colors duration-300">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div 
        className={`border-b border-theme bg-white sticky z-30 shadow-sm transition-all duration-300`}
        style={{ top: showFilterBar ? '73px' : '-100px' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex overflow-x-auto no-scrollbar py-4 gap-2">
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-body text-[13px] font-medium transition-all ${
                activeCategory === cat.slug 
                  ? 'bg-theme-bg-deep text-white shadow-md' 
                  : 'bg-theme-bg-secondary text-theme-text-muted hover:text-theme-text-primary hover:bg-theme'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sensitive Products Banner */}
      <AnimatePresence>
        {sensitiveCategories.includes(activeCategory) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-gray-100 border-b border-gray-200 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3 flex items-center justify-center gap-2">
              <span className="text-[14px]">🔒</span>
              <p className="font-body text-[12px] text-gray-600 font-medium tracking-wide">
                Discreet plain packaging. Your privacy is guaranteed.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-bg-deep"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-theme-text-muted font-body">
            No products found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
            {products.map((product, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                key={product.id}
              >
                <div className="block group bg-white rounded-[16px] overflow-hidden border border-theme hover:-translate-y-2 hover:shadow-xl transition-all duration-300 h-[480px] flex flex-col">
                  <Link to={`/shop/${product.slug}`} className="flex flex-col flex-grow overflow-hidden">
                    <div className="w-full h-[220px] relative bg-[#f0f7f3] border-b border-theme flex items-center justify-center shrink-0">
                      {product.original_price > product.price && (
                        <div className="absolute top-3 left-3 z-10 bg-theme-accent text-theme-text-primary font-mono text-[10px] font-bold px-3 py-1 rounded-full shadow-sm z-10">
                          {Math.round((1 - product.price / product.original_price) * 100)}% off
                        </div>
                      )}
                      {product.sale_active && product.sale_label && (
                        <div className="absolute top-3 right-3 z-20 bg-[#e53e3e] text-white font-bold text-[11px] px-2.5 py-1 shadow-md transform -rotate-[10deg] rounded-sm uppercase tracking-wide">
                          {product.sale_label}
                        </div>
                      )}
                      
                      {/* Product Image / Abstract Bottle Shape */}
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover shadow-sm mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-1/3 h-2/3 bg-white border border-theme/50 rounded-lg shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                          <div className="absolute top-0 w-full h-8 bg-[#0d5c3a]/10 border-b border-theme/30" />
                          <div className="absolute top-12 left-3 right-3 bottom-3 bg-white border border-theme/30 rounded p-2 flex flex-col items-center justify-center">
                            <div className="w-full h-px bg-theme-accent/50 mb-3" />
                            <div className="font-mono text-[8px] tracking-widest text-[#0d5c3a]">TASEER</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow justify-between">
                      <div>
                        <div className="font-mono text-[9px] text-theme-bg-deep uppercase tracking-wider mb-1 line-clamp-1">
                          {product.category?.replace('-', ' ')}
                        </div>
                        <h3 className="font-heading font-semibold text-[16px] text-theme-text-primary leading-snug mb-1 line-clamp-2" title={product.name}>
                          {product.name}
                        </h3>
                        <p className="font-body text-[12px] text-theme-text-muted mb-4 line-clamp-2" title={product.benefit}>
                          {product.benefit || 'Pure botanical extract'}
                        </p>
                      </div>
                      
                      <div className="flex items-baseline gap-2 mt-auto">
                        <span className="font-body font-bold text-[20px] text-theme-bg-deep">
                          ₹{product.price}
                        </span>
                        {product.original_price > product.price && (
                          <span className="font-body font-normal text-[13px] text-theme-text-muted line-through">
                            ₹{product.original_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="p-5 pt-0 flex gap-2 shrink-0">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                        navigate('/checkout');
                      }}
                      className="flex-1 py-2.5 bg-theme-bg-deep text-white font-body font-medium text-[12px] uppercase text-center rounded-xl hover:bg-theme-accent hover:text-theme-text-primary transition-colors duration-300 shadow-sm"
                    >
                      Buy Now
                    </button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }} className="flex-1 py-2.5 bg-theme-bg-secondary border border-theme text-theme-text-primary font-body font-medium text-[12px] uppercase rounded-xl hover:bg-emerald-50 transition-colors duration-300">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
