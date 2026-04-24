import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, User, Menu, LogOut, ChevronDown, Package, X, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import TopSellersMarquee from './TopSellersMarquee';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { openCart, cartCount } = useCart();
  const { user, signOut } = useAuth();
  const searchInputRef = useRef(null);
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(100);

  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowNavbar(currentScrollY <= lastScrollY || currentScrollY <= 10);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ESC closes search
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeSearch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Measure header height + focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setHeaderH(headerRef.current?.offsetHeight ?? 100);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Debounced product search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, category, price, image_url')
        .ilike('name', `%${searchQuery}%`)
        .limit(8);
      setSearchResults(data || []);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleProductClick = (slug) => {
    navigate(`/shop/${slug}`);
    closeSearch();
  };

  return (
    <>
      {/* ── Compact Search Dropdown ── */}
      {searchOpen && (
        <>
          {/* Backdrop — dims page, click to close */}
          <div
            className="fixed inset-0 z-[199] bg-black/25"
            onClick={closeSearch}
          />

          {/* Search panel — slides below navbar */}
          <div
            className="fixed left-0 right-0 z-[200] flex justify-center px-4"
            style={{ top: headerH + 6 }}
          >
            <div className="w-full max-w-[500px]">
              {/* Input */}
              <div className="flex items-center h-11 bg-white rounded-2xl shadow-xl border border-gray-200 px-3 gap-2">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products or conditions..."
                  className="flex-1 h-full outline-none font-body text-[14px] text-gray-800 placeholder-gray-400 bg-transparent"
                />
                {searchLoading && (
                  <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />
                )}
                <button onClick={closeSearch} className="p-0.5 hover:opacity-60 transition-opacity shrink-0">
                  <X size={16} color="#666" />
                </button>
              </div>

              {/* Results dropdown */}
              {searchQuery.trim() && (
                <div className="mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="max-h-[350px] overflow-y-auto">
                    {searchLoading && (
                      <div className="flex justify-center py-6">
                        <Loader2 size={20} className="animate-spin text-gray-300" />
                      </div>
                    )}
                    {!searchLoading && searchResults.length === 0 && (
                      <p className="text-center font-body text-[13px] text-gray-400 py-6">
                        No results for "<span className="font-medium text-gray-600">{searchQuery}</span>"
                      </p>
                    )}
                    {searchResults.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.slug)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {product.image_url
                            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                            : <ShoppingBag size={14} className="text-gray-300" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-[13px] text-gray-900 truncate group-hover:text-[#0d5c3a] transition-colors">{product.name}</p>
                          <p className="font-mono text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{product.category}</p>
                        </div>
                        <span className="font-mono font-bold text-[13px] text-[#0d5c3a] shrink-0">₹{product.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    <header
      ref={headerRef}
      className="fixed top-0 left-0 w-full z-50 transition-transform duration-300 bg-white"
      style={{
        transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
        boxShadow: showNavbar && lastScrollY > 10 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
      }}
    >

      {/* ── Announcement bar ── */}
      <div className="bg-emerald-700 text-white text-center py-2 text-sm font-mono w-full nav-mobile-announcement relative z-50">
        <span className="hidden sm:inline">
          🚚 All India Courier Service Available · Call: +91 74054 10856 · Discreet Packaging Guaranteed
        </span>
        <span className="sm:hidden">
          🚚 All India Delivery · 📞 74054 10856
        </span>
      </div>

      {isHome && (
        <div className="w-full relative z-40 bg-white border-b border-gray-100">
          <TopSellersMarquee />
        </div>
      )}

      {/* ── Main nav bar ── */}
      <nav
        className="w-full relative z-30 transition-all duration-300 nav-mobile-container"
        style={{
          height: '72px',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: '#ffffff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>

          <style>{`
            @media (max-width: 768px) {
              .nav-mobile-container {
                height: auto !important;
                min-height: 56px !important;
                padding: 0.6rem 0.75rem !important;
                align-items: center !important;
                flex-wrap: nowrap !important;
              }
              .nav-mobile-brand-font { font-size: 18px !important; }
              .nav-mobile-logo-svg { width: 32px !important; height: 32px !important; }
              .nav-mobile-announcement {
                font-size: 10px !important;
                padding: 5px 8px !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
              }
            }
          `}</style>

          {/* Logo */}
          <Link
            to="/"
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '3px solid #e8a500', paddingLeft: '10px', marginLeft: 0 }}
            className="hover:opacity-80 transition-opacity"
          >
            <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="nav-mobile-logo-svg">
              <path d="M18 75 C8 65 6 50 12 38" stroke="#0d5c3a" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M12 70 C6 63 8 53 14 50 C14 50 16 58 12 70Z" fill="#0d5c3a"/>
              <path d="M10 58 C4 50 7 40 14 38 C14 38 15 47 10 58Z" fill="#1a7a50"/>
              <path d="M13 46 C9 37 13 27 20 27 C20 27 19 37 13 46Z" fill="#0d5c3a"/>
              <path d="M19 36 C17 26 22 17 29 18 C29 18 26 28 19 36Z" fill="#1a7a50"/>
              <path d="M82 75 C92 65 94 50 88 38" stroke="#0d5c3a" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M88 70 C94 63 92 53 86 50 C86 50 84 58 88 70Z" fill="#0d5c3a"/>
              <path d="M90 58 C96 50 93 40 86 38 C86 38 85 47 90 58Z" fill="#1a7a50"/>
              <path d="M87 46 C91 37 87 27 80 27 C80 27 81 37 87 46Z" fill="#0d5c3a"/>
              <path d="M81 36 C83 26 78 17 71 18 C71 18 74 28 81 36Z" fill="#1a7a50"/>
              <path d="M28 58 C28 58 30 78 50 78 C70 78 72 58 72 58 Z" fill="#e8d5b0"/>
              <ellipse cx="50" cy="58" rx="22" ry="6" fill="#d4b896"/>
              <ellipse cx="40" cy="56" rx="8" ry="2.5" fill="#f0e0c0" opacity="0.6"/>
              <path d="M44 36 L54 56" stroke="#c4a882" strokeWidth="5" strokeLinecap="round"/>
              <ellipse cx="42" cy="34" rx="5" ry="7" fill="#d4b896" transform="rotate(-20 42 34)"/>
              <path d="M50 58 C50 58 44 46 48 38 C48 38 54 44 50 58Z" fill="#4ade80"/>
              <path d="M50 58 C50 58 56 46 52 38 C52 38 46 44 50 58Z" fill="#22c55e"/>
              <path d="M50 58 C50 58 50 44 50 36 C53 40 53 52 50 58Z" fill="#16a34a"/>
              <path id="arc" d="M32 82 Q50 90 68 82" fill="none"/>
              <text fontSize="7" fill="#e8a500" fontFamily="serif" letterSpacing="1">
                <textPath href="#arc" startOffset="15%">تاثیر آیورود</textPath>
              </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 800, color: '#0d1f14', lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }} className="nav-mobile-brand-font">
                Taseer Ayurved
              </span>
              <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '12px', color: '#0d5c3a', marginTop: '4px', lineHeight: 1 }}>
                حکیم علی شیخ
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center justify-center font-body" style={{ gap: '2rem', flex: 1 }}>
            <Link to="/shop" style={{ fontSize: '15px', color: '#4a5568' }} className="hover:text-theme-bg-deep transition-colors lift-link">Formulations</Link>
            <Link to="/about" style={{ fontSize: '15px', color: '#4a5568' }} className="hover:text-theme-bg-deep transition-colors lift-link">About</Link>
            <Link to="/testimonials" style={{ fontSize: '15px', color: '#4a5568' }} className="hover:text-theme-bg-deep transition-colors lift-link">Testimonials</Link>
            <Link to="/contact" style={{ fontSize: '15px', color: '#4a5568' }} className="hover:text-theme-bg-deep transition-colors lift-link">Contact</Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4" style={{ flexShrink: 0, marginLeft: 'auto' }}>

            {/* ── Icons: always visible (mobile + desktop) ── */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-1.5 hover:opacity-70 transition-opacity"
                title="Search products"
              >
                <Search size={20} color="#0d1f14" strokeWidth={1.5} />
              </button>

              {/* Account / User */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 p-1 hover:opacity-70 transition-opacity"
                  >
                    <div className="w-7 h-7 bg-theme-bg-deep text-white rounded-full flex items-center justify-center font-bold text-[12px]">
                      {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={12} color="#0d1f14" className="hidden sm:block" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-theme rounded-xl shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-theme mb-2">
                        <p className="font-body text-[13px] font-semibold truncate">{user.user_metadata?.full_name || 'User'}</p>
                        <p className="font-mono text-[10px] text-theme-text-muted truncate">{user.email}</p>
                      </div>
                      <Link to="/my-orders" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[13px] font-body text-theme-text-primary hover:bg-theme-bg-secondary transition-colors">
                        <Package size={14} /> My Orders
                      </Link>
                      {user.email === 'admin@taseer.com' && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-[13px] font-body text-theme-text-primary hover:bg-theme-bg-secondary transition-colors">
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => { signOut(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-[13px] font-body text-red-600 hover:bg-theme-bg-secondary transition-colors flex items-center gap-2"
                      >
                        <LogOut size={14} /> Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="p-1.5 hover:opacity-70 transition-opacity" title="Login">
                  <User size={20} color="#0d1f14" strokeWidth={1.5} />
                </Link>
              )}

              {/* Cart */}
              <button onClick={openCart} className="p-1.5 hover:opacity-70 transition-opacity relative" title="Cart">
                <ShoppingBag size={20} color="#0d1f14" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 min-w-[16px] h-4 bg-theme-accent text-white font-mono text-[9px] font-bold flex items-center justify-center rounded-full px-1">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop CTA buttons */}
            <Link to="/shop" style={{ border: '2px solid #0d5c3a', color: '#0d5c3a', background: 'transparent', borderRadius: '9999px', padding: '0.45rem 1.2rem', fontSize: '14px', fontWeight: 600 }} className="hidden lg:inline-block font-body hover:bg-[#0d5c3a] hover:text-white transition-colors duration-200">
              Buy Products
            </Link>
            <Link to="/contact" style={{ background: '#e8a500', color: '#0d1f14', borderRadius: '9999px', padding: '0.45rem 1.3rem', fontSize: '14px', fontWeight: 700, border: 'none' }} className="hidden lg:inline-block font-body hover:bg-[#c9900a] transition-colors">
              Book Consultation
            </Link>

            {/* Hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-theme-text-primary p-1 ml-1">
              <Menu size={22} />
            </button>
          </div>

        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-theme shadow-lg flex flex-col p-5 gap-3 z-40">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="font-body text-[15px] font-medium text-theme-text-primary border-b border-gray-100 pb-3">Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="font-body text-[15px] font-medium text-theme-text-primary border-b border-gray-100 pb-3">Formulations</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="font-body text-[15px] font-medium text-theme-text-primary border-b border-gray-100 pb-3">About</Link>
            <Link to="/testimonials" onClick={() => setMobileMenuOpen(false)} className="font-body text-[15px] font-medium text-theme-text-primary border-b border-gray-100 pb-3">Testimonials</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="font-body text-[15px] font-medium text-theme-text-primary border-b border-gray-100 pb-3">Contact</Link>
            {user ? (
              <>
                <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="font-body text-[15px] font-medium text-theme-text-primary border-b border-gray-100 pb-3 flex items-center gap-2">
                  <Package size={16} /> My Orders
                </Link>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="font-body text-[15px] font-medium text-red-500 border-b border-gray-100 pb-3 text-left flex items-center gap-2">
                  <LogOut size={16} /> Log Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="font-body text-[15px] font-medium text-[#0d5c3a] border-b border-gray-100 pb-3 flex items-center gap-2">
                <User size={16} /> Login / My Account
              </Link>
            )}
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="font-body text-[15px] font-bold text-white bg-[#e8a500] rounded-lg px-4 py-3 text-center mt-1">
              Book Consultation
            </Link>
          </div>
        )}
      </nav>
    </header>
    </>
  );
}
