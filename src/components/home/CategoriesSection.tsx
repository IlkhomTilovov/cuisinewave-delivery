import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

const categoryIcons: Record<string, string> = {
  'fast-food': '🍔',
  'milliy-taomlar': '🍲',
  'desertlar': '🍰',
  'ichimliklar': '🥤',
  'salatlar': '🥗',
  'sho\'rvalar': '🍜',
};

export function CategoriesSection() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Kategoriyalar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tanlang va zavqlaning – milliy taomlardan fast foodgacha
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/menu?category=${category.slug}`}
                className="category-card group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">
                  {categoryIcons[category.slug] || '🍽️'}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                  {category.name_uz || category.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  Ko'rish
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { name: 'Fast Food', slug: 'fast-food', icon: '🍔' },
              { name: 'Milliy Taomlar', slug: 'milliy-taomlar', icon: '🍲' },
              { name: 'Desertlar', slug: 'desertlar', icon: '🍰' },
              { name: 'Ichimliklar', slug: 'ichimliklar', icon: '🥤' },
            ].map((category, index) => (
              <Link
                key={category.slug}
                to={`/menu?category=${category.slug}`}
                className="category-card group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  Ko'rish
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
