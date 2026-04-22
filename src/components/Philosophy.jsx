import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
  const comp = useRef();
  
  useEffect(() => {
    let ctx = gsap.context(() => {
      // Parallax image
      gsap.to('.parallax-bg', {
        scrollTrigger: {
          trigger: comp.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        y: '20%',
        ease: 'none'
      });

      // Statement reveals
      const stmts = gsap.utils.toArray('.reveal-line');
      stmts.forEach((stmt) => {
        gsap.from(stmt, {
          scrollTrigger: {
            trigger: stmt,
            start: 'top 85%',
          },
          y: 40,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
        });
      });
      
    }, comp);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={comp} className="relative py-32 bg-theme-bg-deep overflow-hidden">
      
      {/* Background Parallax Image */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img 
          src="https://images.unsplash.com/photo-1596431940381-424f9f60cce9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Organic Texture" 
          className="parallax-bg w-full h-[120%] object-cover opacity-[0.08] mix-blend-overlay scale-110 -translate-y-[10%]"
        />
        <div className="absolute inset-0 bg-theme-bg-deep/80" />
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
        <div className="reveal-line font-heading font-medium text-lg md:text-xl text-theme-text-inverse/50 mb-8 max-w-2xl leading-relaxed">
          Most Ayurvedic brands focus on: mass production, generic formulas, maximum shelf life.
        </div>
        
        <div className="reveal-line font-drama italic text-theme-text-inverse text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5rem] leading-[1.1] max-w-4xl tracking-tight">
          We focus on: your body, your condition, your <span className="text-theme-accent glow-text-dark">personally prepared</span> medicine.
        </div>
        
        <div className="reveal-line mt-24 pl-6 border-l-4 border-theme-accent pt-2 pb-2">
          <p className="font-drama italic text-2xl md:text-3xl text-theme-text-inverse/90 mb-4 max-w-2xl">
            "I do not eat for 20 hours while preparing my medicines."
          </p>
          <p className="font-mono text-xs md:text-sm text-theme-accent uppercase tracking-widest">
            — Vaid Ali Shaikh
          </p>
        </div>
      </div>
    </section>
  );
}
