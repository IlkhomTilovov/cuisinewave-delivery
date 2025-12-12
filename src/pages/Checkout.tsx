import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCartStore } from '@/lib/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useDynamicTitle } from '@/hooks/useDynamicTitle';

// Validation schema
const checkoutSchema = z.object({
  user_fullname: z.string()
    .min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(100, 'Ism 100 ta belgidan oshmasligi kerak'),
  phone: z.string()
    .regex(/^\+998[0-9]{9}$/, 'Telefon raqam formati: +998XXXXXXXXX'),
  address: z.string()
    .min(10, 'Manzil kamida 10 ta belgidan iborat bo\'lishi kerak')
    .max(500, 'Manzil 500 ta belgidan oshmasligi kerak'),
  delivery_zone: z.string().optional(),
  payment_type: z.enum(['cash', 'card', 'payme', 'click']),
  notes: z.string().max(500, 'Izoh 500 ta belgidan oshmasligi kerak').optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  useDynamicTitle('Buyurtma');
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CheckoutForm>({
    user_fullname: '',
    phone: '+998',
    address: '',
    delivery_zone: '',
    payment_type: 'cash',
    notes: '',
  });

  const handleChange = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Allow only digits after +998
    let phone = value;
    if (!phone.startsWith('+998')) {
      phone = '+998' + phone.replace(/\D/g, '').slice(0, 9);
    } else {
      const digits = phone.slice(4).replace(/\D/g, '').slice(0, 9);
      phone = '+998' + digits;
    }
    handleChange('phone', phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring');
      return;
    }

    if (items.length === 0) {
      toast.error('Savat bo\'sh');
      navigate('/cart');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const orderData = {
        ...form,
        items: items.map(item => ({
          product_id: item.productId,
          product_name: item.name,
          price: item.discountPrice ?? item.price,
          quantity: item.quantity,
        })),
      };

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData,
      });

      if (error) {
        console.error('Order error:', error);
        toast.error('Buyurtma yaratishda xatolik');
        return;
      }

      if (!data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: string) => toast.error(err));
        } else {
          toast.error(data.error || 'Xatolik yuz berdi');
        }
        return;
      }

      // Success
      setIsSuccess(true);
      setOrderId(data.order_id);
      clearCart();
      toast.success('Buyurtmangiz qabul qilindi!');
      
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    navigate('/cart');
    return null;
  }

  if (isSuccess) {
    return (
      <Layout>
        <section className="py-16 lg:py-24">
          <div className="container max-w-lg text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Buyurtma qabul qilindi!
            </h1>
            <p className="text-muted-foreground mb-2">
              Buyurtma raqami: <span className="font-mono font-bold text-foreground">{orderId?.slice(0, 8)}</span>
            </p>
            <p className="text-muted-foreground mb-8">
              Tez orada operatorimiz siz bilan bog'lanadi
            </p>
            <Button variant="default" onClick={() => navigate('/')}>
              Bosh sahifaga qaytish
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-8 lg:py-12">
        <div className="container max-w-2xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/cart')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Savatga qaytish
          </Button>

          <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8">
            Buyurtmani rasmiylashtirish
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Info */}
            <div className="p-6 bg-card rounded-2xl border border-border/50 space-y-4">
              <h2 className="font-semibold text-lg">Aloqa ma'lumotlari</h2>
              
              <div className="space-y-2">
                <Label htmlFor="user_fullname">Ism familiya *</Label>
                <Input
                  id="user_fullname"
                  value={form.user_fullname}
                  onChange={(e) => handleChange('user_fullname', e.target.value)}
                  placeholder="Ismingizni kiriting"
                  className={errors.user_fullname ? 'border-destructive' : ''}
                />
                {errors.user_fullname && (
                  <p className="text-sm text-destructive">{errors.user_fullname}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon raqam *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+998901234567"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="p-6 bg-card rounded-2xl border border-border/50 space-y-4">
              <h2 className="font-semibold text-lg">Yetkazib berish</h2>
              
              <div className="space-y-2">
                <Label htmlFor="address">Manzil *</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="To'liq manzilingizni kiriting (ko'cha, uy, xonadon)"
                  className={errors.address ? 'border-destructive' : ''}
                  rows={3}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_zone">Hudud (ixtiyoriy)</Label>
                <Input
                  id="delivery_zone"
                  value={form.delivery_zone}
                  onChange={(e) => handleChange('delivery_zone', e.target.value)}
                  placeholder="Masalan: Chilonzor tumani"
                />
              </div>
            </div>


            {/* Notes */}
            <div className="p-6 bg-card rounded-2xl border border-border/50 space-y-4">
              <h2 className="font-semibold text-lg">Qo'shimcha izoh</h2>
              <Textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Izoh qoldiring (ixtiyoriy)"
                rows={2}
              />
            </div>

            {/* Order Summary */}
            <div className="p-6 bg-card rounded-2xl border border-border/50">
              <h2 className="font-semibold text-lg mb-4">Buyurtma</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      {((item.discountPrice ?? item.price) * item.quantity).toLocaleString()} so'm
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Jami</span>
                <span className="text-primary">{getTotalPrice().toLocaleString()} so'm</span>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="gold" 
              size="lg" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yuborilmoqda...
                </>
              ) : (
                'Buyurtma berish'
              )}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
