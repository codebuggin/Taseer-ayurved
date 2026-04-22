import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

// Context
import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';

// Common Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import ChatWidget from './components/ChatWidget';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetail from './pages/ProductDetail';
import AboutPage from './pages/AboutPage';
import TestimonialsPage from './pages/TestimonialsPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminConsultations from './pages/admin/AdminConsultations';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminAds from './pages/admin/AdminAds';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { isCartOpen, closeCart } = useCart();

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <CartSidebar isOpen={isCartOpen} setIsOpen={closeCart} />}
      
      <main className={`flex-grow ${isAdminRoute ? '' : location.pathname === '/' ? 'pt-[132px] md:pt-[156px]' : 'pt-[92px] md:pt-[116px]'}`}>
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ProductDetail />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/my-orders" element={<OrderHistoryPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="consultations" element={<AdminConsultations />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="ads" element={<AdminAds />} />
          </Route>
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}

      {/* Floating Action Buttons */}
      {!isAdminRoute && (
        <>
          {/* AI Chat on the right */}
          <ChatWidget />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AnimatedRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
