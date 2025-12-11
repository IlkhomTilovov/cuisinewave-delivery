import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Instagram, Send, Facebook } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function Footer() {
  const { getSetting } = useSiteSettings();
  const phone = getSetting('restaurant_phone');
  const email = getSetting('restaurant_email');
  const address = getSetting('restaurant_address');
  const hours = getSetting('working_hours');
  const instagram = getSetting('instagram_url');
  const telegram = getSetting('telegram_url');
  const facebook = getSetting('facebook_url');
  const brandDescription = getSetting('footer_brand_description');
  const linksTitle = getSetting('footer_links_title');
  const contactTitle = getSetting('footer_contact_title');
  const socialTitle = getSetting('footer_social_title');
  const socialDescription = getSetting('footer_social_description');
  const copyright = getSetting('footer_copyright');

  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-primary-foreground font-display font-bold text-2xl">B</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">Bella Vista</h3>
                <p className="text-xs text-secondary">Restaurant</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {brandDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg text-foreground mb-6">{linksTitle}</h4>
            <ul className="space-y-3">
              {[
                { href: '/menu', label: 'Menyu' },
                { href: '/reservation', label: 'Stol band qilish' },
                { href: '/about', label: 'Biz haqimizda' },
                { href: '/faq', label: 'Savollar' },
                { href: '/contact', label: 'Aloqa' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-muted-foreground hover:text-secondary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg text-foreground mb-6">{contactTitle}</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
                  <Phone className="w-4 h-4 text-secondary" />
                </div>
                {phone}
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
                  <Mail className="w-4 h-4 text-secondary" />
                </div>
                {email}
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-xl glass flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-secondary" />
                </div>
                {address}
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
                  <Clock className="w-4 h-4 text-secondary" />
                </div>
                {hours}
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display font-semibold text-lg text-foreground mb-6">{socialTitle}</h4>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: instagram, label: 'Instagram' },
                { icon: Send, href: telegram, label: 'Telegram' },
                { icon: Facebook, href: facebook, label: 'Facebook' },
              ].map((social) => (
                <a 
                  key={social.label}
                  href={social.href}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl glass hover:bg-primary/20 flex items-center justify-center transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                </a>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              {socialDescription}
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {copyright}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-secondary transition-colors">
              Maxfiylik
            </Link>
            <Link to="/terms" className="hover:text-secondary transition-colors">
              Shartlar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}