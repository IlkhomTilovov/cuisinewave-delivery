import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero min-h-[600px] lg:min-h-[700px] flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-glow rounded-full blur-3xl" />
      </div>
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-sm text-primary-foreground/90 text-sm mb-6 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Tez yetkazib berish xizmati
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-slide-up">
              Mazali Taomlar
              <span className="block text-secondary">Bir Klik Bilan</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-primary-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in stagger-2">
              Milliy taomlar va fast food – eng yaxshi mazalar, tez yetkazib berish xizmati bilan uyingizga yetkaziladi.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-in stagger-3">
              <Link to="/menu">
                <Button variant="gold" size="xl" className="group">
                  Menyuni ko'rish
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/delivery">
                <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Yetkazib berish
                </Button>
              </Link>
            </div>
            
            {/* Features */}
            <div className="flex flex-wrap items-center gap-6 mt-10 justify-center lg:justify-start animate-fade-in stagger-4">
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <div className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm">30 daqiqada yetkazamiz</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <div className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-sm">Bepul yetkazish</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image Placeholder */}
          <div className="hidden lg:block relative animate-float">
            <div className="relative w-full max-w-md mx-auto aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-primary-glow/30 rounded-full blur-2xl" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-secondary/20 to-transparent backdrop-blur-sm flex items-center justify-center border border-background/10">
                <div className="text-center text-primary-foreground/60">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-background/10 flex items-center justify-center">
                    <span className="font-display text-5xl">🍽️</span>
                  </div>
                  <p className="text-sm">Premium taomlar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
