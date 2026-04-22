import { Plus, Edit2, Trash2, X, Star, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CATEGORY_OPTIONS = [
  { value: 'thyroid', label: 'Thyroid' },
  { value: 'piles', label: 'Piles' },
  { value: 'gallbladder', label: 'Gallbladder' },
  { value: 'cervical', label: 'Cervical' },
  { value: 'spondylitis', label: 'Spondylitis' },
  { value: 'mens-health', label: 'Mens Health' },
  { value: 'womens-care', label: 'Womens Care' },
  { value: 'womens-special', label: 'Womens Special' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'bone-joint', label: 'Bone Joint' },
  { value: 'skin-care', label: 'Skin Care' },
  { value: 'liver-care', label: 'Liver Care' },
  { value: 'kidney-care', label: 'Kidney Care' },
  { value: 'heart-health', label: 'Heart Health' },
  { value: 'pain-relief', label: 'Pain Relief' },
  { value: 'digestive-health', label: 'Digestive Health' },
  { value: 'hair-care', label: 'Hair Care' },
  { value: 'sleep-mental-health', label: 'Sleep Mental Health' },
  { value: 'weight-management', label: 'Weight Management' },
  { value: 'neurological', label: 'Neurological' },
  { value: 'growth', label: 'Growth' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'vitality', label: 'Vitality' },
  { value: 'premium', label: 'Premium' },
  { value: 'general-wellness', label: 'General Wellness' }
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category: '', price: 0, original_price: 0, 
    benefit: '', description: '', form: 'capsules',
    image_url: '', is_bestseller: false, is_top_seller: false, in_stock: true
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData(product);
    } else {
      setEditingId(null);
      setFormData({
        name: '', category: '', price: 0, original_price: 0, 
        benefit: '', description: '', form: 'capsules',
        image_url: '', is_bestseller: false, is_top_seller: false, in_stock: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setUploading(false);
    setUploadProgress(0);
    setShowUrlFallback(false);
  };
  
  const handleImageUpload = async (e) => {
    e.preventDefault();
    let file;
    if (e.dataTransfer && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    } else if (e.target && e.target.files) {
      file = e.target.files[0];
    }
    
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('products')
      .upload(`${Date.now()}-${file.name}`, file, {
        cacheControl: '3600',
        upsert: false
      });
      // Note: @supabase/supabase-js v2 doesn't have native onUploadProgress 
      // for standard file uploads, we mock the progress bar visually
    
    if (error) {
      console.error('Upload error:', error.message);
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    
    // Simulate progress completion
    setUploadProgress(100);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);
    
    // Save URL to form
    setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
  };
  
  const removeImage = async (e) => {
    e.preventDefault();
    // Only attempt storage deletion if it belongs to products
    if (formData.image_url && formData.image_url.includes('public/products/')) {
      try {
        const path = formData.image_url.split('public/products/')[1];
        if (path) {
          await supabase.storage
            .from('products')
            .remove([path]);
        }
      } catch (err) {
        console.error("Error removing image from bucket:", err);
      }
    }
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    // Fallback slug creation if new
    if (!editingId && !payload.slug) {
      payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (!error) fetchProducts();
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (!error) fetchProducts();
    }
    closeModal();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  const toggleTopSeller = async (id, currentValue) => {
    await supabase.from('products').update({ is_top_seller: !currentValue }).eq('id', id);
    setProducts(products.map(p => p.id === id ? { ...p, is_top_seller: !currentValue } : p));
  };

  if (loading) return <div className="p-8 font-body">Loading products...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl text-theme-text-primary font-bold">Products</h1>
        <button onClick={() => handleOpenModal()} className="bg-theme-accent text-theme-text-primary hover:bg-[#d69900] px-5 py-2.5 rounded-xl font-body font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-[16px] border border-theme shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-[14px]">
            <thead className="bg-theme-bg-secondary text-theme-text-muted">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Image</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Name</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Category</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Price</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-center">Top Seller</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-theme-bg-secondary/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-lg bg-[#f0f7f3] border border-theme overflow-hidden flex items-center justify-center">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover mix-blend-multiply" />
                      ) : (
                        <div className="text-[8px] font-mono text-emerald-800">TASEER</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-heading font-medium text-[15px] text-theme-text-primary">{prod.name}</div>
                    {!prod.in_stock && <span className="text-red-500 text-[11px] font-mono">Out of stock</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#f0f7f3] text-theme-bg-deep px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider inline-block">
                      {prod.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-theme-text-primary">₹{prod.price}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleTopSeller(prod.id, prod.is_top_seller)}
                      className={`p-1.5 rounded-full transition-colors ${prod.is_top_seller ? 'bg-amber-100 text-amber-500' : 'bg-gray-100 text-gray-400 hover:bg-amber-50'}`}
                      title={prod.is_top_seller ? "Remove from Top Sellers Marquee" : "Add to Top Sellers Marquee"}
                    >
                      <Star size={16} fill={prod.is_top_seller ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleOpenModal(prod)} className="p-2 text-theme-text-muted hover:text-theme-bg-deep transition-colors bg-theme-bg-secondary rounded-lg"><Edit2 size={16} /></button>
                       <button onClick={() => handleDelete(prod.id)} className="p-2 text-theme-text-muted hover:text-red-500 transition-colors bg-theme-bg-secondary rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-theme flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-heading font-bold text-2xl">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Product Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px]" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Category</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px] bg-white">
                    <option value="" disabled>Select a category</option>
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Price (₹)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px]" />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Original Price (₹)</label>
                  <input required type="number" value={formData.original_price} onChange={e => setFormData({...formData, original_price: parseInt(e.target.value)})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px]" />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Product Image</label>
                  
                  <div className="image-upload-area">
                    {formData.image_url && !showUrlFallback ? (
                      <div className="relative w-full sm:w-1/2">
                        <img src={formData.image_url} className="w-full h-48 object-cover rounded-xl border border-theme" alt="Preview"/>
                        <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      !showUrlFallback && (
                        <label 
                          onDrop={handleImageUpload}
                          onDragOver={handleDragOver}
                          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-gray-300 bg-gray-50' : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'}`}
                        >
                          <Upload className={`w-10 h-10 mb-3 ${uploading ? 'text-gray-400' : 'text-emerald-400'}`} />
                          <span className={`font-medium ${uploading ? 'text-gray-500' : 'text-emerald-700'}`}>
                            {uploading ? 'Uploading...' : 'Click or drop to upload product image'}
                          </span>
                          <span className="text-gray-400 text-sm mt-1">
                            PNG, JPG, WEBP up to 5MB
                          </span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                      )
                    )}

                    {uploading && (
                      <div className="mt-3 w-full sm:w-1/2">
                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                          <span>Uploading...</span>
                          {uploadProgress > 0 && <span>{uploadProgress}%</span>}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress > 0 ? uploadProgress : 60}%` }} />
                        </div>
                      </div>
                    )}

                    {showUrlFallback && (
                       <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px]" placeholder="https://..." />
                    )}

                    <button type="button" onClick={() => setShowUrlFallback(!showUrlFallback)} className="text-gray-400 hover:text-gray-600 text-[12px] font-body underline underline-offset-2 mt-2 inline-block">
                      {showUrlFallback ? "Switch to image upload" : "Or paste image URL instead"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full border border-theme rounded-lg p-3 font-body text-[14px]" />
                </div>

                <div className="flex gap-6 col-span-2">
                  <label className="flex items-center gap-2 font-body text-[14px]">
                    <input type="checkbox" checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} className="w-4 h-4 text-theme-bg-deep rounded" />
                    In Stock
                  </label>
                  <label className="flex items-center gap-2 font-body text-[14px]">
                    <input type="checkbox" checked={formData.is_bestseller} onChange={e => setFormData({...formData, is_bestseller: e.target.checked})} className="w-4 h-4 text-theme-bg-deep rounded" />
                    Bestseller Badge
                  </label>
                  <label className="flex items-center gap-2 font-body text-[14px] text-amber-600 font-medium">
                    <input type="checkbox" checked={formData.is_top_seller} onChange={e => setFormData({...formData, is_top_seller: e.target.checked})} className="w-4 h-4 text-amber-500 rounded" />
                    Top Seller (Shows in Marquee)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-theme">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-body font-medium bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-body font-medium bg-theme-bg-deep text-white hover:bg-emerald-800 transition-colors">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
