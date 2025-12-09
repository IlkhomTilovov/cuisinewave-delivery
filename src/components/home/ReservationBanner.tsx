import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, Calendar } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function ReservationBanner() {
  const { getSetting } = useSiteSettings();
  const bannerImage = getSetting('reservation_banner_image');
  const phone = getSetting('restaurant_phone');
  const reservationTitle = getSetting('reservation_title');
  const reservationDescription = getSetting('reservation_description');

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${bannerImage}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in">
            {reservationTitle || 'Bugun mazali taomlarimizni'}{' '}
            <span className="text-secondary">tatib ko'ring!</span>
          </h2>
          
          <p className="text-lg text-foreground/70 mb-10 animate-fade-in stagger-1">
            {reservationDescription || "Oilaviy yig'inlar, do'stlar bilan uchrashuvlar yoki ish uchrashuvlari uchun ideal joy. Stolni hoziroq band qiling!"}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in stagger-2">
            <Link to="/reservation">
              <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                <Calendar className="w-5 h-5" />
                Stol band qilish
              </Button>
            </Link>
            <a href={`tel:${phone.replace(/\s/g, '')}`}>
              <Button variant="outline" size="xl" className="w-full sm:w-auto group">
                <Phone className="w-5 h-5" />
                {phone}
              </Button>
            </a>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-6 mt-12 animate-fade-in stagger-3">
            {['Qulay joy', 'Premium xizmat', 'Mazali taomlar'].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-sm text-foreground/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 right-0 w-1/3 h-2/3 bg-gradient-to-tl from-primary/20 to-transparent blur-3xl" />
    </section>
  );
}