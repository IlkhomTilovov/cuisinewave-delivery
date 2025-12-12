import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCartStore } from '@/lib/cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useDynamicTitle } from '@/hooks/useDynamicTitle';

const Cart = () => {
  useDynamicTitle('Savat');
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <Layout>
        <section className="py-16 lg:py-24">
          <div className="container text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">Savat bo'sh</h1>
            <p className="text-muted-foreground mb-8">Mazali taomlarni tanlang va savatga qo'shing</p>
            <Link to="/menu">
              <Button variant="default" size="lg">
                Menyuga o'tish
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-8 lg:py-12">
        <div className="container">
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8">Savat</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50">
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-3xl">🍽️</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                    <p className="text-primary font-bold">
                      {(item.discountPrice ?? item.price).toLocaleString()} so'm
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button variant="ghost" size="iconSm" onClick={() => removeItem(item.productId)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="iconSm" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" size="iconSm" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 bg-card rounded-2xl border border-border/50">
                <h2 className="font-semibold text-lg mb-4">Buyurtma</h2>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taomlar ({items.length})</span>
                    <span>{getTotalPrice().toLocaleString()} so'm</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Yetkazish</span>
                    <span className="text-success">Bepul</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Jami</span>
                    <span className="text-primary">{getTotalPrice().toLocaleString()} so'm</span>
                  </div>
                </div>
                <Link to="/checkout" className="block">
                  <Button variant="gold" size="lg" className="w-full">
                    Buyurtma berish
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
