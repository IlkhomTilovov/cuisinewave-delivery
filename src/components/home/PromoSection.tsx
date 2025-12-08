import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PromoSection() {
  const { data: promoProducts, isLoading } = useQuery({
    queryKey: ['promo-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .not('discount_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  const calculateDiscount = (price: number, discountPrice: number) => {
    return Math.round((1 - discountPrice / price) * 100);
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Percent className="w-4 h-4" />
            Maxsus takliflar
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Aksiya va Chegirmalar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Eng yaxshi narxlarda mazali taomlardan bahramand bo'ling
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : promoProducts && promoProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {promoProducts.map((product, index) => (
              <Link
                key={product.id}
                to={`/menu/${product.id}`}
                className="group relative overflow-hidden rounded-2xl bg-card p-6 border border-border/50 card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                  -{calculateDiscount(Number(product.price), Number(product.discount_price))}%
                </div>
                
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                  <span className="text-4xl">
                    {product.categories?.slug === 'fast-food' ? '🍔' : '🍽️'}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                  {product.name_uz || product.name}
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-primary">
                    {Number(product.discount_price).toLocaleString()} so'm
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {Number(product.price).toLocaleString()} so'm
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                  Buyurtma berish
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-8 lg:p-12 text-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-32 h-32 bg-secondary rounded-full blur-2xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary-glow rounded-full blur-2xl" />
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-background/20 flex items-center justify-center">
                  <Percent className="w-8 h-8 text-primary-foreground" />
                </div>
                
                <h3 className="font-display text-2xl lg:text-3xl font-bold text-primary-foreground mb-4">
                  Tez orada aksiyalar!
                </h3>
                <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
                  Bizni kuzating va eng yaxshi chegirmalardan birinchilar qatorida xabardor bo'ling.
                </p>
                
                <Link to="/menu">
                  <Button variant="gold" size="lg" className="group">
                    Menyuni ko'rish
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
