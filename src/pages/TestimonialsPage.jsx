import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TestimonialCard from '../components/TestimonialCard';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching testimonials:', error);
        } else {
          setTestimonials(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, []);

  const filters = ['All', 'Hindi', 'Urdu', 'English'];
  
  const filteredTestimonials = filter === 'All' 
    ? testimonials 
    : testimonials.filter(t => t.language?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="min-h-screen bg-theme-bg-primary">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#0d5c3a] to-[#1a7a50] py-20 px-6 lg:px-16 text-center">
        <div className="inline-block bg-white/15 text-white rounded-full px-4 py-1.5 mb-6 text-[13px] font-medium tracking-wide backdrop-blur-sm">
          🎥 Video Testimonials
        </div>
        <h1 className="font-heading italic text-[42px] md:text-[52px] text-white leading-tight mb-4 dropdown-shadow">
          Mareez Ki Zubaan
        </h1>
        <p className="font-body text-[16px] md:text-[18px] text-white/80 max-w-2xl mx-auto">
          मरीज़ की ज़बान — Real patients. Real results. Real healing.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Filter Tabs */}
        <div className="flex justify-center items-center gap-2 md:gap-4 py-8 px-6 overflow-x-auto no-scrollbar border-b border-theme/30">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-full px-6 py-2 text-[14px] font-medium transition-all duration-200 ${
                filter === f 
                  ? 'bg-theme-accent text-white shadow-md' 
                  : 'bg-white text-gray-500 border border-theme hover:bg-theme-bg-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        <div className="py-12 px-6 lg:px-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-theme-bg-secondary border-t-theme-accent animate-spin mb-4"></div>
              <p className="text-theme-text-muted font-body">Loading stories...</p>
            </div>
          ) : filteredTestimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredTestimonials.map(t => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-theme shadow-sm">
              <p className="text-gray-500 font-body">No testimonials found for this category yet.</p>
              <button 
                onClick={() => setFilter('All')} 
                className="mt-4 text-theme-accent font-medium hover:underline"
              >
                View all stories
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
