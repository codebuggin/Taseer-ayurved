import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import TestimonialCard from './TestimonialCard';

export default function FeaturedTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setTestimonials(data);
        }
      } catch (err) {
        console.error('Error fetching featured testimonials:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  if (loading || testimonials.length === 0) return null;

  return (
    <section className="pt-12 pb-24 bg-theme-bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="text-center md:text-left mb-12">
          <h2 className="font-heading italic text-[36px] text-[#0d5c3a] leading-tight mb-3">
            Mareez Ki Zubaan
          </h2>
          <p className="font-body text-[16px] text-gray-500">
            Unfiltered. Unscripted. Unbelievable results.
          </p>
        </div>

        {/* Horizontal Scroll Row */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 pt-4 -mx-6 px-6 lg:-mx-12 lg:px-12 no-scrollbar" style={{ scrollPaddingLeft: '1.5rem' }}>
          {testimonials.map(t => (
            <TestimonialCard 
              key={t.id} 
              testimonial={t} 
              additionalClasses="min-w-[320px] max-w-[380px] w-[85vw] snap-start shrink-0"
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/testimonials" 
            className="inline-flex items-center gap-2 justify-center px-8 py-3.5 border-2 border-[#0d5c3a] text-[#0d5c3a] font-body font-medium rounded-full hover:bg-[#0d5c3a] hover:text-white transition-all duration-300"
          >
            View All Patient Stories
            <ArrowRight size={18} />
          </Link>
        </div>

      </div>
    </section>
  );
}
