import { Layout } from '@/components/layout/Layout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Phone, Mail, MapPin, Clock, Instagram, Send, Facebook, Award, Users, Utensils, Star, ChefHat, Quote, Play, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useState } from 'react';

// Team data
const teamMembers = [
  {
    name: 'Akbar Karimov',
    position: 'Bosh oshpaz',
    image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
    experience: '15 yil tajriba',
  },
  {
    name: 'Dilnoza Rahimova',
    position: 'Sous-chef',
    image: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400&h=400&fit=crop',
    experience: '10 yil tajriba',
  },
  {
    name: 'Jasur Toshmatov',
    position: 'Konditer ustasi',
    image: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&h=400&fit=crop',
    experience: '8 yil tajriba',
  },
  {
    name: 'Malika Saidova',
    position: 'Restoran menejeri',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    experience: '12 yil tajriba',
  },
];

// Timeline data
const timelineEvents = [
  { year: '2008', title: 'Asos solingan', description: "Bella Vista restoran Toshkent shahrida o'z eshiklarini ochdi" },
  { year: '2012', title: "Birinchi mukofot", description: "O'zbekistonning eng yaxshi restoranlari tanlovi g'olibi" },
  { year: '2015', title: 'Kengayish', description: "Yangi filial ochildi va menyu kengaytirildi" },
  { year: '2018', title: "Xalqaro tan olinish", description: "Markaziy Osiyo restoranlar reytingiga kiritildi" },
  { year: '2023', title: '15 yillik yubiley', description: "50,000 dan ortiq mamnun mijozlarga xizmat ko'rsatdik" },
];

// Statistics data
const statistics = [
  { icon: Clock, value: '15+', label: 'Yillik tajriba' },
  { icon: Users, value: '50,000+', label: 'Mamnun mijozlar' },
  { icon: Utensils, value: '120+', label: 'Taomlar' },
  { icon: Award, value: '25+', label: 'Mukofotlar' },
];

// Awards data
const awards = [
  { year: '2023', title: "Yilning eng yaxshi restorani", organization: "O'zbekiston Restoratorlar Assotsiatsiyasi" },
  { year: '2022', title: "Eng yaxshi xizmat ko'rsatish", organization: "Hospitality Awards" },
  { year: '2021', title: "Milliy taomlar ustasi", organization: "Gastronomiya festivali" },
  { year: '2020', title: "Mijozlar tanlovi", organization: "TripAdvisor" },
];

// Testimonials data
const testimonials = [
  {
    name: 'Sardor Alimov',
    text: "Ajoyib joy! Taomlar mazali, xizmat a'lo darajada. Oilamiz bilan har doim shu yerga kelamiz.",
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    name: 'Nilufar Qodirova',
    text: "Eng yaxshi plov va lag'mon shu yerda! Atmosfera ham juda yoqimli.",
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    name: 'Bobur Rahmonov',
    text: "Biznes uchrashuvlar uchun ideal joy. Professional xizmat va sifatli taomlar.",
    rating: 5,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
];

// Gallery images
const galleryImages = [
  { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop', alt: 'Restoran ichki ko\'rinishi' },
  { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', alt: 'Taomlar' },
  { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop', alt: 'Maxsus xona' },
  { url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop', alt: 'Oshxona' },
  { url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&h=400&fit=crop', alt: 'Tashqi maydon' },
  { url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&h=400&fit=crop', alt: 'VIP xona' },
];

// FAQ data
const faqItems = [
  { question: 'Ish vaqtingiz qanday?', answer: "Biz har kuni soat 10:00 dan 23:00 gacha ishlaymiz. Dam olish kunlari ham ochiqmiz." },
  { question: "Stol band qilish kerakmi?", answer: "Ha, ayniqsa hafta oxiri va bayram kunlarida oldindan stol band qilishni tavsiya etamiz. Telefon yoki saytimiz orqali band qilishingiz mumkin." },
  { question: "Yetkazib berish xizmati bormi?", answer: "Ha, shahar bo'ylab yetkazib berish xizmatimiz mavjud. Minimal buyurtma summasi 50,000 so'm." },
  { question: "Vegetarian taomlar bormi?", answer: "Ha, menyumizda vegetarianlar uchun maxsus taomlar bo'limi mavjud." },
  { question: "To'lov usullari qanday?", answer: "Naqd pul, bank kartalari (Uzcard, Humo, Visa, Mastercard) va Click, Payme orqali to'lash mumkin." },
];

const About = () => {
  const { getSetting } = useSiteSettings();
  const [activeImage, setActiveImage] = useState<string | null>(null);

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

      {/* Statistics Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="font-display text-4xl lg:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Bizning jamoa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional va tajribali jamoamiz sizga eng yaxshi xizmatni taqdim etadi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card 
                key={index} 
                className="overflow-hidden group animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto -mt-12 mb-4 relative z-10 border-4 border-background">
                    <ChefHat className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-2">{member.position}</p>
                  <p className="text-sm text-muted-foreground">{member.experience}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Bizning tarix
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              2008-yildan buyon sizga xizmat qilmoqdamiz
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-0.5 bg-primary/30 transform lg:-translate-x-1/2" />
              
              {timelineEvents.map((event, index) => (
                <div 
                  key={index}
                  className={`relative flex items-center mb-8 animate-fade-in ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-8 lg:left-1/2 w-4 h-4 rounded-full bg-primary transform -translate-x-1/2 z-10" />
                  
                  {/* Content */}
                  <div className={`ml-16 lg:ml-0 lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-12 lg:text-right' : 'lg:pl-12'}`}>
                    <Card className="inline-block">
                      <CardContent className="p-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm mb-3">
                          {event.year}
                        </span>
                        <h3 className="font-display text-xl font-bold text-foreground mb-2">{event.title}</h3>
                        <p className="text-muted-foreground">{event.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Mukofotlar va yutuqlar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bizning mehnatimiz tan olingan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {awards.map((award, index) => (
              <Card 
                key={index} 
                className="text-center animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-secondary" />
                  </div>
                  <span className="text-sm text-primary font-bold">{award.year}</span>
                  <h3 className="font-display text-lg font-bold text-foreground mt-2 mb-2">{award.title}</h3>
                  <p className="text-sm text-muted-foreground">{award.organization}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Video tanishuv
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Restoramiz bilan yaqindan tanishing
            </p>
          </div>

          <div className="max-w-4xl mx-auto animate-fade-in stagger-1">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-card shadow-2xl group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=675&fit=crop"
                alt="Video thumbnail"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Mijozlarimiz fikrlari
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bizning xizmatimiz haqida nima deyishadi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <Quote className="w-10 h-10 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <div className="flex gap-0.5">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-secondary fill-secondary" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Galereya
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Restoramiz va taomlarimizdan lavhalar
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((image, index) => (
              <div 
                key={index}
                className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setActiveImage(image.url)}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <img
            src={activeImage}
            alt="Gallery"
            className="max-w-full max-h-full rounded-lg animate-scale-in"
          />
        </div>
      )}

      {/* FAQ Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ko'p beriladigan savollar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Savollaringizga javoblar
            </p>
          </div>

          <div className="max-w-3xl mx-auto animate-fade-in stagger-1">
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-xl px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Bizning manzil
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {getSetting('restaurant_address')}
            </p>
          </div>

          <div className="animate-fade-in stagger-1">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.0234567890123!2d69.2401!3d41.3111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDE4JzQwLjAiTiA2OcKwMTQnMjQuNCJF!5e0!3m2!1sen!2s!4v1234567890123"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24">
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
