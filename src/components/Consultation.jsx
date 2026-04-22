import { MessageCircle, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Consultation() {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setStatus('loading');

    const { error } = await supabase.from('consultations').insert({
      name: 'Homepage Callback Request',
      phone: phone,
      message: '[Quick Action] Requested a callback from the homepage.',
    });

    if (error) {
      console.error(error);
      setStatus('error');
    } else {
      setStatus('success');
      setPhone('');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };
  return (
    <section className="bg-emerald-700 py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
        <h2 className="font-heading italic text-4xl md:text-[48px] text-white leading-tight mb-4">
          Book a Personal Consultation
        </h2>
        
        <p className="font-body font-light text-white/70 max-w-xl mx-auto text-[16px]">
          Speak directly with Vaid Ali Shaikh. Describe your condition. Get a personal formula.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="tel:+917405410856" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-amber-500 text-gray-900 rounded-full font-body font-semibold hover:-translate-y-1 hover:shadow-lg transition-all">
              <PhoneCall size={18} />
              Call Now
            </a>
            <a href="https://wa.me/917405410856" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-emerald-700 rounded-full font-body font-semibold hover:bg-gray-100 transition-colors">
              <MessageCircle size={18} />
              WhatsApp Us
            </a>
          </div>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="text-white/80 font-mono text-[11px] mb-3 uppercase tracking-wider">Or request a free callback</div>
          <form onSubmit={handleSubmit} className="flex relative">
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number" 
              className="w-full h-[52px] rounded-full px-6 font-body text-[14px] bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="absolute right-1 top-1 bottom-1 px-6 bg-amber-500 text-gray-900 rounded-full font-body font-semibold text-[13px] hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? 'Sending...' : 'Request'}
            </button>
          </form>
          {status === 'success' && (
            <div className="text-amber-400 font-body text-[13px] mt-2">Callback requested! We'll call you shortly.</div>
          )}
          {status === 'error' && (
            <div className="text-red-400 font-body text-[13px] mt-2">Failed to request callback. Please call us directly.</div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 font-mono text-[11px] text-white/50 tracking-wider uppercase">
          <span>✓ Free first consultation</span>
          <span className="hidden sm:inline">·</span>
          <span>✓ Personal formula prepared</span>
          <span className="hidden sm:inline">·</span>
          <span>✓ Follow-up until healed</span>
        </div>
      </div>
    </section>
  );
}
