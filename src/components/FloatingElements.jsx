import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function FloatingElements() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = `${scrollPx / winHeightPx * 100}%`;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 h-[2px] w-full z-[100] pointer-events-none">
        <div 
          className="h-full bg-theme-accent transition-all duration-100 ease-out dark:shadow-[0_0_8px_var(--accent)]" 
          style={{ width: scrollProgress }} 
        />
      </div>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/917405410856" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-[0_8px_20px_rgba(37,211,102,0.4)] dark:shadow-[0_0_20px_rgba(37,211,102,0.3)] will-change-transform animate-pulse"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={28} className="fill-current" />
      </a>
    </>
  );
}
