import { Link } from 'react-router-dom';

export default function Features() {
  return (
    <section id="concerns" className="py-20 bg-theme-bg-secondary">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-heading italic text-4xl md:text-[52px] text-theme-text-primary mb-4">
            Shop By Concern
          </h2>
          <p className="font-body text-theme-text-muted">
            Traditional protocols targeted for specific conditions.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          
          <Link to="/shop?category=diabetes" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">🩸</div>
            <h3 className="font-semibold text-gray-900">Diabetes</h3>
            <p className="text-sm text-gray-500 mt-1">Sugar control & pancreas healing</p>
          </Link>

          <Link to="/shop?category=kidney-stone" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">💧</div>
            <h3 className="font-semibold text-gray-900">Kidney Stone</h3>
            <p className="text-sm text-gray-500 mt-1">Dissolve stones naturally</p>
          </Link>

          <Link to="/shop?category=thyroid" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">⚖️</div>
            <h3 className="font-semibold text-gray-900">Thyroid</h3>
            <p className="text-sm text-gray-500 mt-1">TSH balance in 90 days</p>
          </Link>

          <Link to="/shop?category=piles" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">🌿</div>
            <h3 className="font-semibold text-gray-900">Piles & Fissure</h3>
            <p className="text-sm text-gray-500 mt-1">Relief without surgery</p>
          </Link>

          <Link to="/shop?category=gallbladder" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">🫀</div>
            <h3 className="font-semibold text-gray-900">Gallbladder Stone</h3>
            <p className="text-sm text-gray-500 mt-1">Bile duct cleanse</p>
          </Link>

          <Link to="/shop?category=cholesterol-bp" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">❤️</div>
            <h3 className="font-semibold text-gray-900">Cholesterol & BP</h3>
            <p className="text-sm text-gray-500 mt-1">Heart & pressure care</p>
          </Link>

          <Link to="/shop?category=knee-pain" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">🦴</div>
            <h3 className="font-semibold text-gray-900">Knee & Body Pain</h3>
            <p className="text-sm text-gray-500 mt-1">Joint & spine relief</p>
          </Link>

          <Link to="/shop?category=fatty-liver" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">🍃</div>
            <h3 className="font-semibold text-gray-900">Fatty Liver</h3>
            <p className="text-sm text-gray-500 mt-1">Liver detox & repair</p>
          </Link>

          <Link to="/shop?category=hair-loss" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">💆</div>
            <h3 className="font-semibold text-gray-900">Hair Loss</h3>
            <p className="text-sm text-gray-500 mt-1">Root strengthening formula</p>
          </Link>

          <Link to="/shop?category=weight-loss" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900">Weight Loss</h3>
            <p className="text-sm text-gray-500 mt-1">Metabolism reset naturally</p>
          </Link>

          <Link to="/shop?category=prostate" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">💪</div>
            <h3 className="font-semibold text-gray-900">Prostate Care</h3>
            <p className="text-sm text-gray-500 mt-1">Men's urinary & gland health</p>
          </Link>

          <Link to="/shop?category=intimate-wellness" className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
            <div className="text-3xl mb-3">🌸</div>
            <h3 className="font-semibold text-gray-900">Male-Female Disease</h3>
            <p className="text-sm text-gray-500 mt-1">Intimate wellness care</p>
          </Link>

        </div>
      </div>
    </section>
  );
}
