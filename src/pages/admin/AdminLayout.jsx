import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, Settings, LogOut, Video, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.email !== 'admin@taseer.com') {
    return <Navigate to="/login" replace />;
  }
  
  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Products', path: '/admin/products', icon: <Package size={20} /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { name: 'Consultations', path: '/admin/consultations', icon: <MessageSquare size={20} /> },
    { name: 'Testimonials', path: '/admin/testimonials', icon: <Video size={20} /> },
    { name: 'Ads & Offers', path: '/admin/ads', icon: <Megaphone size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-theme-bg-deep text-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="font-heading font-bold text-2xl tracking-tight block hover:opacity-80 transition-opacity">
            Taseer Ayurved
          </Link>
          <div className="font-mono text-[10px] text-theme-accent uppercase tracking-widest mt-1">
            Admin Panel
          </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body text-[14px] font-medium transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-theme-accent' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-[14px] font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <Settings size={20} />
            Settings
          </Link>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-body text-[14px] font-medium text-white/70 hover:bg-white/5 hover:text-theme-accent transition-colors"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
