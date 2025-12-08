import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function PopularDishes() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['popular-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, name_uz, slug)')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('sort_order', { ascending: true })
        .limit(8);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Mashhur Taomlar
            </h2>
            <p className="text-muted-foreground">
              Eng ko'p buyurtma qilinadigan taomlarimiz
            </p>
          </div>
          <Link to="/menu">
            <Button variant="outline" className="group">
              Hammasi
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Hozircha mashhur taomlar yo'q. Tez orada qo'shiladi!
            </p>
            <Link to="/menu" className="mt-4 inline-block">
              <Button variant="outline">Menyuni ko'rish</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
