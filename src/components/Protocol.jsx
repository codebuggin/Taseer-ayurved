import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- Subcomponent: Mandala Canvas ---
const MandalaVisual = () => {
  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden">
      <svg className="w-64 h-64 md:w-96 md:h-96 animate-[spin_40s_linear_infinite]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="90" className="stroke-theme-accent/30 dark:stroke-theme-accent/40" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="70" className="stroke-theme-accent/50 dark:stroke-theme-accent/60" strokeWidth="1" />
        <path d="M100 20 L100 180 M20 100 L180 100 M45 45 L155 155 M45 155 L155 45" className="stroke-theme-accent/20 dark:stroke-theme-accent/30" strokeWidth="1" />
        {/* Decorative Petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path key={angle} d="M100 100 Q 130 50 100 20 Q 70 50 100 100" className="stroke-theme-accent/50 dark:stroke-theme-accent/80 dark:drop-shadow-[0_0_8px_rgba(212,160,23,0.5)]" strokeWidth="1.5" transform={`rotate(${angle} 100 100)`} fill="transparent" />
        ))}
      </svg>
    </div>
  );
};

// --- Subcomponent: Laser Grid Canvas ---
const LaserGridVisual = () => {
  const gridRef = useRef();
  
  useEffect(() => {
    let ctx = gsap.context(() => {
      // Animate laser sweep
      gsap.to('.laser-line', {
        y: 280,
        duration: 3,
        ease: 'linear',
        repeat: -1,
        yoyo: true
      });
      
      // Light up dots as laser passes (simulated by a pulsing visual effect)
      gsap.to('.grid-dot', {
        opacity: 0.8,
        scale: 1.5,
        duration: 0.2,
        stagger: {
          each: 0.05,
          from: "random",
          repeat: -1,
          yoyo: true
        }
      });
    }, gridRef);
    return () => ctx.revert();
  }, []);

  // 8x8 grid
  const dots = Array.from({ length: 64 });

  return (
    <div ref={gridRef} className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden">
      <div className="relative w-64 h-64 md:w-80 md:h-80 grid grid-cols-8 grid-rows-8 gap-4 place-items-center opacity-40 mix-blend-screen">
        {dots.map((_, i) => (
          <div key={i} className="grid-dot w-1.5 h-1.5 rounded-full bg-theme-accent/30 dark:bg-theme-accent/50 dark:shadow-[0_0_8px_rgba(212,160,23,0.8)]" />
        ))}
        {/* Scanning Laser */}
        <div className="laser-line absolute top-0 left-0 w-full h-[2px] bg-theme-accent shadow-[0_0_15px_var(--accent)] dark:shadow-[0_0_20px_var(--accent),_0_0_40px_var(--accent)] z-10" />
      </div>
    </div>
  );
};

// --- Subcomponent: EKG Canvas ---
const SystemEKGVisual = () => {
  const ekgRef = useRef();

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Chaotic to smooth transition
      const tl = gsap.timeline({ repeat: -1 });
      
      tl.to('.ekg-path-chaotic', { strokeDashoffset: 0, duration: 1.5, ease: 'power1.inOut' })
        .to('.ekg-path-chaotic', { opacity: 0, duration: 0.5 }, '>')
        .to('.ekg-path-smooth', { opacity: 1, duration: 0.5 }, '<')
        .to('.ekg-path-smooth', { strokeDashoffset: 0, duration: 2, ease: 'power2.out' })
        .to('.ekg-path-smooth', { opacity: 0, duration: 0.5, delay: 0.5 })
        .set('.ekg-path-chaotic', { strokeDashoffset: 1000, opacity: 1 })
        .set('.ekg-path-smooth', { strokeDashoffset: 1000 });
        
    }, ekgRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ekgRef} className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden">
      <svg className="w-full max-w-lg h-32 md:h-48" viewBox="0 0 500 150" fill="none">
        <path 
          className="ekg-path-chaotic stroke-red-500/60 dark:stroke-red-500/80 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          d="M 0 75 L 50 75 L 60 40 L 70 110 L 80 20 L 90 130 L 100 50 L 110 90 L 120 75 L 170 75 L 180 10 L 190 140 L 200 30 L 210 120 L 220 75 L 500 75" 
        />
        <path 
          className="ekg-path-smooth stroke-theme-accent opacity-0 drop-shadow-[0_0_12px_var(--accent)]" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          d="M 0 75 L 150 75 L 165 75 L 180 50 L 195 100 L 210 75 L 350 75 L 365 75 L 380 40 L 395 110 L 410 75 L 500 75" 
        />
      </svg>
    </div>
  );
};

