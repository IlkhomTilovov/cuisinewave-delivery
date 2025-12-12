import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const navLinks = [
  { href: '/menu', label: 'Menyu' },
  { href: '/promotions', label: 'Aktsiyalar' },
  { href: '/delivery', label: 'Yetkazib berish' },
  { href: '/about', label: 'Biz haqimizda' },
  { href: '/contact', label: 'Aloqa' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState<'uz' | 'ru'>('uz');
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAdmin } = useAuth();
  const { getSetting } = useSiteSettings();

  const siteLogo = getSetting('site_logo');
  const siteName = getSetting('site_name') || 'Bella Vista';
  const siteTagline = getSetting('site_tagline') || 'Restaurant';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            {siteLogo ? (
              <img 
                src={siteLogo} 
                alt={siteName}
                className="w-12 h-12 rounded-2xl object-cover shadow-glow group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <span className="text-primary-foreground font-display font-bold text-2xl">{siteName.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-xl text-foreground leading-tight tracking-wide">
                {siteName}
              </h1>
              <p className="text-xs text-secondary">{siteTagline}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                  location.pathname === link.href
                    ? "text-secondary"
                    : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="glass" size="icon">
                <ShoppingCart className="w-5 h-5" />
              </Button>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Admin Link */}
            {isAdmin && (
              <Link to="/admin" className="hidden md:block">
                <Button variant="outline" size="icon" className="border-secondary/50 text-secondary hover:bg-secondary/10">
                  <Shield className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="glass"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-base font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/20 text-secondary"
                      : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}