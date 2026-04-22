import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorks() {
  const comp = useRef();

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.step-item', {
        scrollTrigger: {
          trigger: comp.current,
          start: 'top 80%',
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
      });
    }, comp);
    return () => ctx.revert();
  }, []);

  const steps = [
    { num: '1', title: 'Choose Your Concern', desc: 'Identify your health goal from our targeted Ayurvedic formulations.' },
    { num: '2', title: 'Book Consultation', desc: 'Speak to our experts to verify the right dosage and routine.' },
    { num: '3', title: 'Receive Your Formula', desc: 'Delivered securely anywhere in India with plain packaging.' },
  ];

  return (
    <section ref={comp} className="py-24 bg-white border-t border-theme-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-[32px] md:text-[40px] text-theme-text-primary mb-4">
            How It Works
          </h2>
          <p className="font-body text-theme-text-muted max-w-2xl mx-auto">
            A simple, transparent process to begin your Ayurvedic healing journey.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Dotted Line (hidden on mobile) */}
          <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] border-t-2 border-dashed border-emerald-200 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="step-item flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center font-heading font-bold text-[24px] shadow-lg mb-6 shadow-emerald-700/20">
                  {step.num}
                </div>
                <h3 className="font-heading font-semibold text-[20px] text-theme-text-primary mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-[14px] leading-relaxed text-theme-text-muted max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
