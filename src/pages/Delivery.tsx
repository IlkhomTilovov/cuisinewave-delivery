import { Layout } from '@/components/layout/Layout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Truck, Clock, MapPin, CreditCard, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';

const deliveryZones = [
  { name: 'Chilanzar tumani', time: '30-40 daqiqa', price: "Bepul (50,000 so'mdan yuqori)" },
  { name: 'Yunusobod tumani', time: '35-45 daqiqa', price: "10,000 so'm" },
  { name: 'Mirzo Ulug\'bek tumani', time: '40-50 daqiqa', price: "12,000 so'm" },
  { name: 'Sergeli tumani', time: '45-55 daqiqa', price: "15,000 so'm" },
  { name: 'Yakkasaroy tumani', time: '35-45 daqiqa', price: "10,000 so'm" },
  { name: 'Shayxontohur tumani', time: '40-50 daqiqa', price: "12,000 so'm" },
];

const paymentMethods = [
  { name: 'Naqd pul', description: "Yetkazib berishda to'lash" },
  { name: 'Payme', description: "Ilovadan to'lash" },
  { name: 'Click', description: "Ilovadan to'lash" },
  { name: 'Uzum Bank', description: "Karta orqali" },
];

const Delivery = () => {
  const { getSetting } = useSiteSettings();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/5">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Yetkazib berish xizmati
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Tez va ishonchli yetkazib berish xizmati. Issiq va mazali taomlarni eshigingizgacha yetkazib beramiz.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/menu">
                  <Button variant="default" size="lg">
                    Buyurtma berish
                  </Button>
                </Link>
                <a href={`tel:${getSetting('restaurant_phone').replace(/\s/g, '')}`}>
                  <Button variant="outline" size="lg">
                    <Phone className="w-5 h-5 mr-2" />
                    Qo'ng'iroq qilish
                  </Button>
                </a>
              </div>
            </div>
            <div className="animate-fade-in stagger-1">
              <img
                src="https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&h=400&fit=crop"
                alt="Yetkazib berish"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center animate-fade-in">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">Tezkor yetkazish</h3>
                <p className="text-muted-foreground text-sm">30-60 daqiqa ichida</p>
              </CardContent>
            </Card>
            <Card className="text-center animate-fade-in stagger-1">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">Sifat kafolati</h3>
                <p className="text-muted-foreground text-sm">Issiq va yangi taomlar</p>
              </CardContent>
            </Card>
            <Card className="text-center animate-fade-in stagger-2">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">Keng qamrov</h3>
                <p className="text-muted-foreground text-sm">Butun Toshkent bo'ylab</p>
              </CardContent>
            </Card>
            <Card className="text-center animate-fade-in stagger-3">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">Qulay to'lov</h3>
                <p className="text-muted-foreground text-sm">Naqd va kartadan</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Delivery Zones */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Yetkazib berish hududlari
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Toshkent shahri bo'ylab yetkazib beramiz
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliveryZones.map((zone, index) => (
              <Card 
                key={index} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground mb-1">{zone.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        <span>{zone.time}</span>
                      </div>
                      <p className="text-sm font-medium text-primary">{zone.price}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              To'lov usullari
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sizga qulay usulda to'lang
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {paymentMethods.map((method, index) => (
              <Card 
                key={index} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Qanday ishlaydi?
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: 1, title: 'Tanlang', desc: 'Menyudan taom tanlang' },
              { step: 2, title: 'Buyurtma bering', desc: 'Savatga qo\'shing va buyurtma bering' },
              { step: 3, title: 'Tayyorlanadi', desc: 'Oshpazlarimiz tayyorlaydi' },
              { step: 4, title: 'Yetkazamiz', desc: 'Tez va xavfsiz yetkazamiz' },
            ].map((item, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
            Hoziroq buyurtma bering!
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Mazali taomlarimizni uyingizda tatib ko'ring
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/menu">
              <Button variant="secondary" size="lg">
                Menyuni ko'rish
              </Button>
            </Link>
            <a href={`tel:${getSetting('restaurant_phone').replace(/\s/g, '')}`}>
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Phone className="w-5 h-5 mr-2" />
                {getSetting('restaurant_phone')}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Delivery;
