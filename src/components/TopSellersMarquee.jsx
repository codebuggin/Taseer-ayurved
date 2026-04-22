import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TopSellersMarquee() {
  const [topSellers, setTopSellers] = useState([]);

  useEffect(() => {
    async function fetchMarqueeProducts() {
      const { data } = await supabase
        .from('products')
        .select('name, price')
        .eq('is_top_seller', true)
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setTopSellers(data);
      }
    }
    fetchMarqueeProducts();
  }, []);

  if (topSellers.length === 0) return null;

  return (
    <div className="bg-amber-50 border-y border-amber-200 py-3 overflow-hidden relative">
      <div className="flex whitespace-nowrap animate-marquee">
        {topSellers.map((item, index) => (
          <span key={index} className="flex items-center mx-4">
            <span className="font-mono text-[12px] text-emerald-700">
              🌿 {item.name} — ₹{item.price}
            </span>
            <span className="text-amber-500 mx-4">·</span>
          </span>
        ))}
        {/* Duplicate the list to create a seamless loop */}
        {topSellers.map((item, index) => (
          <span key={`dup-${index}`} className="flex items-center mx-4">
            <span className="font-mono text-[12px] text-emerald-700">
              🌿 {item.name} — ₹{item.price}
            </span>
            <span className="text-amber-500 mx-4">·</span>
          </span>
        ))}
        {topSellers.map((item, index) => (
          <span key={`dup2-${index}`} className="flex items-center mx-4">
            <span className="font-mono text-[12px] text-emerald-700">
              🌿 {item.name} — ₹{item.price}
            </span>
            <span className="text-amber-500 mx-4">·</span>
          </span>
        ))}
        {topSellers.map((item, index) => (
          <span key={`dup3-${index}`} className="flex items-center mx-4">
            <span className="font-mono text-[12px] text-emerald-700">
              🌿 {item.name} — ₹{item.price}
            </span>
            <span className="text-amber-500 mx-4">·</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
