import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const categories = [
  {
    id: 'fast-food',
    name: 'Fast Food',
    description: 'Tez va mazali taomlar',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop',
    slug: 'fast-food',
  },
  {
    id: 'milliy-taomlar',
    name: 'Milliy Taomlar',
    description: 'An\'anaviy lazzatlar',
    image: 'https://images.unsplash.com/photo-1547424850-82a4454f3ccd?q=80&w=1200&auto=format&fit=crop',
    slug: 'milliy-taomlar',
  },
];

export function CategoriesSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-in title-underline">
            Kategoriyalar
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mt-6 animate-fade-in stagger-1">
            Tanlang va zavqlaning – milliy taomlardan fast foodgacha
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/menu?category=${category.slug}`}
              className="group relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden category-card animate-fade-in hover-zoom"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Image */}
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-10">
                <h3 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-foreground/70 mb-4">
                  {category.description}
                </p>
                <div className="flex items-center gap-2 text-secondary font-medium">
                  <span>Ko'rish</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>

              {/* Decorative corner */}
              <div className="absolute top-6 right-6 w-16 h-16 border border-secondary/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ArrowRight className="w-6 h-6 text-secondary -rotate-45" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}