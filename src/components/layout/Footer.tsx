import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Instagram, Send } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-xl">M</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Milliy Taomlar</h3>
                <p className="text-xs text-background/60">& Fast Food</p>
              </div>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              Eng mazali milliy taomlar va zamonaviy fast food – bir joyda! Tez yetkazib berish xizmati bilan.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Tezkor havolalar</h4>
            <ul className="space-y-2">
              {[
                { href: '/menu', label: 'Menyu' },
                { href: '/delivery', label: 'Yetkazib berish' },
                { href: '/about', label: 'Biz haqimizda' },
                { href: '/faq', label: 'Ko\'p beriladigan savollar' },
                { href: '/contact', label: 'Aloqa' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Bog'lanish</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-background/70">
                <Phone className="w-4 h-4 text-primary" />
                +998 90 123 45 67
              </li>
              <li className="flex items-center gap-3 text-sm text-background/70">
                <Mail className="w-4 h-4 text-primary" />
                info@milliy-taomlar.uz
              </li>
              <li className="flex items-start gap-3 text-sm text-background/70">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 15
              </li>
              <li className="flex items-center gap-3 text-sm text-background/70">
                <Clock className="w-4 h-4 text-primary" />
                09:00 – 23:00 (Har kuni)
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Ijtimoiy tarmoqlar</h4>
            <div className="flex gap-3">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-background/10 hover:bg-primary flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://t.me" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-background/10 hover:bg-primary flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
            <p className="mt-4 text-sm text-background/60">
              Bizni kuzating va yangiliklardan xabardor bo'ling!
            </p>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/60">
            © 2024 Milliy Taomlar. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex items-center gap-4 text-sm text-background/60">
            <Link to="/privacy" className="hover:text-background transition-colors">
              Maxfiylik siyosati
            </Link>
            <Link to="/terms" className="hover:text-background transition-colors">
              Foydalanish shartlari
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
