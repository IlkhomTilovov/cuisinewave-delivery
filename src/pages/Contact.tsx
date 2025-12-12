import { Layout } from '@/components/layout/Layout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useDynamicTitle } from '@/hooks/useDynamicTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock, Instagram, Send, Facebook, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Contact = () => {
  useDynamicTitle('Aloqa');
  const { getSetting } = useSiteSettings();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Xabaringiz yuborildi! Tez orada bog'lanamiz.");
    setFormData({ name: '', phone: '', email: '', message: '' });
    setIsSubmitting(false);
  };

  const contactInfo = [
    { 
      icon: Phone, 
      label: 'Telefon', 
      value: getSetting('restaurant_phone'),
      href: `tel:${getSetting('restaurant_phone').replace(/\s/g, '')}`,
      color: 'bg-primary/10 text-primary'
    },
    { 
      icon: Mail, 
      label: 'Email', 
      value: getSetting('restaurant_email'),
      href: `mailto:${getSetting('restaurant_email')}`,
      color: 'bg-secondary/10 text-secondary'
    },
    { 
      icon: MapPin, 
      label: 'Manzil', 
      value: getSetting('restaurant_address'),
      href: null,
      color: 'bg-primary/10 text-primary'
    },
    { 
      icon: Clock, 
      label: 'Ish vaqti', 
      value: getSetting('working_hours'),
      href: null,
      color: 'bg-secondary/10 text-secondary'
    },
  ];

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', url: getSetting('instagram_url'), color: 'hover:bg-pink-500' },
    { icon: Send, label: 'Telegram', url: getSetting('telegram_url'), color: 'hover:bg-blue-500' },
    { icon: Facebook, label: 'Facebook', url: getSetting('facebook_url'), color: 'hover:bg-blue-600' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/5">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {getSetting('contact_title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {getSetting('contact_description')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((item, index) => (
              <Card 
                key={index} 
                className="animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.label}</h3>
                  {item.href ? (
                    <a 
                      href={item.href} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{item.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form & Map */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="animate-fade-in">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">Xabar yuboring</h2>
                    <p className="text-muted-foreground text-sm">Biz sizga javob beramiz</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="name">Ismingiz</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ismingizni kiriting"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon raqamingiz</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (ixtiyoriy)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Xabaringiz</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Xabaringizni yozing..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map */}
            <div className="animate-fade-in stagger-1">
              <Card className="overflow-hidden h-full">
                <div className="h-full min-h-[400px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.0234567890123!2d69.2401!3d41.3111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDE4JzQwLjAiTiA2OcKwMTQnMjQuNCJF!5e0!3m2!1sen!2s!4v1234567890123"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '400px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Ijtimoiy tarmoqlarda kuzatib boring
            </h2>
            <p className="text-muted-foreground">
              Yangiliklar va maxsus takliflardan xabardor bo'ling
            </p>
          </div>

          <div className="flex justify-center gap-6">
            {socialLinks.filter(s => s.url).map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground ${social.color} hover:text-white transition-all duration-300 animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <social.icon className="w-7 h-7" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