// --- Main Component ---
export default function Protocol() {
  const container = useRef();

  useEffect(() => {
    let ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.protocol-card');
      
      cards.forEach((card, i) => {
        // Sticky stacking effect
        ScrollTrigger.create({
          trigger: card,
          start: 'top top',
          end: `+=${window.innerHeight}`, // Pin for one screen height
          pin: true,
          pinSpacing: false, // Allows next card to slide over
          id: `pin-${i}`,
        });

        // Scale down previous card as next one comes up
        if (i < cards.length - 1) {
          gsap.to(card, {
            scrollTrigger: {
              trigger: cards[i + 1],
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            },
            scale: 0.9,
            opacity: 0.5,
            filter: 'blur(20px)',
            transformOrigin: 'top center',
            ease: 'none',
          });
        }
      });
      
    }, container);
    
    // Refresh ScrollTrigger on resize or theme change just in case to recalculate heights
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('theme-changed', refresh);
    
    return () => {
      ctx.revert();
      window.removeEventListener('resize', refresh);
      window.removeEventListener('theme-changed', refresh);
    };
  }, []);

  const steps = [
    {
      num: "01",
      title: "20 Years of Personal Research",
      desc: "Every formulation is born from two decades of clinical observation and ancient text analysis.",
      bgClass: "bg-theme-bg-secondary",
      Visual: MandalaVisual
    },
    {
      num: "02",
      title: "Prepared By Hand, For You",
      desc: "We do not mass-produce. Your medicine is created specifically for your body's current state.",
      bgClass: "bg-theme-bg-deep",
      Visual: LaserGridVisual
    },
    {
      num: "03",
      title: "Follow-Up Until You Heal",
      desc: "Our protocol doesn't end with a prescription. We track your progress until balance is restored.",
      bgClass: "bg-theme-bg-secondary",
      Visual: SystemEKGVisual
    }
  ];

  return (
    <section ref={container} className="relative z-10">
      <div className="protocol-container">
        {steps.map((step, i) => (
          <div 
            key={i} 
            className={`protocol-card w-full h-[100dvh] flex flex-col md:flex-row items-center justify-center border-t border-theme ${step.bgClass} relative`}
          >
            {/* Dark mode overlay subtle shadow to separate layers */}
            <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-black/20 to-transparent pointer-events-none opacity-0 dark:opacity-100" />
            
            <div className="w-full md:w-1/2 flex justify-center items-center h-1/2 md:h-full order-2 md:order-1 px-8">
              <step.Visual />
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col justify-center h-1/2 md:h-full px-8 md:pl-16 lg:pl-24 order-1 md:order-2">
              <div className="font-mono text-xl md:text-2xl text-theme-accent mb-6 font-semibold">
                {step.num}
              </div>
              <h2 className={`font-drama text-4xl md:text-5xl lg:text-[52px] leading-tight mb-6 ${step.bgClass === 'bg-theme-bg-deep' ? 'text-theme-text-inverse' : 'text-theme-text-primary'}`}>
                {step.title}
              </h2>
              <p className={`font-body font-light max-w-md text-base md:text-lg leading-relaxed ${step.bgClass === 'bg-theme-bg-deep' ? 'text-theme-text-inverse/70' : 'text-theme-text-primary/70'}`}>
                {step.desc}
              </p>
            </div>
            
          </div>
        ))}
      </div>
    </section>
  );
}
