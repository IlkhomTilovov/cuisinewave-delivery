import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { PopularDishes } from '@/components/home/PopularDishes';
import { AboutSection } from '@/components/home/AboutSection';
import { ReservationBanner } from '@/components/home/ReservationBanner';
import { useDynamicTitle } from '@/hooks/useDynamicTitle';

const Index = () => {
  useDynamicTitle(); // Home page uses just site name
  return (
    <Layout>
      <HeroSection />
      <CategoriesSection />
      <PopularDishes />
      <AboutSection />
      <ReservationBanner />
    </Layout>
  );
};

export default Index;