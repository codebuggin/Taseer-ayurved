import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0d1f14] rounded-t-[3rem] pt-16 pb-8 px-6 lg:px-12 relative z-30 mt-[-2rem] border-t border-[#0a150e]">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <h2 className="font-heading text-3xl text-white font-bold tracking-tight mb-4">Taseer Ayurved</h2>
            <p className="font-body text-white/50 mb-8 leading-relaxed text-[14px]">
              Ancient Ayurvedic formulations personally researched and hand-prepared by Vaid Ali Shaikh.
            </p>
            {/* Placeholder social icons */}
            <div className="flex items-center gap-4 text-white/50">
               <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:text-white hover:border-white transition-colors cursor-pointer">In</div>
               <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:text-white hover:border-white transition-colors cursor-pointer">Fb</div>
               <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:text-white hover:border-white transition-colors cursor-pointer">Tw</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-body font-semibold text-white/90 mb-6 text-[15px]">Shop</h4>
            <ul className="flex flex-col gap-3 font-body text-[14px] text-white/50">
              <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/shop?category=Men's" className="hover:text-white transition-colors">Men's Health</Link></li>
              <li><Link to="/shop?category=Women's" className="hover:text-white transition-colors">Women's Wellness</Link></li>
              <li><Link to="/shop?category=Immunity" className="hover:text-white transition-colors">Immunity</Link></li>
              <li><Link to="/shop?category=Digestive" className="hover:text-white transition-colors">Digestive</Link></li>
              <li><Link to="/shop?category=Kidney" className="hover:text-white transition-colors">Kidney</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-body font-semibold text-white/90 mb-6 text-[15px]">Company</h4>
            <ul className="flex flex-col gap-3 font-body text-[14px] text-white/50">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/about#story" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-body font-semibold text-white/90 mb-6 text-[15px]">Contact</h4>
            <p className="font-body text-[14px] text-white/50 mb-6 leading-relaxed">
              68/30, Nagpur Vora Ki Chawl,<br/>
              Opp. Jhulta Minara, Gomtipur,<br/>
              Ahmedabad - 380021
            </p>
            <div className="flex flex-col gap-3 font-mono text-[13px] text-white/50 mb-6">
              <a href="tel:+917405410856" className="hover:text-white transition-colors">+91 74054 10856</a>
              <a href="tel:+919664546963" className="hover:text-white transition-colors">+91 96645 46963</a>
            </div>
              <a href="mailto:taseerayurved@gmail.com" className="font-mono text-[12px] text-white/60 hover:text-white transition-colors tracking-widest mt-4 inline-block">
                taseerayurved@gmail.com
              </a>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 mt-4 mb-8 flex flex-wrap justify-center gap-6 font-mono text-[12px] text-white/40 uppercase tracking-widest text-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-accent"></span>
            Cash on Delivery Available
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-bg-deep"></span>
            All India Courier
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
            Discreet Packaging
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-[13px] text-white/30 text-center md:text-left">
            &copy; {new Date().getFullYear()} Taseer Ayurved. All rights reserved.
          </p>
          
          <p className="font-body text-[13px] text-white/30">
            Built by <span className="text-theme-accent cursor-pointer hover:underline font-medium">AVL Innovations</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
