export default function WhyChooseUs() {
  const trustCards = [
    {
      icon: "🌿",
      title: "100% Natural",
      desc: "No chemicals, no side effects"
    },
    {
      icon: "✋",
      title: "Hand-Prepared",
      desc: "Made personally by Vaid sahab"
    },
    {
      icon: "📜",
      title: "AYUSH Certified",
      desc: "Government approved formulas"
    },
    {
      icon: "🚚",
      title: "All India Delivery",
      desc: "Courier to every state"
    },
    {
      icon: "🔒",
      title: "Discreet Packaging",
      desc: "Plain unmarked boxes"
    },
    {
      icon: "📞",
      title: "Personal Consultation",
      desc: "Direct access to doctor"
    }
  ];

  return (
    <section className="py-20 bg-theme-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-heading italic text-3xl md:text-5xl text-theme-text-primary mb-4">
            Why Choose Taseer Ayurved
          </h2>
          <p className="font-body text-[#6b7c6e] max-w-2xl mx-auto text-sm md:text-base">
            Centuries of wisdom, carefully preserved and hand-prepared for your healing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustCards.map((card, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-amber-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0 text-[#0d5c3a]">
                {card.icon}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-gray-900 text-lg mb-1">{card.title}</h3>
                <p className="font-body text-gray-500 text-sm">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
