import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShoppingBag, ChevronDown, ChevronUp, Trash2, FileText } from 'lucide-react';

// ── Invoice PDF via print window ──────────────────────────────────────────────
function generateInvoice(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const shortId = order.id.slice(0, 8).toUpperCase();

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${item.price}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${item.price * item.quantity}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><title>Invoice #${shortId} — Taseer Ayurved</title>
<style>
  *{box-sizing:border-box;}
  body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#333;}
  @media print{.no-print{display:none!important;}body{padding:0;}}
  .header{background:#0d5c3a;color:white;padding:24px;text-align:center;}
  .header h1{margin:0 0 6px;font-size:26px;}
  .header p{margin:3px 0;font-size:12px;opacity:.9;}
  .section{padding:18px 20px;border-bottom:1px solid #eee;}
  .section h2{color:#0d5c3a;font-size:14px;text-transform:uppercase;letter-spacing:.05em;margin:0 0 12px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .info{font-size:13px;line-height:1.5;}
  .label{font-weight:bold;color:#555;}
  .full{grid-column:span 2;}
  table{width:100%;border-collapse:collapse;margin-top:10px;}
  thead tr{background:#0d5c3a;color:white;}
  th{padding:9px 12px;text-align:left;font-size:12px;}
  th:nth-child(2),td:nth-child(2){text-align:center;}
  th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4){text-align:right;}
  .total-row{background:#0d5c3a;color:white;}
  .total-row td{padding:10px 12px;font-weight:bold;text-align:right;}
  .total-row td:first-child{text-align:left;}
  .footer{padding:18px 20px;background:#f9f5f0;text-align:center;}
  .footer p{margin:3px 0;font-size:12px;color:#666;}
  .print-btn{display:block;margin:16px auto;padding:10px 28px;background:#0d5c3a;color:white;border:none;border-radius:8px;font-size:15px;cursor:pointer;}
</style></head>
<body>
  <div class="no-print" style="text-align:center;padding:16px;">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="header">
    <h1>Taseer Ayurved</h1>
    <p>68/30, Nagpur Vora Ki Chawl, Opp. Jhulta Minara, Gomtipur, Ahmedabad - 380021</p>
    <p>Phone: +91 7405410856</p>
  </div>
  <div class="section">
    <h2>Invoice Details</h2>
    <div class="grid">
      <div class="info"><span class="label">Invoice #: </span>${shortId}</div>
      <div class="info"><span class="label">Date: </span>${date}</div>
      <div class="info"><span class="label">Payment: </span>${order.payment_id || 'COD'}</div>
      <div class="info"><span class="label">Status: </span>${order.status?.toUpperCase()}</div>
    </div>
  </div>
  <div class="section">
    <h2>Customer Details</h2>
    <div class="grid">
      <div class="info"><span class="label">Name: </span>${order.name || '-'}</div>
      <div class="info"><span class="label">Phone: </span>${order.phone || '-'}</div>
      <div class="info"><span class="label">Email: </span>${order.email || '-'}</div>
      <div class="info"><span class="label">City / Pin: </span>${order.city || '-'} — ${order.pincode || '-'}</div>
      <div class="info full"><span class="label">Address: </span>${order.address || '-'}</div>
    </div>
  </div>
  <div class="section">
    <h2>Order Items</h2>
    <table>
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot><tr class="total-row"><td colspan="3">GRAND TOTAL</td><td>₹${order.total}</td></tr></tfoot>
    </table>
  </div>
  <div class="footer">
    <p><strong>Thank you for your order!</strong></p>
    <p>Our team will contact you to confirm delivery details.</p>
    <p>For support: +91 7405410856</p>
    <p style="margin-top:10px;font-size:11px;">Taseer Ayurved | Ancient Medicine. Personally Prepared.</p>
  </div>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending:   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
  shipped:   'bg-purple-100 text-purple-800 border border-purple-200',
  delivered: 'bg-green-100 text-green-800 border border-green-200',
  cancelled: 'bg-red-100 text-red-800 border border-red-200',
};

// ── Expanded order detail panel ────────────────────────────────────────────────
function OrderDetail({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Customer */}
      <div>
        <h4 className="font-mono text-[11px] uppercase tracking-widest text-theme-text-muted font-semibold mb-3">Customer Details</h4>
        <dl className="space-y-1.5 font-body text-[13px]">
          <div className="flex gap-2"><dt className="text-theme-text-muted w-20 shrink-0">Name</dt><dd className="font-medium">{order.name || '—'}</dd></div>
          <div className="flex gap-2"><dt className="text-theme-text-muted w-20 shrink-0">Email</dt><dd>{order.email || '—'}</dd></div>
          <div className="flex gap-2"><dt className="text-theme-text-muted w-20 shrink-0">Phone</dt><dd className="font-mono">{order.phone || '—'}</dd></div>
          <div className="flex gap-2"><dt className="text-theme-text-muted w-20 shrink-0">Address</dt><dd>{order.address || '—'}</dd></div>
          <div className="flex gap-2"><dt className="text-theme-text-muted w-20 shrink-0">City</dt><dd>{order.city || '—'}</dd></div>
          <div className="flex gap-2"><dt className="text-theme-text-muted w-20 shrink-0">Pincode</dt><dd className="font-mono">{order.pincode || '—'}</dd></div>
          <div className="flex gap-2"><dt className="text-theme-text-muted w-20 shrink-0">Payment</dt><dd className="font-semibold">{order.payment_id || 'COD'}</dd></div>
        </dl>
      </div>

      {/* Items */}
      <div>
        <h4 className="font-mono text-[11px] uppercase tracking-widest text-theme-text-muted font-semibold mb-3">Products Ordered</h4>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-theme/50">
              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                  : <ShoppingBag size={14} className="text-gray-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[13px] font-medium truncate">{item.name}</p>
                <p className="font-mono text-[11px] text-theme-text-muted">Qty: {item.quantity}</p>
              </div>
              <span className="font-mono text-[13px] font-bold text-theme-text-primary shrink-0">
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between items-center pt-3 border-t border-theme font-body text-[14px]">
          <span className="text-theme-text-muted">Grand Total</span>
          <span className="font-mono font-bold text-[16px] text-theme-text-primary">₹{order.total}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Delete this order permanently? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) setOrders(prev => prev.filter(o => o.id !== id));
    setDeletingId(null);
  };

  const toggleExpand = (id) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredOrders = activeTab === 'All Orders'
    ? orders
    : orders.filter(o => o.status.toLowerCase() === activeTab.toLowerCase());

  return (
    <div>
      <h1 className="font-heading text-3xl text-theme-text-primary font-bold mb-8">Orders</h1>

      {/* Filter Tabs */}
      <div className="bg-white rounded-t-[16px] border border-theme border-b-0 px-6 py-4 flex gap-6 mt-4 overflow-x-auto no-scrollbar">
        {['All Orders', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-body text-[14px] font-medium pb-4 -mb-[17px] border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-theme-bg-deep text-theme-bg-deep' : 'border-transparent text-theme-text-muted hover:text-theme-text-primary'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-[16px] border border-theme shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-[14px]">
            <thead className="bg-theme-bg-secondary text-theme-text-muted">
              <tr>
                <th className="px-5 py-4 font-medium uppercase tracking-wider text-[11px]">Order ID & Date</th>
                <th className="px-5 py-4 font-medium uppercase tracking-wider text-[11px]">Customer</th>
                <th className="px-5 py-4 font-medium uppercase tracking-wider text-[11px]">Items</th>
                <th className="px-5 py-4 font-medium uppercase tracking-wider text-[11px]">Total</th>
                <th className="px-5 py-4 font-medium uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-5 py-4 font-medium uppercase tracking-wider text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-theme-text-muted">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-theme-text-muted">No orders found.</td></tr>
              ) : filteredOrders.map(order => {
                const itemCount = Array.isArray(order.items) ? order.items.reduce((a, i) => a + i.quantity, 0) : 0;
                const isExpanded = expandedOrders.has(order.id);
                const isDelivered = order.status?.toLowerCase() === 'delivered';

                return (
                  <>
                    <tr key={order.id} className="hover:bg-theme-bg-secondary/40 transition-colors">
                      {/* Order ID & Date */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-mono font-bold text-[11px] text-theme-bg-deep tracking-wider uppercase mb-1">
                          {order.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[12px] text-theme-text-muted">
                          {new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-theme-text-primary">{order.name}</div>
                        <div className="text-[12px] text-theme-text-muted mt-0.5">{order.email}</div>
                        <div className="font-mono text-[11px] text-theme-text-muted mt-0.5">{order.phone}</div>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4 text-theme-text-muted align-top">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag size={13} />
                          <span className="text-[13px]">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                        </div>
                        <div className="text-[11px] mt-1 space-y-0.5">
                          {Array.isArray(order.items) && order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="truncate max-w-[140px]">{item.quantity}× {item.name}</div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="text-theme-text-muted">+{order.items.length - 2} more</div>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 font-semibold text-theme-text-primary align-top">₹{order.total}</td>

                      {/* Status */}
                      <td className="px-5 py-4 align-top">
                        <div className="relative inline-block">
                          <select
                            value={order.status.toLowerCase()}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className={`appearance-none cursor-pointer pr-7 pl-3 py-1.5 rounded-full text-[11px] font-mono tracking-wide font-bold uppercase outline-none focus:ring-2 focus:ring-theme-bg-deep/20 transition-all ${STATUS_COLOR[order.status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Invoice */}
                          <button
                            onClick={() => generateInvoice(order)}
                            title="Download Invoice"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-body font-semibold text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            <FileText size={12} />
                            Invoice
                          </button>

                          {/* Delete — delivered only */}
                          {isDelivered && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={deletingId === order.id}
                              title="Delete order"
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {/* Expand toggle */}
                          <button
                            onClick={() => toggleExpand(order.id)}
                            title={isExpanded ? 'Collapse' : 'View details'}
                            className="p-1.5 text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${order.id}-detail`} className="bg-[#f8faf8]">
                        <td colSpan="6" className="px-5 py-5 border-t border-emerald-50">
                          <OrderDetail order={order} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
