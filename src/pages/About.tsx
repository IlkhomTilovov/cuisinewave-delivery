import { Layout } from '@/components/layout/Layout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Phone, Mail, MapPin, Clock, Instagram, Send, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  const { getSetting } = useSiteSettings();

  const contactItems = [
    { icon: Phone, label: 'Telefon', value: getSetting('restaurant_phone'), href: `tel:${getSetting('restaurant_phone').replace(/\s/g, '')}` },
    { icon: Mail, label: 'Email', value: getSetting('restaurant_email'), href: `mailto:${getSetting('restaurant_email')}` },
    { icon: MapPin, label: 'Manzil', value: getSetting('restaurant_address'), href: null },
    { icon: Clock, label: 'Ish vaqti', value: getSetting('working_hours'), href: null },
  ];

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', url: getSetting('instagram_url') },
    { icon: Send, label: 'Telegram', url: getSetting('telegram_url') },
    { icon: Facebook, label: 'Facebook', url: getSetting('facebook_url') },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-in">
            {getSetting('about_page_title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl animate-fade-in stagger-1">
            {getSetting('about_page_description')}
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                {getSetting('about_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {getSetting('about_text_1')}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {getSetting('about_text_2')}
              </p>
            </div>
            <div className="animate-fade-in stagger-1">
              <div className="relative">
                <img
                  src={getSetting('about_section_image')}
                  alt="Bella Vista Restaurant"
                  className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {getSetting('contact_title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {getSetting('contact_description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactItems.map((item, index) => (
              <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.label}</h3>
                  {item.href ? (
                    <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{item.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-4 animate-fade-in stagger-2">
            {socialLinks.filter(s => s.url).map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
