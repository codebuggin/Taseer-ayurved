import { Link } from 'react-router-dom';

export default function BlogPreview() {
  const articles = [
    {
      title: "How Ayurveda Dissolves Kidney Stones Without Surgery",
      category: "Kidney Care",
      readTime: "5 min read",
      img: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600"
    },
    {
      title: "Thyroid & Your Diet: What Vaid Sahab Recommends After 20 Years of Research",
      category: "Thyroid Care",
      readTime: "4 min read",
      img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600"
    },
    {
      title: "Piles: Why Surgery Is Never the First Option in Ayurveda",
      category: "Digestive Health",
      readTime: "6 min read",
      img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600"
    }
  ];

  return (
    <section className="py-24 bg-theme-bg-secondary">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-heading italic text-4xl md:text-[48px] text-[#111] mb-4">
            Ayurvedic Health Guide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <div key={idx} className="bg-white rounded-2xl overflow-hidden group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer">
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                <img 
                  src={article.img} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="font-mono text-xs text-amber-500 uppercase tracking-widest mb-3">
                  {article.category}
                </div>
                <h3 className="font-heading font-medium text-[20px] text-[#111] leading-snug mb-3">
                  {article.title}
                </h3>
                <div className="mt-auto">
                  <div className="font-body text-xs text-gray-400 mb-4">
                    {article.readTime}
                  </div>
                  <span className="font-body text-sm font-medium text-emerald-700 flex items-center gap-2 group-hover:gap-3 transition-all">
                    Read More <span>→</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
