import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ShopPreview() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopSellers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_top_seller', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchTopSellers();
  }, []);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleCardClick = (id) => {
    navigate(`/shop/${id}`);
  };

  return (
    <section id="formulations" className="py-20 bg-theme-bg-secondary border-t border-theme border-b">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="text-center mb-10">
          <h2 className="font-heading italic text-4xl md:text-[52px] text-theme-text-primary mb-4">
            Our Most Trusted Formulations
          </h2>
          <p className="font-body text-[#6b7c6e] font-light text-center mt-2">
            Discreet delivery · All India courier available
          </p>
          <p className="font-mono text-[11px] text-[#6b7c6e] text-center mt-3">
            🔒 All orders shipped in plain, unmarked packaging. Your privacy is fully protected.
          </p>
        </div>

        {/* Static Tabs placeholder (These don't filter in Preview to keep it simple, or we could link them to ShopPage) */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {["Top Sellers", "New Additions", "Essential Kits"].map((tab, i) => (
            <Link 
              to="/shop"
              key={i} 
              className={`rounded-full px-5 py-2 font-body text-[13px] tracking-wide uppercase transition-all duration-300 ${i === 0 ? 'bg-emerald-700 text-white' : 'border border-emerald-700 text-emerald-700 hover:bg-[#f0f7f3]'}`}
            >
              {tab}
            </Link>
          ))}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-bg-deep"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((product) => (
              <div 
                key={product.id}
                onClick={() => handleCardClick(product.slug)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col relative group cursor-pointer"
              >
                <div className={`absolute top-3 left-3 z-10 ${product.is_bestseller ? 'bg-amber-500' : 'bg-emerald-600'} text-white text-xs font-mono px-2 py-1 rounded-full shadow-md`}>
                  {product.is_bestseller ? 'BESTSELLER' : 'POPULAR'}
                </div>
                {product.sale_active && product.sale_label && (
                  <div className="absolute top-3 right-3 z-20 bg-[#e53e3e] text-white font-bold text-[11px] px-2.5 py-1 shadow-md transform -rotate-[10deg] rounded-sm">
                    {product.sale_label}
                  </div>
                )}
                <div className="w-full aspect-square relative bg-[#f4f7f5] overflow-hidden flex items-center justify-center p-8">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700" />
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
                <div className="flex flex-col flex-grow py-4">
                  <div className="text-xs font-mono text-emerald-700 uppercase tracking-wider px-4">{product.category?.replace('-', ' ')}</div>
                  <h3 className="font-semibold text-gray-900 text-lg px-4 mt-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 px-4 mt-1 flex-grow">{product.benefit || 'Pure botanical wellness'}</p>
                  <div className="flex items-baseline gap-2 px-4 mt-3">
                    <span className="text-emerald-700 font-bold text-xl">₹{product.price}</span>
                    {product.original_price > product.price && (
                      <span className="text-gray-400 text-sm line-through">₹{product.original_price}</span>
                    )}
                    {product.original_price > product.price && (
                      <span className="font-mono text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">
                        Save {Math.round((1 - product.price/product.original_price) * 100)}%
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => handleAddToCart(e, product)}
                    className="w-full mt-4 py-3 bg-emerald-700 text-white text-sm font-medium tracking-wide uppercase rounded-none hover:bg-amber-500 hover:text-gray-900 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </section>
  );
}
