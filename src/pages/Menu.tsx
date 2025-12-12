import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useDynamicTitle } from '@/hooks/useDynamicTitle';

const Menu = () => {
  useDynamicTitle('Menyu');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCategory = searchParams.get('category');
  const { getSetting } = useSiteSettings();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Find selected category id from slug
  const selectedCategoryId = categories?.find(c => c.slug === selectedCategory)?.id;

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', selectedCategoryId, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name, name_uz, slug)')
        .eq('is_active', true)
        .order('sort_order');

      if (selectedCategoryId) {
        query = query.eq('category_id', selectedCategoryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (searchQuery) {
        return data.filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name_uz?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return data;
    },
    enabled: !selectedCategory || !!selectedCategoryId,
  });

  return (
    <Layout>
      <section className="pt-24 pb-8 lg:pt-32 lg:pb-12">
        <div className="container">
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-primary mb-2">
            {getSetting('menu_title') || 'Bizning Menyu'}
          </h1>
          <p className="text-foreground/70">{getSetting('menu_description') || 'Eng mazali taomlar to\'plami'}</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Taom qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={!selectedCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({})}
            >
              Hammasi
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchParams({ category: cat.slug })}
              >
                {cat.name_uz || cat.name}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Taomlar topilmadi</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Menu;
