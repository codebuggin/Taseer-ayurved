import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Package, Clock, CheckCircle, Truck, ShoppingBag } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-800', step: 0 },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800',     step: 1 },
  shipped:   { label: 'Shipped',   color: 'bg-orange-100 text-orange-800', step: 2 },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800',   step: 3 },
};

const TRACKING_STEPS = ['Order Placed', 'Confirmed', 'Shipped', 'Delivered'];

function TrackingBar({ status }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-start justify-between relative">
        <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute left-0 top-3 h-0.5 bg-[#0d5c3a] z-0 transition-all duration-500"
          style={{ width: `${(currentStep / (TRACKING_STEPS.length - 1)) * 100}%` }}
        />
        {TRACKING_STEPS.map((step, i) => (
          <div key={step} className="flex flex-col items-center z-10">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
              i <= currentStep
                ? 'bg-[#0d5c3a] border-[#0d5c3a] text-white'
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {i <= currentStep ? '✓' : i + 1}
            </div>
            <span className={`mt-2 text-[10px] font-mono text-center leading-tight ${
              i <= currentStep ? 'text-[#0d5c3a] font-semibold' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const items = Array.isArray(order.items) ? order.items : [];
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  const shortId = order.id ? order.id.slice(0, 8).toUpperCase() : 'UNKNOWN';
  const totalQty = items.reduce((a, b) => a + (b.quantity || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-mono text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">
            Order #{shortId}
          </p>
          <p className="font-body text-[13px] text-gray-500">{date}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[12px] font-semibold font-body ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3 mb-4">
        {items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover mix-blend-multiply"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <Package size={18} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-[13px] font-medium text-gray-800 leading-tight truncate">
                {item.name}
              </p>
              <p className="font-mono text-[11px] text-gray-500 mt-0.5">
                Qty: {item.quantity} &nbsp;·&nbsp; ₹{item.price * item.quantity}
              </p>
            </div>
          </div>
        ))}
        {items.length > 3 && (
          <p className="font-body text-[12px] text-gray-400 pl-1">
            +{items.length - 3} more item{items.length - 3 !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="font-body text-[13px] text-gray-500">
          {totalQty} item{totalQty !== 1 ? 's' : ''} &nbsp;·&nbsp; Cash on Delivery
        </span>
        <span className="font-mono font-bold text-[16px] text-gray-900">₹{order.total}</span>
      </div>

      {/* Tracking bar — only for shipped orders */}
      {order.status === 'shipped' && <TrackingBar status={order.status} />}
    </div>
  );
}

function Section({ icon: Icon, iconClass, title, badgeClass, orders }) {
  if (orders.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className={iconClass} />
        <h2 className="font-body font-bold text-[18px] text-[#0d1f14]">{title}</h2>
        <span className={`text-white text-[11px] font-mono px-2 py-0.5 rounded-full ${badgeClass}`}>
          {orders.length}
        </span>
      </div>
      <div className="space-y-4">
        {orders.map(order => <OrderCard key={order.id} order={order} />)}
      </div>
    </section>
  );
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setOrders(data);
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="pt-[140px] pb-24 min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="font-body text-gray-500 mb-6">Please log in to view your orders.</p>
          <Link
            to="/login"
            className="bg-[#0d5c3a] text-white px-8 py-3 rounded-full font-body font-medium hover:bg-emerald-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const ongoingOrders = orders.filter(o =>
    ['pending', 'confirmed', 'shipped'].includes(o.status)
  );
  const recentDelivered = orders.filter(o =>
    o.status === 'delivered' && new Date(o.created_at) >= thirtyDaysAgo
  );
  const historyOrders = orders.filter(o =>
    o.status === 'delivered' && new Date(o.created_at) < thirtyDaysAgo
  );

  return (
    <div className="pt-[140px] pb-24 bg-[#f8faf8] min-h-screen">
      <div className="max-w-3xl mx-auto px-6">

        <div className="mb-8">
          <Link to="/" className="text-[#0d5c3a] font-body text-[14px] hover:underline">
            ← Home
          </Link>
          <h1 className="font-heading italic text-[38px] text-[#0d1f14] mt-4 mb-1">My Orders</h1>
          <p className="font-body text-gray-500 text-[14px]">
            {orders.length} total order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-emerald-100 border-t-[#0d5c3a] rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-body text-gray-500 text-[16px] mb-6">
              You haven't placed any orders yet.
            </p>
            <Link
              to="/shop"
              className="bg-[#0d5c3a] text-white px-8 py-3 rounded-full font-body font-medium hover:bg-emerald-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <Section
              icon={Truck}
              iconClass="text-[#0d5c3a]"
              title="Ongoing Orders"
              badgeClass="bg-[#0d5c3a]"
              orders={ongoingOrders}
            />
            <Section
              icon={CheckCircle}
              iconClass="text-green-600"
              title="Recent Orders"
              badgeClass="bg-green-600"
              orders={recentDelivered}
            />
            <Section
              icon={Clock}
              iconClass="text-gray-500"
              title="Order History"
              badgeClass="bg-gray-400"
              orders={historyOrders}
            />
          </div>
        )}
      </div>
    </div>
  );
}
