import { HeroSlideshow } from '@/components/hero-slideshow';
import { SearchSection } from '@/components/sections/search-section';
import { GuaranteeSection } from '@/components/sections/guarantee-section';
import { FeaturedPropertiesSection } from '@/components/sections/featured-properties-section';
import { ValuesSection } from '@/components/sections/values-section';
import { FinalCtaSection } from '@/components/sections/final-cta-section';
import { SectionDivider } from '@/components/ui/section-divider';

export default function HomePage() {
  return (
    <main>
      <HeroSlideshow />
      <SearchSection />
      <GuaranteeSection />
      <FeaturedPropertiesSection />
      <div className="bg-paper">
        <SectionDivider className="py-4" />
      </div>
      <ValuesSection />
      <FinalCtaSection />
    </main>
  );
}
