import { motion } from 'framer-motion';
import TrustBand from '../components/TrustBand';
import { Leaf, Award, ShieldCheck, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-[80px] bg-theme-bg-primary min-h-screen"
    >
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32">
        <div className="flex flex-col lg:flex-row gap-16 lg:items-start items-center">
          <div className="w-full lg:w-1/2 lg:pr-8">
            <h1 className="font-heading italic text-[48px] lg:text-[64px] text-theme-text-primary leading-[1.1] mb-6">
              The Story of Taseer Ayurved
            </h1>
            <p className="font-body text-[16px] md:text-[18px] text-theme-text-muted leading-relaxed mb-8">
              Founded on the principles of ancient Ayurvedic alchemy, Taseer Ayurved is not a commercial supplement company. It is a digital manifestation of Vaid Ali Shaikh's personal apothecary—a place where every formulation is hand-prepared with painstaking precision and pure intention to heal.
            </p>
          </div>
          <div className="w-full lg:w-[45%] lg:ml-auto relative mt-8 lg:mt-0">
            <div className="aspect-[4/5] bg-theme-bg-secondary rounded-[24px] overflow-hidden relative">
              <img 
                src="/images/WhatsApp Image 2026-02-12 at 12.09.40 PM.jpeg" 
                alt="Vaid Ali Shaikh" 
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            </div>
            
            {/* Overlay Card */}
            <div className="absolute -bottom-6 md:-bottom-10 left-1/2 -translate-x-1/2 w-[85%] bg-white rounded-[20px] p-6 md:p-8 shadow-xl border border-black/5">
              <h3 className="font-heading font-bold text-[28px] text-theme-text-primary mb-3">
                Vaid Ali Shaikh
              </h3>
              <div className="font-mono text-[13px] font-bold text-[#e8a500] tracking-widest uppercase mb-4">
                Chief Formulator
              </div>
              <div className="flex items-center gap-2 text-gray-500 font-body text-[14px]">
                <MapPin size={16} />
                <span className="leading-tight">68/30, Nagpur Vora Ki Chawl,<br/>Opp. Jhulta Minara, Gomtipur,<br/>Ahmedabad - 380021</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="bg-theme-bg-deep py-20 lg:py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #e8a500 0%, transparent 50%)' }}></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="font-heading italic text-[32px] md:text-[48px] text-white leading-tight mb-8">
            "I do not eat for 20 hours while preparing my medicines. Every formulation carries my research, my intention, and my commitment."
          </p>
          <div className="font-mono text-[13px] text-theme-accent tracking-widest uppercase">
            — Vaid Ali Shaikh, Chief Formulator
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-theme p-8 rounded-[20px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-[#f0f7f3] text-theme-bg-deep flex items-center justify-center rounded-2xl mb-6">
              <Award size={24} />
            </div>
            <h3 className="font-heading font-semibold text-[22px] text-theme-text-primary mb-3">Personal Care</h3>
            <p className="font-body text-theme-text-muted text-[15px] leading-relaxed">
              We treat patients, not just symptoms. Every product originates from clinical success with real people.
            </p>
          </div>
          <div className="bg-white border border-theme p-8 rounded-[20px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-[#f0f7f3] text-theme-bg-deep flex items-center justify-center rounded-2xl mb-6">
              <Leaf size={24} />
            </div>
            <h3 className="font-heading font-semibold text-[22px] text-theme-text-primary mb-3">Pure Ingredients</h3>
            <p className="font-body text-theme-text-muted text-[15px] leading-relaxed">
              No fillers, no binders, no synthetic isolates. Only whole-plant intelligence extracted via traditional methods.
            </p>
          </div>
          <div className="bg-white border border-theme p-8 rounded-[20px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-[#f0f7f3] text-theme-bg-deep flex items-center justify-center rounded-2xl mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-heading font-semibold text-[22px] text-theme-text-primary mb-3">Proven Results</h3>
            <p className="font-body text-theme-text-muted text-[15px] leading-relaxed">
              Over 12,000 documented successful cases backing our signature formulations.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-24 bg-theme-bg-secondary px-6 lg:px-12 border-t border-theme">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading italic text-[40px] text-theme-text-primary mb-16 text-center">Our Evolution</h2>
          
          <div className="relative pl-8 md:pl-0">
            {/* Center line on desktop, left line on mobile */}
            <div className="absolute left-[15px] md:left-1/2 md:-ml-px top-0 bottom-0 w-[2px] bg-theme-bg-deep/20"></div>
            
            <div className="flex flex-col gap-16">
              <div className="relative flex flex-col md:flex-row items-center justify-between w-full group">
                <div className="absolute left-0 md:left-1/2 w-[30px] h-[30px] rounded-full bg-theme-bg-deep border-4 border-white transform md:-translate-x-1/2 z-10 shadow-md group-hover:scale-125 transition-transform" />
                <div className="w-full md:w-[45%] pl-12 md:pl-0 md:text-right md:pr-12">
                  <div className="font-mono text-theme-accent text-[18px] font-bold mb-2">2005</div>
                  <h3 className="font-heading text-[24px] text-theme-text-primary mb-2">Practice Founded</h3>
                </div>
                <div className="w-full md:w-[45%] pl-12 md:pl-12 mt-2 md:mt-0">
                  <p className="font-body text-theme-text-muted text-[15px]">Vaid Ali Shaikh opens his first clinical practice in Ahmedabad, formulating remedies manually for local patients.</p>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-center justify-between w-full group">
                <div className="absolute left-0 md:left-1/2 w-[30px] h-[30px] rounded-full bg-theme-bg-deep border-4 border-white transform md:-translate-x-1/2 z-10 shadow-md group-hover:scale-125 transition-transform" />
                <div className="w-full md:w-[45%] md:order-2 pl-12 md:pl-12">
                  <div className="font-mono text-theme-accent text-[18px] font-bold mb-2">2010</div>
                  <h3 className="font-heading text-[24px] text-theme-text-primary mb-2">First 1000 Patients</h3>
                </div>
                <div className="w-full md:w-[45%] md:order-1 pl-12 md:pl-0 md:text-right md:pr-12 mt-2 md:mt-0">
                  <p className="font-body text-theme-text-muted text-[15px]">Word of mouth spreads. The clinic reaches a milestone of 1,000 successful holistic recoveries without aggressive marketing.</p>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-center justify-between w-full group">
                <div className="absolute left-0 md:left-1/2 w-[30px] h-[30px] rounded-full bg-theme-bg-deep border-4 border-white transform md:-translate-x-1/2 z-10 shadow-md group-hover:scale-125 transition-transform" />
                <div className="w-full md:w-[45%] pl-12 md:pl-0 md:text-right md:pr-12">
                  <div className="font-mono text-theme-accent text-[18px] font-bold mb-2">2018</div>
                  <h3 className="font-heading text-[24px] text-theme-text-primary mb-2">AYUSH Certified</h3>
                </div>
                <div className="w-full md:w-[45%] pl-12 md:pl-12 mt-2 md:mt-0">
                  <p className="font-body text-theme-text-muted text-[15px]">The 6 signature formulations receive official AYUSH certification, validating our clinical claims and purity standards.</p>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-center justify-between w-full group">
                <div className="absolute left-0 md:left-1/2 w-[30px] h-[30px] rounded-full bg-theme-accent border-4 border-white transform md:-translate-x-1/2 z-10 shadow-[0_0_15px_rgba(232,165,0,0.5)] group-hover:scale-125 transition-transform" />
                <div className="w-full md:w-[45%] md:order-2 pl-12 md:pl-12">
                  <div className="font-mono text-theme-accent text-[18px] font-bold mb-2">2024</div>
                  <h3 className="font-heading text-[24px] text-theme-text-primary mb-2">12,000+ Patients Healed</h3>
                </div>
                <div className="w-full md:w-[45%] md:order-1 pl-12 md:pl-0 md:text-right md:pr-12 mt-2 md:mt-0">
                  <p className="font-body text-theme-text-muted text-[15px]">Expanding beyond the physical clinic in Ahmedabad to offer these meticulously crafted formulations across India.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TrustBand />
    </motion.div>
  );
}
