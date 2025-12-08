import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { PopularDishes } from '@/components/home/PopularDishes';
import { PromoSection } from '@/components/home/PromoSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoriesSection />
      <PopularDishes />
      <PromoSection />
    </Layout>
  );
};

export default Index;
