export default function ProductForms() {
  return (
    <section className="py-20 bg-theme-bg-secondary border-t border-theme border-b">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <h2 className="font-heading italic text-[36px] text-theme-text-primary text-center mb-12">
          Our Formulations Come In
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border-2 border-emerald-600 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="text-4xl text-emerald-600 mb-6">💊</div>
            <h3 className="font-heading font-semibold text-[22px] text-theme-text-primary mb-2">
              Capsules
            </h3>
            <p className="font-body text-[14px] text-theme-text-muted">
              Precise dosage, easy daily use
            </p>
          </div>

          <div className="bg-white border-2 border-emerald-600 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="text-4xl text-emerald-600 mb-6">🫙</div>
            <h3 className="font-heading font-semibold text-[22px] text-theme-text-primary mb-2">
              Churna (Powder)
            </h3>
            <p className="font-body text-[14px] text-theme-text-muted">
              Traditional form, maximum potency
            </p>
          </div>

          <div className="bg-white border-2 border-emerald-600 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="text-4xl text-emerald-600 mb-6">🍯</div>
            <h3 className="font-heading font-semibold text-[22px] text-theme-text-primary mb-2">
              Halwa
            </h3>
            <p className="font-body text-[14px] text-theme-text-muted">
              Ancient preparation, rich & nourishing
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
