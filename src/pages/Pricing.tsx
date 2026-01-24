import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle } from 'lucide-react';
import tiers from '@/config/tiers.json';

const Pricing = () => {
  const tier = tiers.tiers[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Simple, Transparent <span className="text-primary">Pricing</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One membership. Unlimited events. No hidden fees.
          </p>
        </section>

        {/* Pricing Card */}
        <section className="container mx-auto px-4 max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:border-primary/50 transition-colors">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h2>
              <p className="text-muted-foreground mb-6">{tier.description}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-primary">${tier.price}</span>
                <span className="text-muted-foreground">/{tier.interval}</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link to="/auth?mode=signup" className="block">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Important Policies */}
          <div className="mt-8 bg-muted/50 border border-border rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <h3 className="font-semibold text-foreground">Important Information</h3>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Membership is <strong className="text-foreground">valid for one person only</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Your name <strong className="text-foreground">cannot be changed</strong> after registration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Name must <strong className="text-foreground">match the ID</strong> provided when creating your account</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
