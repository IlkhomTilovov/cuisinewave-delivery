import { Layout } from '@/components/layout/Layout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useDynamicTitle } from '@/hooks/useDynamicTitle';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Percent, Clock, Gift, Sparkles } from 'lucide-react';

const Promotions = () => {
  useDynamicTitle('Aksiyalar');
  const { getSetting } = useSiteSettings();

  // Fetch products with discounts
  const { data: discountedProducts, isLoading } = useQuery({
    queryKey: ['discounted-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .not('discount_price', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const calculateDiscount = (price: number, discountPrice: number) => {
    return Math.round(((price - discountPrice) / price) * 100);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Maxsus takliflar</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {getSetting('promotions_page_title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {getSetting('promotions_page_description')}
            </p>
          </div>
        </div>
      </section>

      {/* Promotions Grid */}
      <section className="py-16 lg:py-24">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : discountedProducts && discountedProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {discountedProducts.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden group animate-fade-in hover-scale"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-destructive text-destructive-foreground text-lg px-3 py-1">
                        -{calculateDiscount(product.price, product.discount_price!)}%
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-1">
                      {product.categories?.name}
                    </p>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(product.discount_price!)}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <Link to={`/menu/${product.id}`}>
                      <Button variant="default" className="w-full">
                        Batafsil ko'rish
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Percent className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                {getSetting('promotions_empty_title')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {getSetting('promotions_empty_description')}
              </p>
              <Link to="/menu">
                <Button variant="default" size="lg">
                  Menyuni ko'rish
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              {getSetting('promotions_benefits_title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center animate-fade-in">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Percent className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Doimiy chegirmalar</h3>
                <p className="text-muted-foreground">Har hafta yangi aktsiyalar va maxsus takliflar</p>
              </CardContent>
            </Card>
            <Card className="text-center animate-fade-in stagger-1">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Bonus dasturi</h3>
                <p className="text-muted-foreground">Har bir buyurtmadan bonuslar to'plang</p>
              </CardContent>
            </Card>
            <Card className="text-center animate-fade-in stagger-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Tezkor xizmat</h3>
                <p className="text-muted-foreground">30 daqiqa ichida yetkazib beramiz</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Promotions;
