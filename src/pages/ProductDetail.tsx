import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/products/ProductCard';
import { useCartStore } from '@/lib/cart';
import { toast } from 'sonner';
import { ChevronRight, ArrowLeft, Minus, Plus, ShoppingCart, Clock, Flame, Scale, Truck, Shield, Star, Heart, Share2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, name_uz, slug)')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, name_uz, slug)')
        .eq('is_active', true)
        .eq('category_id', product!.category_id!)
        .neq('id', id)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name_uz || product.name,
        price: Number(product.price),
        discountPrice: product.discount_price ? Number(product.discount_price) : undefined,
        imageUrl: product.image_url,
      });
    }
    
    toast.success(`${quantity} x ${product.name_uz || product.name} savatga qo'shildi`, {
      action: {
        label: "Savatga o'tish",
        onClick: () => window.location.href = '/cart',
      },
    });
    setQuantity(1);
  };

  const discountPercent = product?.discount_price
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
    : null;

  const finalPrice = product?.discount_price || product?.price || 0;

  if (!isLoading && !product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-display text-2xl mb-4">Mahsulot topilmadi</h1>
          <Link to="/menu">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Menyuga qaytish
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Bosh sahifa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/menu" className="hover:text-primary transition-colors">Menyu</Link>
          {product?.categories && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link 
                to={`/category/${product.categories.slug}`}
                className="hover:text-primary transition-colors"
              >
                {product.categories.name_uz || product.categories.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground line-clamp-1">{product?.name_uz || product?.name}</span>
        </nav>

        {isLoading ? (
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        ) : product && (
          <>
            {/* Product Info */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Image */}
              <div className="relative group">
                <div className="aspect-square rounded-3xl overflow-hidden bg-muted shadow-2xl ring-1 ring-border/10">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name_uz || product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-gold/10">
                      <span className="text-9xl opacity-50">🍽️</span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discountPercent && (
                    <Badge className="bg-destructive text-destructive-foreground px-4 py-2 text-lg font-bold shadow-lg">
                      -{discountPercent}%
                    </Badge>
                  )}
                  {product.is_popular && (
                    <Badge className="bg-gold text-gold-foreground px-3 py-1 shadow-lg">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Mashhur
                    </Badge>
                  )}
                </div>

                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col">
                {product.categories && (
                  <Link 
                    to={`/category/${product.categories.slug}`}
                    className="text-primary text-sm uppercase tracking-wide hover:underline mb-2"
                  >
                    {product.categories.name_uz || product.categories.name}
                  </Link>
                )}

                <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {product.name_uz || product.name}
                </h1>

                {product.description && (
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                    {product.description}
                  </p>
                )}

                {/* Product Details */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {(product as any).weight && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                      <Scale className="w-4 h-4 text-primary" />
                      <span className="text-sm">{(product as any).weight}</span>
                    </div>
                  )}
                  {(product as any).prep_time && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm">{(product as any).prep_time}</span>
                    </div>
                  )}
                  {(product as any).spice_level > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                      <Flame className="w-4 h-4 text-destructive" />
                      <span className="text-sm">
                        {'🌶️'.repeat((product as any).spice_level)}
                      </span>
                    </div>
                  )}
                  {(product as any).calories && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                      <span className="text-sm">{(product as any).calories} kCal</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center gap-4 mb-8">
                  {product.discount_price ? (
                    <>
                      <span className="text-4xl font-bold text-primary">
                        {Number(product.discount_price).toLocaleString()} so'm
                      </span>
                      <span className="text-xl text-muted-foreground line-through">
                        {Number(product.price).toLocaleString()} so'm
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-foreground">
                      {Number(product.price).toLocaleString()} so'm
                    </span>
                  )}
                </div>

                {/* Ingredients */}
                {product.ingredients && (
                  <div className="mb-6 p-4 rounded-2xl bg-muted/50 border border-border">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Tarkibi
                    </h3>
                    <p className="text-muted-foreground text-sm">{product.ingredients}</p>
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex items-center border-2 border-border rounded-xl bg-background">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <span className="w-14 text-center font-bold text-lg">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>

                  <Button 
                    size="lg" 
                    className="flex-1 h-12 bg-gradient-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Savatga qo'shish - {(Number(finalPrice) * quantity).toLocaleString()} so'm
                  </Button>
                </div>

                {/* Delivery Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-gold/5 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Bepul yetkazib berish</p>
                      <p className="text-xs text-muted-foreground">50,000 so'mdan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Tez yetkazib berish</p>
                      <p className="text-xs text-muted-foreground">30-45 daqiqa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Sifat kafolati</p>
                      <p className="text-xs text-muted-foreground">100% yangi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts && relatedProducts.length > 0 && (
              <section className="mt-16 lg:mt-24">
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-8">
                  O'xshash mahsulotlar
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
