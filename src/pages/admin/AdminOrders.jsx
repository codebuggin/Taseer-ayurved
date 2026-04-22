import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShoppingBag, ChevronDown } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Orders');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    }
  };

  const filteredOrders = activeTab === 'All Orders' 
    ? orders 
    : orders.filter(o => o.status.toLowerCase() === activeTab.toLowerCase());

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

  return (
    <div>
      <h1 className="font-heading text-3xl text-theme-text-primary font-bold mb-8">Orders</h1>

      {/* Filter Tabs */}
      <div className="bg-white rounded-t-[16px] border border-theme border-b-0 px-6 py-4 flex gap-6 mt-4 overflow-x-auto no-scrollbar">
        {['All Orders', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`font-body text-[14px] font-medium pb-4 -mb-[17px] border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-theme-bg-deep text-theme-bg-deep' : 'border-transparent text-theme-text-muted hover:text-theme-text-primary'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-[16px] border border-theme shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-[14px]">
            <thead className="bg-theme-bg-secondary text-theme-text-muted">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Order ID & Date</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Customer</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Items</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Total</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-theme-text-muted">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-theme-text-muted">No orders found.</td></tr>
              ) : filteredOrders.map((order) => {
                const itemCount = Array.isArray(order.items) ? order.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
                
                return (
                  <tr key={order.id} className="hover:bg-theme-bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="font-mono font-bold text-[11px] text-theme-bg-deep tracking-wider uppercase mb-1">{order.id.split('-')[0]}</div>
                      <div className="text-[12px] text-theme-text-muted">{new Date(order.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-theme-text-primary">{order.name}</div>
                      <div className="text-[12px] text-theme-text-muted mt-1">{order.email}</div>
                      <div className="font-mono text-[11px] text-theme-text-muted mt-1">{order.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-theme-text-muted align-top">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} />
                        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      </div>
                      <div className="text-[11px] mt-1 space-y-1">
                        {Array.isArray(order.items) && order.items.map((item, idx) => (
                           <div key={idx} className="truncate max-w-[150px]">{item.quantity}x {item.name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-theme-text-primary align-top">₹{order.total}</td>
                    <td className="px-6 py-4 align-top">
                      <div className="relative group">
                        <select 
                          value={order.status.toLowerCase()} 
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`appearance-none cursor-pointer pr-8 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wide font-bold uppercase outline-none focus:ring-2 focus:ring-theme-bg-deep/20 transition-all ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
