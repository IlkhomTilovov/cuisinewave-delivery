import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// Demo kategoriyalar - ma'lumotlar bazasida bo'lmasa ko'rsatiladi
const demoCategories = [
  {
    id: 'fast-food',
    name: 'Fast Food',
    name_uz: 'Fast Food',
    description: 'Tez va mazali taomlar',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop',
    slug: 'fast-food',
  },
  {
    id: 'milliy-taomlar',
    name: 'Milliy Taomlar',
    name_uz: 'Milliy Taomlar',
    description: 'An\'anaviy lazzatlar',
    image_url: 'https://images.unsplash.com/photo-1547424850-82a4454f3ccd?q=80&w=1200&auto=format&fit=crop',
    slug: 'milliy-taomlar',
  },
];

export function CategoriesSection() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['home-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
  });

  const displayCategories = categories && categories.length > 0 ? categories : demoCategories;

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-in title-underline">
            Kategoriyalar
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mt-6 animate-fade-in stagger-1">
            Tanlang va zavqlaning – milliy taomlardan fast foodgacha
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-[400px] lg:h-[500px] rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className={`grid gap-8 lg:gap-12 max-w-5xl mx-auto ${displayCategories.length === 1 ? 'md:grid-cols-1 max-w-2xl' : displayCategories.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
            {displayCategories.map((category: any, index: number) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden category-card animate-fade-in hover-zoom"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Image */}
                <img
                  src={category.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop'}
                  alt={category.name_uz || category.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-10">
                  <h3 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors duration-300">
                    {category.name_uz || category.name}
                  </h3>
                  <p className="text-foreground/70 mb-4">
                    {category.meta_description || 'Mazali taomlar to\'plami'}
                  </p>
                  <div className="flex items-center gap-2 text-secondary font-medium">
                    <span>Ko'rish</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-6 right-6 w-16 h-16 border border-secondary/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ArrowRight className="w-6 h-6 text-secondary -rotate-45" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}