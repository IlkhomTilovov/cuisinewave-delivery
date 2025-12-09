import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function HeroSection() {
  const { getSetting } = useSiteSettings();
  const heroImage = getSetting('hero_background_image');
  const heroTitle = getSetting('hero_title');
  const heroSubtitle = getSetting('hero_subtitle');
  const heroDescription = getSetting('hero_description');
  const address = getSetting('restaurant_address');

  return (
    <section className="dark relative min-h-screen flex items-center justify-center overflow-hidden bg-[hsl(350,30%,4%)]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${heroImage}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(340,100%,27%,0.9)] via-[hsl(340,100%,20%,0.95)] to-[hsl(350,30%,4%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(350,30%,4%)] via-transparent to-transparent" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="container relative z-10 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-secondary fill-secondary" />
            <span className="text-sm font-medium text-secondary">Premium Dining Experience</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight mb-6 animate-slide-up tracking-wide">
            {heroTitle}
            <span className="block text-secondary mt-2">{heroSubtitle}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-white/70 mb-10 max-w-2xl mx-auto animate-fade-in stagger-2 leading-relaxed">
            {heroDescription}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-3">
            <Link to="/reservation">
              <Button variant="hero" size="xl" className="min-w-[200px]">
                Stol band qilish
              </Button>
            </Link>
            <Link to="/menu">
              <Button variant="outline" size="xl" className="min-w-[200px] border-secondary/50 text-secondary hover:bg-secondary/10">
                Menyuni ko'rish
              </Button>
            </Link>
          </div>

          {/* Location & Rating */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-in stagger-4">
            <div className="flex items-center gap-2 text-white/60">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-sm font-medium">{address.split(',')[0]}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-secondary fill-secondary" />
              </div>
              <span className="text-sm font-medium">4.9 (200+ baho)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-secondary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}