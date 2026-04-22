import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const sloganMap = {
  'thyroid': 'Thyroid Jadh Se Khatam! ✓',
  'piles': 'Bawaseer Jadh Se Khatam! ✓',
  'gallbladder': 'Gallbladder Stone Jadh Se Khatam! ✓',
  'cervical': 'Cervical Dard Jadh Se Khatam! ✓',
  'spondylitis': 'Spondylitis Jadh Se Khatam! ✓',
  'mens-health': 'Mardana Kamzori Jadh Se Khatam! ✓',
  'womens-care': 'Khwateen Ki Takleef Jadh Se Khatam! ✓',
  'womens-special': 'Sehat Aur Husn Mein Izafa! ✓',
  'womens-health': 'Khwateen Ki Sehat Jadh Se Behtar! ✓',
  'gynecology': 'Amraz-e-Niswan Jadh Se Khatam! ✓',
  'skin-care': 'Rang Nikhaar Aur Chamak Badhao! ✓',
  'bone-joint': 'Ghutno Ka Dard Jadh Se Khatam! ✓',
  'default': 'Bimari Jadh Se Khatam! ✓'
};

export default function Hero() {
  const comp = useRef();
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function fetchCarouselProducts() {
      const { data } = await supabase.from('products').select('*').eq('is_top_seller', true);
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchCarouselProducts();
  }, []);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 30,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.1
      });
    }, comp);
    return () => ctx.revert();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (products.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [products.length, isHovered]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  // Touch swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    if (touchStartX.current - touchEndX.current > 50) handleNext();
    if (touchStartX.current - touchEndX.current < -50) handlePrev();
  };

  return (
    <section ref={comp} style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      height: 'calc(100vh - 144px)',
      overflow: 'hidden'
    }} className="relative w-full hero-mobile-container">
      <style>{`
        @media (max-width: 768px) {
          .hero-mobile-container {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto auto !important;
            height: auto !important;
            min-height: 100svh !important;
            overflow: visible !important;
          }
          .hero-mobile-left {
            padding: 2rem 1.5rem 1.5rem 1.5rem !important;
            order: 1 !important;
          }
          .hero-mobile-h1 {
            font-size: clamp(2rem, 8vw, 2.8rem) !important;
            line-height: 1.08 !important;
          }
          .hero-mobile-subtext {
            font-size: 0.875rem !important;
          }
          .hero-mobile-btn-container {
            /* padding container block */
          }
          .hero-mobile-btn-primary {
            width: 100% !important;
            text-align: center !important;
            white-space: nowrap !important;
            padding: 0.75rem 1.5rem !important;
          }
          .hero-mobile-link {
            display: block !important;
            margin-top: 0.75rem !important;
            text-align: center !important;
            width: 100% !important;
            margin-left: 0 !important;
          }
          .hero-mobile-trust {
            font-size: 11px !important;
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
            justify-content: center;
            text-align: center;
          }
          .hero-mobile-right {
            order: 2 !important;
            min-height: 420px !important;
            height: 420px !important;
            padding: 1rem !important;
          }
          .hero-mobile-slogan {
            font-size: clamp(16px, 5vw, 22px) !important;
            line-height: 1.4 !important;
            word-break: keep-all !important;
            white-space: normal !important;
            text-align: center !important;
            padding: 0 0.5rem !important;
          }
          .hero-mobile-card {
            border-radius: 12px !important;
            width: 100% !important;
          }
          .hero-mobile-img {
            height: 180px !important;
          }
          .hero-mobile-title {
            font-size: 16px !important;
          }
          .hero-mobile-desc {
            font-size: 13px !important;
          }
          .hero-mobile-price {
            font-size: 18px !important;
          }
          .hero-mobile-action {
            font-size: 13px !important;
            padding: 0.6rem 0.75rem !important;
          }
        }
      `}</style>
      
      {/* LEFT COLUMN */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2rem 2rem 2rem 4rem',
        height: '100%',
        gap: '0'
      }} className="bg-theme-bg-primary relative z-10 border-r border-gray-100 hero-mobile-left">
          
        {/* Badge */}
        <div className="hero-stagger font-mono text-[11px] text-theme-accent tracking-widest uppercase" style={{marginBottom:'0.6rem'}}>
          AYUSH CERTIFIED · HAND-PREPARED · AHMEDABAD
        </div>

        {/* Heading */}
        <h1 className="hero-stagger hero-mobile-h1" style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:'clamp(1.7rem, 2.8vw, 3rem)',
          fontWeight:900,
          lineHeight:1.05,
          margin:0,
          marginBottom:'0.9rem'
        }}>
          Ancient<br/>
          <em style={{color:'#0d5c3a'}}>Medicine.</em><br/>
          <span style={{color:'#e8a500'}}>
            Personally<br/>Prepared.
          </span>
        </h1>

        {/* Subtext */}
        <p className="hero-stagger font-body hero-mobile-subtext" style={{
          fontSize:'0.95rem',
          color:'#4a5568',
          lineHeight:1.6,
          maxWidth:'380px',
          margin:0,
          marginBottom:'1.1rem'
        }}>
          Every formulation carries 20 years of research
          and Vaid Ali Shaikh's personal commitment.
        </p>

        {/* Buttons */}
        <div className="hero-stagger inline-flex flex-wrap hero-mobile-btn-container" style={{
          display:'flex',
          gap:'1rem',
          alignItems:'center',
          marginBottom:'1rem'
        }}>
          <Link to="/contact" className="magnetic-btn bg-theme-bg-deep text-white px-10 py-4 ml-0 rounded-full font-body font-medium text-[16px] hover:shadow-lg hover:bg-[#0a4d30] transition-all hero-mobile-btn-primary">
            Book a Consultation →
          </Link>
          <Link to="/shop" className="font-body font-medium text-[15px] text-theme-accent hover:underline underline-offset-4 decoration-2 hero-mobile-link">
            View Formulations
          </Link>
        </div>

        {/* Trust dots */}
        <div className="hero-stagger font-mono text-[11px] text-theme-text-muted uppercase tracking-wider relative pt-4 border-t border-theme-border w-full hero-mobile-trust" style={{marginBottom:0}}>
          12,000+ Patients · 20+ Years · AYUSH Certified
        </div>

      </div>
      
      {/* RIGHT COLUMN */}
      <div 
        className="hero-mobile-right bg-emerald-800 relative z-0 flex flex-col items-center justify-center p-6 lg:p-8 overflow-hidden h-full w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex="0"
        onKeyDown={handleKeyDown}
        ref={carouselRef}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 text-emerald-200">
            <div className="animate-spin w-10 h-10 border-b-2 border-white rounded-full"></div>
            <span className="font-mono text-sm uppercase tracking-widest">Loading...</span>
          </div>
        ) : products.length > 0 ? (
          <div className="w-full max-w-[340px] flex flex-col items-center relative z-10 mx-auto">
            {/* Slogan at top */}
            <div 
              key={`slogan-${currentIndex}`}
              className="hero-mobile-slogan"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(18px, 2.2vw, 24px)',
                color: '#e8a500',
                fontWeight: 700,
                fontStyle: 'italic',
                textAlign: 'center',
                marginBottom: '1.5rem',
                width: '100%',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.3s ease-in-out'
              }}
            >
              {sloganMap[products[currentIndex]?.category] || sloganMap['default']}
            </div>

            <style>{`
              @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
              }
            `}</style>

            {/* Product Card */}
            <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden relative hero-mobile-card" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)', height: '400px' }}>
              <div style={{
                display: 'flex',
                height: '100%',
                transition: 'transform 0.3s ease-in-out',
                transform: `translateX(-${currentIndex * 100}%)`
              }}>
                {products.map((product, idx) => (
                  <div 
                    key={idx} 
                    className="h-full cursor-pointer group flex flex-col" 
                    style={{ flex: '0 0 100%', minWidth: '100%', maxWidth: '100%', overflow: 'hidden' }}
                    onClick={() => navigate(`/shop/${product.slug}`)}
                  >
                    {/* product image */}
                    <div className="w-full h-1/2 shrink-0 bg-gray-50 relative overflow-hidden hero-mobile-img">
                      {product.image_url ? (
                        <img 
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-[10px] tracking-widest text-[#0d5c3a]">TASEER</div>
                      )}
                      {product.original_price > product.price && (
                        <div className="absolute top-4 left-4 bg-amber-500 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          {Math.round((1 - product.price / product.original_price) * 100)}% off
                        </div>
                      )}
                    </div>

                    {/* card content */}
                    <div className="p-5 flex flex-col bg-white flex-1 justify-between">
                      <div>
                        <div className="font-mono text-[10px] text-emerald-700 uppercase tracking-wider mb-1">
                          {product.category?.replace('-', ' ')}
                        </div>
                        <h3 className="text-gray-900 text-[20px] font-semibold leading-tight hero-mobile-title mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
                          {product.name}
                        </h3>
                        <p className="font-body text-[13px] text-gray-500 line-clamp-1 mb-3 hero-mobile-desc">
                          {product.benefit || 'Pure botanical extract'}
                        </p>
                        
                        <div className="flex items-baseline mb-4">
                          <span className="font-body font-bold text-[22px] text-emerald-700 hero-mobile-price">₹{product.price}</span>
                          {product.original_price > product.price && (
                             <span className="font-body text-[13px] text-gray-400 line-through ml-2 hero-mobile-desc">₹{product.original_price}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                          navigate('/checkout'); // <-- ADDED: navigate to checkout immediately after adding 
                        }}
                        className="w-full bg-emerald-700 text-white rounded-xl py-3 font-body font-medium text-[14px] hover:bg-emerald-800 transition-colors shadow-sm hero-mobile-action mt-auto shrink-0"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots navigation */}
            <div className="flex gap-1.5 mt-6 justify-center">
              {products.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCurrentIndex(idx)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    height: '8px',
                    width: idx === currentIndex ? '20px' : '8px',
                    backgroundColor: idx === currentIndex ? '#e8a500' : 'rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </div>

            {/* Prev/Next arrows - Absolute positioned */}
            <button onClick={handlePrev} className="absolute left-[-20px] sm:left-[-40px] md:left-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-lg z-10 backdrop-blur-sm hidden sm:flex">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNext} className="absolute right-[-20px] sm:right-[-40px] md:right-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-lg z-10 backdrop-blur-sm hidden sm:flex">
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
           <div className="text-emerald-200 text-center font-mono text-sm">No formulations available right now.</div>
        )}
      </div>
      
    </section>
  );
}
