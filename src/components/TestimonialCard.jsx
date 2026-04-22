import { useState } from 'react';
import { Play, Share2 } from 'lucide-react';

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function TestimonialCard({ testimonial, additionalClasses = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ytId = getYouTubeId(testimonial.video_url);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Taseer Ayurved - ${testimonial.patient_name}'s Story`,
          text: testimonial.description,
          url: `${window.location.origin}/testimonials`,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/testimonials`);
      alert("Link copied to clipboard!");
    }
  };

  const formattedDate = new Date(testimonial.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={`bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-theme/20 ${additionalClasses}`}>
      {/* Video Player Area - 16:9 */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%',
        backgroundColor: '#0d5c3a',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%'
        }}>
          {testimonial.video_url ? (
            ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              <video
                key={testimonial.video_url}
                controls
                playsInline
                preload="metadata"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              >
                <source 
                  src={testimonial.video_url} 
                  type="video/mp4" 
                />
                Your browser does not support video.
              </video>
            )
          ) : (
            <div className="w-full h-full inset-0 absolute bg-gradient-to-br from-[#0d5c3a] to-[#1a7a50] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Play className="text-white ml-1" size={32} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-3">
          <span className="inline-block bg-[#e8f5ee] text-[#0d5c3a] text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full">
            {testimonial.condition_treated}
          </span>
        </div>
        
        <h3 className="font-heading font-bold text-[20px] text-[#0d1f14] mb-2 leading-tight">
          {testimonial.patient_name}
        </h3>

        <div className="mt-2 mb-4">
          <p className={`font-body text-[14px] text-[#4a5568] leading-[1.6] whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>
            {testimonial.description}
          </p>
          {testimonial.description && testimonial.description.split('\\n').length > 3 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#0d5c3a] font-medium text-[13px] hover:underline mt-1 focus:outline-none"
            >
              {isExpanded ? 'Read less ↑' : 'Read more ↓'}
            </button>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <span className="bg-gray-100 text-gray-600 text-[12px] px-2.5 py-0.5 rounded-full font-medium capitalize">
              {testimonial.language}
            </span>
            <span className="text-gray-400 text-[12px] font-body">
              {formattedDate}
            </span>
          </div>
          <button 
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-[#0d5c3a] transition-colors rounded-full hover:bg-[#e8f5ee]"
            title="Share this story"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
