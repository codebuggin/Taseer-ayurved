import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function TrustBand() {
  const comp = useRef();

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.stat-item', {
        scrollTrigger: {
          trigger: comp.current,
          start: 'top 85%',
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }, comp);
    return () => ctx.revert();
  }, []);

  const stats = [
    { value: '20+', label: 'Years Research' },
    { value: '12,000+', label: 'Patients' },
    { value: '100+', label: 'Formulations' },
    { value: 'AYUSH', label: 'Certified' },
    { value: 'Holistic', label: 'Healing' },
  ];

  return (
    <section ref={comp} className="w-full bg-theme-bg-deep py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-8 md:gap-4 md:divide-x md:divide-white/20">
          {stats.map((stat, i) => (
            <div key={i} className="stat-item flex w-full md:w-auto flex-col items-center justify-center text-center px-4 md:flex-1">
              <span className="font-heading italic text-[40px] md:text-[52px] text-theme-accent mb-1 leading-none">
                {stat.value}
              </span>
              <span className="font-mono text-[11px] text-white/60 uppercase tracking-widest mt-2">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
