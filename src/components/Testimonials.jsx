import { useState, useEffect } from 'react';
import TestimonialCard from './TestimonialCard';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchTestimonials() {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        // Only keep testimonials that actually have a video_url string defined.
        const validTestimonials = data.filter(t => t.video_url && t.video_url.trim() !== '');
        setTestimonials(validTestimonials);
      }
      setLoading(false);
    }
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  if (loading) return null;
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-emerald-800 overflow-hidden relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        
        <div className="text-center mb-16">
          <h2 className="font-heading italic text-4xl md:text-[52px] text-white">
            Patient Stories
          </h2>
        </div>
        
        <div className="relative">
           {/* Navigation Arrows */}
           {testimonials.length > 1 && (
             <>
                <button 
                  onClick={handlePrev} 
                  className="absolute left-0 top-1/2 -translate-y-1/2 -mt-6 -ml-4 md:-ml-12 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white text-white hover:text-emerald-800 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-white/20"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={handleNext} 
                  className="absolute right-0 top-1/2 -translate-y-1/2 -mt-6 -mr-4 md:-mr-12 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white text-white hover:text-emerald-800 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-white/20"
                >
                  <ChevronRight size={24} />
                </button>
             </>
           )}

           {/* Carousel Container */}
           <div className="overflow-hidden w-full pb-4">
             <div 
               className="flex transition-transform duration-700 ease-in-out"
               style={{ width: `${testimonials.length * 100}%`, transform: `translateX(-${currentIndex * (100 / testimonials.length)}%)` }}
             >
               {testimonials.map((testi) => (
                 <div key={testi.id} className="flex-shrink-0 px-2 md:px-6 box-border" style={{ width: `${100 / testimonials.length}%` }}>
                   <div className="max-w-xl mx-auto">
                     <TestimonialCard testimonial={testi} additionalClasses="h-full w-full" />
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Dots Indicators */}
           {testimonials.length > 1 && (
             <div className="flex justify-center gap-2 mt-8">
               {testimonials.map((_, idx) => (
                 <button
                   key={idx}
                   onClick={() => setCurrentIndex(idx)}
                   className={`transition-all duration-300 rounded-full ${currentIndex === idx ? 'bg-white w-8 h-2.5' : 'bg-white/30 hover:bg-white/50 w-2.5 h-2.5'}`}
                   aria-label={`Go to slide ${idx + 1}`}
                 />
               ))}
             </div>
           )}
        </div>
        
      </div>
    </section>
  );
}
