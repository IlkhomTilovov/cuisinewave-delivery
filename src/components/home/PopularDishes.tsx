import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { toast } from 'sonner';

export function PopularDishes() {
  const addItem = useCartStore((state) => state.addItem);

  const { data: products, isLoading } = useQuery({
    queryKey: ['popular-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, name_uz, slug)')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('sort_order', { ascending: true })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name_uz || product.name,
      price: product.price,
      discountPrice: product.discount_price,
      imageUrl: product.image_url || product.image,
    });
    toast.success(`${product.name_uz || product.name} savatga qo'shildi`);
  };

  // Demo products for display when no data
  const demoProducts = [
    { id: '1', name: 'Osh', price: 35000, image: 'https://images.unsplash.com/photo-1547424850-82a4454f3ccd?q=80&w=600' },
    { id: '2', name: 'Burger Classic', price: 28000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600' },
    { id: '3', name: 'Somsa', price: 12000, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600' },
    { id: '4', name: 'Pizza Margarita', price: 65000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600' },
    { id: '5', name: 'Shashlik', price: 45000, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600' },
    { id: '6', name: 'Lag\'mon', price: 32000, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=600' },
  ];

  const displayProducts = products && products.length > 0 ? products : demoProducts;

  return (
    <section className="py-24 lg:py-32 bg-card/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-16">
          <div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 title-underline">
              Mashhur Taomlar
            </h2>
            <p className="text-muted-foreground mt-6">
              Eng ko'p buyurtma qilinadigan taomlarimiz
            </p>
          </div>
          <Link to="/menu">
            <Button variant="outline" size="lg" className="group">
              Hammasi
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] rounded-3xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProducts.map((product: any, index: number) => (
              <div
                key={product.id}
                className="food-card group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden hover-zoom">
                  <img
                    src={product.image_url || product.image}
                    alt={product.name_uz || product.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Discount badge */}
                  {product.discount_price && (
                    <div className="discount-badge">
                      -{Math.round((1 - product.discount_price / product.price) * 100)}%
                    </div>
                  )}
                </div>

                {/* Content with blur panel */}
                <div className="p-6 relative">
                  <div className="absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-card to-transparent" />
                  
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-secondary transition-colors">
                    {product.name_uz || product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-secondary">
                        {((product.discount_price || product.price) / 1000).toFixed(0)}k
                      </span>
                      <span className="text-sm text-muted-foreground">so'm</span>
                      {product.discount_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {(product.price / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                    
                    <Button
                      variant="hero"
                      size="icon"
                      onClick={() => handleAddToCart(product)}
                      className="rounded-xl"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}