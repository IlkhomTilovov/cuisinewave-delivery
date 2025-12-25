import { Link } from 'react-router-dom';
import { MapPin, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import heroBurgerDefault from '@/assets/hero-burger.jpg';

export function HeroSection() {
  const { getSetting } = useSiteSettings();
  const heroBackgroundSetting = getSetting('hero_background_image');
  const heroMainImageSetting = getSetting('hero_main_image');
  const heroBackground = heroBackgroundSetting && heroBackgroundSetting !== '/placeholder.svg' ? heroBackgroundSetting : heroBurgerDefault;
  const heroMainImage = heroMainImageSetting && heroMainImageSetting !== '/placeholder.svg' ? heroMainImageSetting : heroBurgerDefault;
  const heroTitle = getSetting('hero_title');
  const heroSubtitle = getSetting('hero_subtitle');
  const heroDescription = getSetting('hero_description');
  const heroBadgeText = getSetting('hero_badge_text') || 'Premium Fast Food';
  const heroDiscountPercent = getSetting('hero_discount_percent') || '-20%';
  const heroDiscountText = getSetting('hero_discount_text') || 'Birinchi buyurtma';
  const address = getSetting('restaurant_address');
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0a0a]">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url('${heroBackground}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/50" />
      </div>

      {/* Decorative Elements - Orange/Yellow Glow */}
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[120px]" />

      {/* Content */}
      <div className="container relative z-10 pt-20 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6 animate-fade-in">
              <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="text-sm font-medium text-orange-400">{heroBadgeText}</span>
            </div>

            {/* Main Title */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-up">
              <span className="text-white">{heroTitle}</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 mt-2">
                {heroSubtitle}
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-400 mb-8 max-w-lg animate-fade-in leading-relaxed">
              {heroDescription}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 animate-fade-in">
              <Link to="/menu">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-105"
                >
                  Menyuni ko'rish
                </Button>
              </Link>
              <Link to="/delivery">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 px-8 py-6 text-lg rounded-full transition-all"
                >
                  Yetkazib berish
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-8 mt-12 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{address?.split(',')[0]}</p>
                  <p className="text-gray-500 text-sm">Manzil</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">4.9 (200+ baho)</p>
                  <p className="text-gray-500 text-sm">Reyting</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Hero Image */}
          <div className="hidden lg:flex justify-center items-center relative">
            <div className="relative">
              {/* Glowing circle behind burger */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-full blur-3xl scale-110" />
              <img 
                src={heroMainImage} 
                alt="Delicious Burger" 
                className="relative z-10 w-full max-w-lg rounded-3xl shadow-2xl shadow-orange-500/10 object-cover"
              />
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-[#1a1a1a] border border-gray-800 rounded-2xl px-5 py-3 shadow-xl z-20">
                <p className="text-orange-400 font-bold text-xl">{heroDiscountPercent}</p>
                <p className="text-gray-400 text-sm">{heroDiscountText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-gray-500 text-xs uppercase tracking-widest">Pastga</span>
          <ChevronDown className="w-5 h-5 text-orange-400" />
        </div>
      </div>
    </section>
  );
}
