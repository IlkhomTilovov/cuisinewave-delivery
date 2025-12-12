import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDynamicTitle } from '@/hooks/useDynamicTitle';

const CategoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Dynamic title with category name
  useDynamicTitle(category?.name);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['category-products', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, name_uz, slug)')
        .eq('is_active', true)
        .eq('categories.slug', slug)
        .order('sort_order');
      if (error) throw error;
      return data?.filter(p => p.categories !== null);
    },
    enabled: !!slug,
  });

  const isLoading = categoryLoading || productsLoading;

  if (!categoryLoading && !category) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-display text-2xl mb-4">Kategoriya topilmadi</h1>
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
      {/* Hero Section */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/5">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors">Bosh sahifa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/menu" className="hover:text-primary transition-colors">Menyu</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{category?.name_uz || category?.name}</span>
          </nav>

          {categoryLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {category?.image_url && (
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src={category.image_url} 
                    alt={category.name_uz || category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="font-display text-3xl lg:text-5xl font-bold text-foreground mb-3">
                  {category?.name_uz || category?.name}
                </h1>
                {category?.meta_description && (
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    {category.meta_description}
                  </p>
                )}
                <p className="text-muted-foreground mt-4">
                  {products?.length || 0} ta mahsulot
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container">
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
              <p className="text-muted-foreground text-lg mb-4">Bu kategoriyada mahsulotlar yo'q</p>
              <Link to="/menu">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Menyuga qaytish
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CategoryDetail;
