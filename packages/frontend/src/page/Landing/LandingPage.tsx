import Navbar from '@/components/modules/landing/Navbar';
import Hero from '@/components/modules/landing/Hero';
import PainPoints from '@/components/modules/landing/PainPoints';
import Stats from '@/components/modules/landing/Stats';
import HowItWorks from '@/components/modules/landing/HowItWorks';
import Solution from '@/components/modules/landing/Solution';
import BentoGrid from '@/components/modules/landing/BentoGrid';
import LanguageCarousel from '@/components/modules/landing/LanguageCarousel';
import CTA from '@/components/modules/landing/CTA';
import Footer from '@/components/modules/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Navbar />
      <main>
        <Hero />
        <PainPoints />
        <Stats />
        <HowItWorks />
        <Solution />
        <BentoGrid />
        <LanguageCarousel />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
