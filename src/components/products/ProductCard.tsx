import { Link } from 'react-router-dom';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  name_uz?: string;
  description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  ingredients?: string;
  categories?: {
    name: string;
    name_uz?: string;
    slug: string;
  } | null;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      productId: product.id,
      name: product.name_uz || product.name,
      price: Number(product.price),
      discountPrice: product.discount_price ? Number(product.discount_price) : undefined,
      imageUrl: product.image_url,
    });
    
    toast.success(`${product.name_uz || product.name} savatga qo'shildi`, {
      action: {
        label: "Savatga o'tish",
        onClick: () => window.location.href = '/cart',
      },
    });
  };

  const discountPercent = product.discount_price
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
    : null;

  return (
    <Link
      to={`/menu/${product.id}`}
      className="food-card group animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_uz || product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <span className="text-6xl opacity-50">
              {product.categories?.slug === 'fast-food' ? '🍔' : 
               product.categories?.slug === 'desertlar' ? '🍰' :
               product.categories?.slug === 'ichimliklar' ? '🥤' : '🍽️'}
            </span>
          </div>
        )}
        
        {/* Discount Badge */}
        {discountPercent && (
          <div className="discount-badge">
            -{discountPercent}%
          </div>
        )}
        
        {/* Quick Add Button */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="cart"
            size="icon"
            onClick={handleAddToCart}
            className="shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {product.categories && (
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {product.categories.name_uz || product.categories.name}
          </span>
        )}
        
        <h3 className="font-semibold text-foreground mt-1 mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {product.name_uz || product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.discount_price ? (
              <>
                <span className="text-lg font-bold text-primary">
                  {Number(product.discount_price).toLocaleString()} so'm
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {Number(product.price).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-foreground">
                {Number(product.price).toLocaleString()} so'm
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="iconSm"
            onClick={handleAddToCart}
            className="text-primary hover:text-primary-foreground hover:bg-primary lg:hidden"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
