import { motion } from 'framer-motion';
import { MapPin, Phone, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', category: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    const { error } = await supabase.from('consultations').insert({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      concern: formData.category,
      message: formData.message
    });

    if (error) {
      console.error(error);
      setStatus('error');
    } else {
      setStatus('success');
      setFormData({ name: '', phone: '', email: '', category: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-[100px] pb-24 bg-theme-bg-secondary min-h-screen"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-16">
        
        {/* Left: Form */}
        <div className="w-full lg:w-[55%] bg-white rounded-[24px] p-8 md:p-12 shadow-sm border border-theme">
          <h1 className="font-heading italic text-[40px] text-theme-text-primary mb-2">Consult Vaid Sahab</h1>
          <p className="font-body text-theme-text-muted text-[15px] mb-10">Send us a message about your health concern, and our team will get back to you with guidance.</p>
          
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 border border-theme rounded-xl px-4 font-body outline-none focus:border-theme-bg-deep focus:ring-1 focus:ring-theme-bg-deep transition-all bg-theme-bg-secondary" placeholder="Your Name" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider">Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 border border-theme rounded-xl px-4 font-body outline-none focus:border-theme-bg-deep focus:ring-1 focus:ring-theme-bg-deep transition-all bg-theme-bg-secondary" placeholder="+91 00000 00000" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider">Email (Optional)</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 border border-theme rounded-xl px-4 font-body outline-none focus:border-theme-bg-deep focus:ring-1 focus:ring-theme-bg-deep transition-all bg-theme-bg-secondary" placeholder="your@email.com" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider">Primary Concern</label>
              <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="h-12 border border-theme rounded-xl px-4 font-body outline-none focus:border-theme-bg-deep focus:ring-1 focus:ring-theme-bg-deep transition-all bg-theme-bg-secondary appearance-none">
                <option value="">Select a category</option>
                <option value="mens">Men's Health</option>
                <option value="womens">Women's Wellness</option>
                <option value="immunity">Immunity & Vitality</option>
                <option value="digestive">Digestive Issues</option>
                <option value="kidney">Kidney Stones (Calculi)</option>
                <option value="thyroid">Thyroid Balance</option>
                <option value="hair">Hair & Scalp</option>
                <option value="joints">Joint Pain</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider">Message Details</label>
              <textarea 
                required
                rows="4" 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="border border-theme rounded-xl p-4 font-body outline-none focus:border-theme-bg-deep focus:ring-1 focus:ring-theme-bg-deep transition-all bg-theme-bg-secondary resize-none" 
                placeholder="Briefly describe your symptoms or what you're looking for..."
              ></textarea>
            </div>

            {status === 'success' && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl font-body text-sm border border-emerald-200">
                Thank you! Your consultation request has been received. Our team will contact you shortly.
              </div>
            )}
            
            {status === 'error' && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl font-body text-sm border border-red-200">
                Failed to send request. please try calling us directly.
              </div>
            )}

            <button disabled={status === 'loading'} type="submit" className="w-full bg-theme-bg-deep text-white font-body font-medium px-6 py-4 rounded-xl mt-4 hover:bg-theme-accent hover:text-theme-text-primary hover:shadow-lg transition-all disabled:opacity-50">
              {status === 'loading' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Right: Info */}
        <div className="w-full lg:w-[45%] flex flex-col gap-6">
          <div className="mb-4">
            <h2 className="font-heading italic text-[32px] text-theme-text-primary">Visit Our Clinic</h2>
            <p className="font-body text-theme-text-muted text-[15px] mt-2">Open for in-person consultations in Ahmedabad.</p>
          </div>

          {/* Cards */}
          <div className="bg-white border border-theme rounded-[20px] p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-[#f0f7f3] text-theme-bg-deep rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <div className="font-heading font-semibold text-[18px] text-theme-text-primary mb-1">Clinic Address</div>
              <p className="font-body text-[14px] text-theme-text-muted leading-relaxed">
                68/30, Nagpur Vora Ki Chawl,<br/>
                Opp. Jhulta Minara, Gomtipur,<br/>
                Ahmedabad - 380021
              </p>
            </div>
          </div>

          <div className="bg-white border border-theme rounded-[20px] p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-[#f0f7f3] text-theme-bg-deep rounded-full flex items-center justify-center flex-shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <div className="font-heading font-semibold text-[18px] text-theme-text-primary mb-1">Phone Numbers</div>
              <div className="flex flex-col gap-1 font-mono text-[14px] text-theme-bg-deep font-bold">
                <a href="tel:+917405410856" className="hover:text-theme-accent transition-colors">+91 74054 10856</a>
                <a href="tel:+919664546963" className="hover:text-theme-accent transition-colors">+91 96645 46963</a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-theme rounded-[20px] p-6 flex items-start justify-between items-center group cursor-pointer hover:border-[#25D366] transition-colors" onClick={() => window.open('https://wa.me/917405410856', '_blank')}>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div className="font-heading font-semibold text-[18px] text-theme-text-primary">Chat on WhatsApp</div>
                  <div className="font-body text-[13px] text-theme-text-muted">Fastest response usually</div>
                </div>
             </div>
             <div className="text-[#25D366] group-hover:translate-x-1 transition-transform">→</div>
          </div>

          {/* Map Placeholder */}
          <div className="w-full h-48 bg-[#f0f7f3] rounded-[24px] border border-theme mt-2 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#0d5c3a 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
            <div className="bg-white px-6 py-3 rounded-full shadow-lg font-body font-medium text-[14px] text-theme-bg-deep flex items-center gap-2 group-hover:scale-105 transition-transform cursor-pointer">
              <MapPin className="flex-shrink-0" size={16} /> <span className="text-center">68/30, Nagpur Vora Ki Chawl, Gomtipur, Ahmedabad - 380021</span>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
