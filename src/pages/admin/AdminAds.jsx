import { useState, useEffect } from 'react';
import { Megaphone, Tag, Edit2, Info, Plus, X, EyeOff, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminAds() {
  const [activeTab, setActiveTab] = useState('discounts'); // 'discounts' | 'banners'
  const [loading, setLoading] = useState(true);

  // Discounts Logic
  const [products, setProducts] = useState([]);
  
  // Banners Logic
  const [banners, setBanners] = useState([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    bg_color: '#0d5c3a',
    text_color: '#ffffff',
    is_active: false
  });

  const [toast, setToast] = useState(null);
  
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (activeTab === 'discounts') {
      fetchProducts();
    } else {
      fetchBanners();
    }
  }, [activeTab]);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }

  async function fetchBanners() {
    setLoading(true);
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (data) setBanners(data);
    setLoading(false);
  }

  // ==== DISCOUNT LOGIC ====
  const handleProductUpdate = async (id, updates) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
      showToast('Offer updated successfully');
    }
  };

  const toggleProductSale = async (product) => {
    handleProductUpdate(product.id, { sale_active: !product.sale_active });
  };

  const updateProductLabel = async (e, id) => {
    e.preventDefault();
    const val = new FormData(e.target).get('label');
    handleProductUpdate(id, { sale_label: val });
  };

  // ==== BANNER LOGIC ====
  const openBannerModal = () => {
    setFormData({ message: '', bg_color: '#0d5c3a', text_color: '#ffffff', is_active: true });
    setIsBannerModalOpen(true);
  };

  const saveBanner = async (e) => {
    e.preventDefault();
    
    // Auto turn off others if this is active
    if (formData.is_active) {
      await supabase.from('promotions').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000'); // pseudo bulk update hack or just update all
      // update state
      setBanners(banners.map(b => ({ ...b, is_active: false })));
    }
    
    const { error, data } = await supabase.from('promotions').insert(formData).select().single();
    if (!error && data) {
      setBanners([data, ...banners].map(b => b.id === data.id ? data : b));
      setIsBannerModalOpen(false);
      showToast('Banner saved successfully');
      fetchBanners();
    } else {
      showToast('Error saving banner: ' + error?.message);
    }
  };

  const toggleBannerSelect = async (banner) => {
    const turningOn = !banner.is_active;
    if (turningOn) {
      // Must turn off others
      await supabase.from('promotions').update({ is_active: false }).neq('id', banner.id);
    }
    await supabase.from('promotions').update({ is_active: turningOn }).eq('id', banner.id);
    fetchBanners();
  };

  const deleteBanner = async (id) => {
    if (confirm("Delete this promotional banner?")) {
      await supabase.from('promotions').delete().eq('id', id);
      fetchBanners();
    }
  };

  return (
    <div className="pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg font-body text-sm z-50 flex items-center gap-2 animate-bounce-in">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-heading text-3xl text-theme-text-primary font-bold">Ads & Offers Manager</h1>
        <p className="font-body text-theme-text-muted mt-2 text-[14px]">Run discounts on products and promotional banners across the site.</p>
      </div>

      <div className="flex bg-white rounded-xl shadow-sm border border-theme overflow-hidden mb-8 w-fit p-1">
        <button 
          onClick={() => setActiveTab('discounts')}
          className={`px-6 py-2.5 font-body font-medium text-[14px] rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'discounts' ? 'bg-theme-bg-secondary text-theme-text-primary shadow-sm' : 'text-theme-text-muted hover:bg-gray-50'}`}
        >
          <Tag size={16} /> 🏷️ Product Discounts
        </button>
        <button 
          onClick={() => setActiveTab('banners')}
          className={`px-6 py-2.5 font-body font-medium text-[14px] rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'banners' ? 'bg-theme-bg-secondary text-theme-text-primary shadow-sm' : 'text-theme-text-muted hover:bg-gray-50'}`}
        >
          <Megaphone size={16} /> 📢 Promo Banners
        </button>
      </div>

      {loading ? (
        <div className="p-8 font-body">Loading...</div>
      ) : activeTab === 'discounts' ? (
        
        <div className="bg-white rounded-[16px] border border-theme shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-[14px]">
              <thead className="bg-theme-bg-secondary text-theme-text-muted">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Product Name</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Current Price</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Sale Label</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-center">Sale Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-theme-bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[14px] text-theme-text-primary">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      ₹{product.price}
                    </td>
                    <td className="px-6 py-4">
                      <form onSubmit={(e) => updateProductLabel(e, product.id)} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          name="label" 
                          defaultValue={product.sale_label || ''} 
                          placeholder="e.g. 20% OFF" 
                          className="border border-theme rounded-md px-3 py-1.5 text-[13px] w-40"
                        />
                        <button type="submit" className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                          <Edit2 size={14} />
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleProductSale(product)}
                        className={`font-medium py-1 px-4 rounded-full text-xs transition-colors ${product.sale_active ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {product.sale_active ? 'ON SALE' : 'OFF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openBannerModal} className="bg-theme-bg-deep text-white px-5 py-2.5 rounded-xl font-body font-medium flex items-center gap-2 hover:bg-[#0a4d30] transition-colors shadow-sm">
              <Plus size={18} /> Add New Banner
            </button>
          </div>
          
          <div className="bg-white rounded-[16px] border border-theme shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-[14px]">
                <thead className="bg-theme-bg-secondary text-theme-text-muted">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Message</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Style</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-center">Status</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-theme-bg-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div dangerouslySetInnerHTML={{ __html: banner.message }} />
                        <div className="text-[10px] text-gray-400 mt-1 font-mono">{new Date(banner.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-gray-200" style={{backgroundColor: banner.bg_color}} />
                          <div className="w-4 h-4 rounded-full border border-gray-200" style={{backgroundColor: banner.text_color}} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleBannerSelect(banner)}
                          className={`flex items-center justify-center w-8 h-8 mx-auto rounded-full transition-colors ${banner.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}
                        >
                          {banner.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button onClick={() => deleteBanner(banner.id)} className="p-2 text-red-500 hover:bg-red-50 transition-colors rounded-lg"><X size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {banners.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">No banners found. Create one above!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      )}

      {/* BANNER MODAL */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-theme flex items-center justify-between bg-white text-theme-text-primary">
              <h2 className="font-heading font-bold text-2xl">Create Site Banner</h2>
              <button onClick={() => setIsBannerModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={saveBanner} className="p-6 flex flex-col">
              
              <div className="mb-6">
                <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted mb-2 block">Live Preview</label>
                <div style={{
                  background: formData.bg_color,
                  color: formData.text_color,
                  textAlign: 'center',
                  padding: '10px 16px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                  {formData.message || "Your message will appear here..."}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Promotion Message (Supports basic HTML/Emoji)</label>
                  <input required type="text" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="🎉 Eid Special — 20% off all orders!" className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px]" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Background Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.bg_color} onChange={e => setFormData({...formData, bg_color: e.target.value})} className="h-10 w-16 p-1 border border-theme rounded" />
                      <span className="font-mono text-xs">{formData.bg_color}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Text Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.text_color} onChange={e => setFormData({...formData, text_color: e.target.value})} className="h-10 w-16 p-1 border border-theme rounded" />
                      <span className="font-mono text-xs">{formData.text_color}</span>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 font-body text-[14px] text-emerald-700 font-medium">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded" />
                  Activate Immediately (will turn off others)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-theme">
                <button type="button" onClick={() => setIsBannerModalOpen(false)} className="px-6 py-2.5 rounded-xl font-body font-medium bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-body font-medium bg-theme-bg-deep text-white hover:bg-emerald-800 transition-colors">Publish Banner</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
