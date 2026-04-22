import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

export default function DoctorAuthority() {
  const container = useRef();

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.auth-fade', {
        scrollTrigger: { trigger: container.current, start: 'top 75%' },
        y: 30, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
      });
    }, container);
    return () => ctx.revert();
  }, []);


  return (
    <section ref={container} id="our-story" className="pt-24 pb-12 lg:pb-16 bg-theme-bg-primary">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-16 xl:gap-24 items-center">
        
        {/* Left Column (Content) */}
        <div className="w-full lg:w-1/2 order-2 lg:order-1">
          
          <div className="auth-fade font-mono text-[11px] text-theme-accent tracking-widest uppercase mb-6">
            MEET YOUR HEALER
          </div>
            
          <div className="auth-fade border-l-4 border-theme-accent pl-6 md:pl-8 mb-10">
            <p className="font-heading italic text-[24px] md:text-[32px] text-theme-text-primary leading-relaxed text-balance">
              "I do not eat for 20 hours while preparing my medicines. Every formulation carries my research, my intention, and my commitment."
            </p>
            <p className="font-mono text-[13px] text-theme-bg-deep mt-4 tracking-wide uppercase">
              — Vaid Ali Shaikh
            </p>
          </div>
          
          <div className="auth-fade">
            <button onClick={() => window.location.href='/contact'} className="magnetic-btn bg-theme-bg-deep text-white px-8 py-4 rounded-full font-body font-medium transition-all hover:bg-theme-accent hover:text-theme-text-primary hover:shadow-lg w-full sm:w-auto text-center">
              Book a Personal Consultation
            </button>
          </div>
        </div>
        
        {/* Right Column (Image Portrait) */}
        <div className="w-full lg:w-1/2 aspect-[3/4] max-w-md mx-auto lg:mx-0 lg:max-w-none order-1 lg:order-2 auth-fade relative">
          <div className="w-full h-full rounded-[16px] overflow-hidden bg-theme-bg-secondary shadow-xl relative border border-theme/50 flex items-center justify-center p-0">
            <img 
              src="/images/WhatsApp Image 2026-02-12 at 12.09.40 PM.jpeg" 
              alt="" 
              className="w-full h-full object-cover object-top" 
            />
            
            {/* Overlay Info Card */}
            <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[16px] p-5 md:p-6 border border-theme transform translate-y-4 hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-heading font-semibold text-[20px] md:text-[24px] text-theme-text-primary mb-1">Vaid Ali Shaikh</h3>
              <div className="font-mono text-[11px] text-theme-accent uppercase tracking-widest mb-3">Chief Formulator</div>
              <div className="font-body text-[12px] text-theme-text-muted flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="leading-tight">68/30, Nagpur Vora Ki Chawl,<br/>Opp. Jhulta Minara, Gomtipur,<br/>Ahmedabad - 380021</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
