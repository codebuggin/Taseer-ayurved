import { ShoppingBag, DollarSign, Package, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    ordersCount: 0,
    revenue: 0,
    productsCount: 0,
    customersCount: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      // Fetch Orders
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      
      // Fetch Products Count
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

      if (ordersData) {
        // Calculate Revenue
        const revenue = ordersData.reduce((acc, order) => acc + (order.status !== 'cancelled' ? order.total : 0), 0);
        
        // Calculate unique customers
        const uniqueEmails = new Set(ordersData.map(o => o.email));
        
        setStats({
          ordersCount: ordersData.length,
          revenue: revenue,
          productsCount: productsCount || 0,
          customersCount: uniqueEmails.size
        });

        // Set recent orders (top 5)
        setRecentOrders(ordersData.slice(0, 5));

        // Calculate top products by iterating through all order items
        const productSales = {};
        ordersData.forEach(order => {
          if (order.status !== 'cancelled' && Array.isArray(order.items)) {
            order.items.forEach(item => {
              if (!productSales[item.name]) {
                productSales[item.name] = { sales: 0, revenue: 0 };
              }
              productSales[item.name].sales += item.quantity;
              productSales[item.name].revenue += (item.price * item.quantity);
            });
          }
        });

        const sortedProducts = Object.entries(productSales)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);
        
        setTopProducts(sortedProducts);
      }
      
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: "Total Orders", value: stats.ordersCount, icon: ShoppingBag },
    { title: "Revenue", value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: DollarSign },
    { title: "Live Products", value: stats.productsCount, icon: Package },
    { title: "Customers", value: stats.customersCount, icon: Users },
  ];

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (loading) return <div className="p-8 font-body">Loading dashboard data...</div>;

  return (
    <div>
      <h1 className="font-heading text-3xl text-theme-text-primary font-bold mb-8">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-[16px] p-6 border border-theme shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#f0f7f3] text-theme-bg-deep rounded-xl flex items-center justify-center">
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="font-body text-[14px] text-theme-text-muted mb-1">{stat.title}</h3>
              <div className="font-heading font-semibold text-[28px] text-theme-accent leading-none">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="xl:col-span-2 bg-white rounded-[16px] border border-theme shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-theme flex items-center justify-between">
            <h2 className="font-heading font-semibold text-xl text-theme-text-primary">Recent Orders</h2>
            <Link to="/admin/orders" className="text-theme-bg-deep font-body text-[13px] hover:underline font-medium">View All</Link>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left font-body text-[14px]">
              <thead className="bg-theme-bg-secondary text-theme-text-muted">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Order ID</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Customer</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Amount</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {recentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-theme-bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-[11px] text-theme-bg-deep uppercase tracking-wider font-bold">
                      {order.id.split('-')[0]}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-theme-text-primary font-medium">{order.name}</div>
                      <div className="text-[12px] text-theme-text-muted">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-theme-text-primary text-[15px]">₹{order.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-wide ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-theme-text-muted">No recent orders.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-[16px] border border-theme shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-theme flex items-center justify-between">
            <h2 className="font-heading font-semibold text-xl text-theme-text-primary">Top Products</h2>
            <Link to="/admin/products" className="text-theme-bg-deep font-body text-[13px] hover:underline font-medium">Manage</Link>
          </div>
          <div className="p-0">
            {topProducts.map((prod, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-theme last:border-0 hover:bg-theme-bg-secondary/50 transition-colors">
                <div className="pr-4 max-w-[70%]">
                  <div className="font-heading font-medium text-[15px] text-theme-text-primary truncate">{prod.name}</div>
                  <div className="font-body text-[12px] text-theme-text-muted mt-1">{prod.sales} products sold</div>
                </div>
                <div className="font-mono text-[13px] font-bold text-emerald-800 whitespace-nowrap bg-emerald-50 px-2 py-1 rounded-lg">
                  ₹{prod.revenue.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
               <div className="p-6 text-center text-theme-text-muted text-[13px]">No sales data yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
