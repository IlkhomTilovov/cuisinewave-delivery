import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Award, Users, Clock } from 'lucide-react';

const stats = [
  { icon: Award, value: '15+', label: 'Yillik tajriba' },
  { icon: Users, value: '50k+', label: 'Xursand mijozlar' },
  { icon: Clock, value: '24/7', label: 'Xizmat ko\'rsatish' },
];

export function AboutSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="animate-fade-in">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-6 title-underline">
              Biz haqimizda
            </h2>
            
            <div className="space-y-6 mt-8">
              <p className="text-foreground/70 leading-relaxed text-lg">
                Bella Vista – bu nafaqat restoran, balki mazali taomlar va iliq muhit uyg'unligi. 
                Biz 15 yildan ortiq vaqt davomida mijozlarimizga eng yaxshi xizmat ko'rsatib kelmoqdamiz.
              </p>
              
              <p className="text-foreground/70 leading-relaxed">
                Bizning oshxonamizda faqat yangi va sifatli mahsulotlar ishlatiladi. 
                Har bir taom sevgi va professional mahorat bilan tayyorlanadi.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center p-4 rounded-2xl glass animate-fade-in"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <stat.icon className="w-6 h-6 text-secondary mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <Link to="/about" className="inline-block mt-10">
              <Button variant="outline" size="lg" className="group">
                Ko'proq bilish
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Image */}
          <div className="relative animate-fade-in stagger-2">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop"
                alt="Restaurant interior"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 border-2 border-secondary/30 rounded-3xl -z-10" />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-primary/10 rounded-3xl blur-xl -z-10" />
            
            {/* Floating card */}
            <div className="absolute -bottom-8 -left-8 lg:left-8 glass rounded-2xl p-6 animate-float">
              <div className="font-display text-3xl font-bold text-secondary">4.9</div>
              <div className="text-sm text-foreground/70">Reyting</div>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-secondary" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}