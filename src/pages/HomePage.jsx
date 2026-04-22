import Hero from '../components/Hero';
import TrustBand from '../components/TrustBand';
import Features from '../components/Features';
import ProductForms from '../components/ProductForms';
import ShopPreview from '../components/ShopPreview';
import DoctorAuthority from '../components/DoctorAuthority';
import Testimonials from '../components/Testimonials';

import OffersBanner from '../components/OffersBanner';
import WhyChooseUs from '../components/WhyChooseUs';
import Consultation from '../components/Consultation';
import BlogPreview from '../components/BlogPreview';
import HowItWorks from '../components/HowItWorks';
import DeliveryBadge from '../components/DeliveryBadge';
import FeaturedTestimonials from '../components/FeaturedTestimonials';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="HomePage w-full"
    >
      <OffersBanner />
      <Hero />
      <TrustBand />
      <FeaturedTestimonials />
      <Features />
      <ProductForms />
      <DoctorAuthority />
      <Testimonials />
      <ShopPreview />
      <WhyChooseUs />
      <HowItWorks />
      <DeliveryBadge />
      <Consultation />
      <BlogPreview />
    </motion.div>
  );
}
