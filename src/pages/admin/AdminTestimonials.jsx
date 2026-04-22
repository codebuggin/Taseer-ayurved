import { Plus, Edit2, Trash2, X, Upload, Video, Star, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    patient_name: '', condition_treated: '', video_url: '', 
    thumbnail_url: '', description: '', language: 'hindi',
    is_featured: false, is_active: true
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoMode, setVideoMode] = useState('upload'); // 'upload' or 'youtube'
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    setLoading(true);
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (data) setTestimonials(data);
    setLoading(false);
  }

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (testimonial = null) => {
    if (testimonial) {
      setEditingId(testimonial.id);
      setFormData(testimonial);
      setVideoMode(testimonial.video_url?.includes('youtube.com') || testimonial.video_url?.includes('youtu.be') ? 'youtube' : 'upload');
    } else {
      setEditingId(null);
      setFormData({
        patient_name: '', condition_treated: '', video_url: '', 
        thumbnail_url: '', description: '', language: 'hindi',
        is_featured: false, is_active: true
      });
      setVideoMode('upload');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setUploading(false);
    setUploadProgress(0);
  };
  
  const handleVideoUpload = async (e) => {
    e.preventDefault();
    let file;
    if (e.dataTransfer && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    } else if (e.target && e.target.files) {
      file = e.target.files[0];
    }
    
    if (!file) return;
    
    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert('Video must be under 100MB');
      return;
    }
    
    setUploading(true);
    setUploadProgress(10);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `testimonials/${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('testimonial-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    
    // Simulate progress completion
    setUploadProgress(100);
    
    const { data: { publicUrl } } = supabase.storage
      .from('testimonial-videos')
      .getPublicUrl(filePath);
    
    setFormData(prev => ({ ...prev, video_url: publicUrl }));
    setUploading(false);
  };

  const handleThumbnailUpload = async (e) => {
    e.preventDefault();
    let file;
    if (e.dataTransfer && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    } else if (e.target && e.target.files) {
      file = e.target.files[0];
    }
    if (!file) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;
    
    const { error } = await supabase.storage
      .from('testimonial-videos')
      .upload(filePath, file);
      
    if (error) {
      alert('Thumbnail upload failed: ' + error.message);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('testimonial-videos')
      .getPublicUrl(filePath);
      
    setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
  };
  
  const removeVideo = async () => {
    // Basic cleanup logic could go here
    setFormData(prev => ({ ...prev, video_url: '' }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    if (editingId) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', editingId);
      if (!error) {
        fetchTestimonials();
        showToast('Testimonial saved successfully ✓');
      }
    } else {
      const { error } = await supabase.from('testimonials').insert(payload);
      if (!error) {
        fetchTestimonials();
        showToast('Testimonial saved successfully ✓');
      }
    }
    closeModal();
  };

  const handleDelete = async (id, videoUrl, thumbUrl) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      if (videoUrl && videoUrl.includes('testimonial-videos')) {
        const path = videoUrl.split('/testimonial-videos/')[1];
        if (path) await supabase.storage.from('testimonial-videos').remove([path]);
      }
      if (thumbUrl && thumbUrl.includes('testimonial-videos')) {
        const path = thumbUrl.split('/testimonial-videos/')[1];
        if (path) await supabase.storage.from('testimonial-videos').remove([path]);
      }
      await supabase.from('testimonials').delete().eq('id', id);
      fetchTestimonials();
    }
  };

  const toggleStatus = async (id, field, currentValue) => {
    await supabase.from('testimonials').update({ [field]: !currentValue }).eq('id', id);
    setTestimonials(testimonials.map(t => t.id === id ? { ...t, [field]: !currentValue } : t));
  };

  if (loading) return <div className="p-8 font-body">Loading testimonials...</div>;

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg font-body text-sm z-50 flex items-center gap-2 animate-bounce-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl text-theme-text-primary font-bold">Testimonials</h1>
        <button onClick={() => handleOpenModal()} className="bg-theme-accent text-theme-text-primary hover:bg-[#d69900] px-5 py-2.5 rounded-xl font-body font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Add Testimonial
        </button>
      </div>

      <div className="bg-white rounded-[16px] border border-theme shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-[14px]">
            <thead className="bg-theme-bg-secondary text-theme-text-muted">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Patient Name</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Condition</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Language</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Video</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-center">Featured</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-center">Active</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Date</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {testimonials.map((testi) => (
                <tr key={testi.id} className="hover:bg-theme-bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-heading font-medium text-[15px] text-theme-text-primary">
                    {testi.patient_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#f0f7f3] text-theme-bg-deep px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider inline-block">
                      {testi.condition_treated}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-theme-text-muted capitalize">
                    {testi.language}
                  </td>
                  <td className="px-6 py-4">
                    {testi.video_url ? (
                      testi.thumbnail_url ? (
                        <img src={testi.thumbnail_url} className="w-12 h-8 object-cover rounded" alt="Thumb" />
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 flex items-center justify-center gap-1 w-fit rounded text-xs font-medium">
                          🎥 Video
                        </span>
                      )
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                        No video
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleStatus(testi.id, 'is_featured', testi.is_featured)}
                      className={`p-1.5 rounded-full transition-colors ${testi.is_featured ? 'bg-amber-100 text-amber-500' : 'bg-gray-100 text-gray-400 hover:bg-amber-50'}`}
                      title="Featured on Homepage"
                    >
                      <Star size={16} fill={testi.is_featured ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleStatus(testi.id, 'is_active', testi.is_active)}
                      className={`flex items-center justify-center w-8 h-8 mx-auto rounded-full transition-colors ${testi.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}
                    >
                      {testi.is_active ? <Eye size={16} /> : <X size={16} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-theme-text-muted text-xs">
                    {new Date(testi.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleOpenModal(testi)} className="p-2 text-theme-text-muted hover:text-theme-bg-deep transition-colors bg-theme-bg-secondary rounded-lg"><Edit2 size={16} /></button>
                       <button onClick={() => handleDelete(testi.id, testi.video_url, testi.thumbnail_url)} className="p-2 text-theme-text-muted hover:text-red-500 transition-colors bg-theme-bg-secondary rounded-lg"><Trash2 size={16} /></button>
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
              <h2 className="font-heading font-bold text-2xl">{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Patient Name</label>
                  <input required type="text" value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px]" />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Condition Treated</label>
                  <input required type="text" value={formData.condition_treated} onChange={e => setFormData({...formData, condition_treated: e.target.value})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px]" />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Language</label>
                  <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px] bg-white">
                    <option value="hindi">Hindi</option>
                    <option value="urdu">Urdu</option>
                    <option value="english">English</option>
                  </select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Video Source</label>
                  <div className="flex border border-theme rounded-lg overflow-hidden w-fit">
                    <button type="button" onClick={() => setVideoMode('upload')} className={`px-4 py-2 font-body text-[13px] ${videoMode === 'upload' ? 'bg-theme-bg-secondary font-semibold text-theme-text-primary' : 'bg-white text-theme-text-muted hover:bg-gray-50'}`}>Upload Video</button>
                    <button type="button" onClick={() => setVideoMode('youtube')} className={`px-4 py-2 font-body text-[13px] ${videoMode === 'youtube' ? 'bg-theme-bg-secondary font-semibold text-theme-text-primary' : 'bg-white text-theme-text-muted hover:bg-gray-50'}`}>YouTube URL</button>
                  </div>

                  <div className="mt-4 p-4 border border-theme rounded-xl bg-gray-50/50">
                    {videoMode === 'upload' ? (
                      <div className="image-upload-area">
                        {formData.video_url && !formData.video_url.includes('youtube') ? (
                          <div className="relative w-full">
                            <video src={formData.video_url} className="w-full h-48 object-cover rounded-lg border border-theme bg-black" controls />
                            <button type="button" onClick={removeVideo} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label 
                            onDrop={handleVideoUpload}
                            onDragOver={handleDragOver}
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-gray-300 bg-gray-50' : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'}`}
                          >
                            <Video className={`w-8 h-8 mb-2 ${uploading ? 'text-gray-400' : 'text-emerald-400'}`} />
                            <span className={`font-medium ${uploading ? 'text-gray-500' : 'text-emerald-700'}`}>
                              {uploading ? 'Uploading...' : '📹 Click or drag video here'}
                            </span>
                            <span className="text-gray-400 text-xs mt-1">.mp4 .mov .webm supported</span>
                            <span className="text-gray-400 text-xs mt-1">Max size: 100MB</span>
                            <input type="file" className="hidden" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoUpload} disabled={uploading} />
                          </label>
                        )}
                        {uploading && (
                          <div className="mt-3 w-full">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress > 0 ? uploadProgress : 60}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input type="text" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} className="w-full h-10 border border-theme rounded-lg px-3 font-body text-[14px] bg-white" placeholder="https://youtube.com/watch?v=..." />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Custom Thumbnail (Optional)</label>
                  <label className="flex items-center gap-3 w-full border border-theme border-dashed p-3 rounded-xl cursor-pointer hover:bg-gray-50">
                    <Upload className="text-emerald-500" size={20} />
                    <div className="font-body text-[13px] text-gray-600">
                      {formData.thumbnail_url ? 'Change Thumbnail' : 'Upload Thumbnail Image'}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                  </label>
                  {formData.thumbnail_url && (
                    <img src={formData.thumbnail_url} className="h-16 rounded object-cover mt-2 border border-gray-200" alt="Thumbnail" />
                  )}
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-theme-text-muted">Description (Quote & Story)</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={6} className="w-full border border-theme rounded-lg p-3 font-body text-[14px]" placeholder="Before: &#34;...&#34;&#10;After: &#34;...&#34;" />
                </div>

                <div className="flex gap-6 col-span-2">
                  <label className="flex items-center gap-2 font-body text-[14px] text-amber-600 font-medium">
                    <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} className="w-4 h-4 text-amber-500 rounded" />
                    Featured on Homepage
                  </label>
                  <label className="flex items-center gap-2 font-body text-[14px] text-emerald-700 font-medium">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded" />
                    Active (Visible on Testimonials Page)
                  </label>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-theme">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-body font-medium bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-body font-medium bg-theme-bg-deep text-white hover:bg-emerald-800 transition-colors">Save Testimonial</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
