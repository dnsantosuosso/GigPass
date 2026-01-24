import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(45_100%_51%/0.1),transparent_50%)]" />
      
      <div className="container relative z-10 mx-auto px-4 text-center">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            FREE & UNLIMITED
            <br />
            TICKETS
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4">
            For only <span className="text-primary font-bold">$25/mo</span>
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            ⭐ +10,000 tickets claimed
          </p>
          
          <Link to="/auth?mode=signup">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-[0_0_40px_hsl(45_100%_51%/0.3)] hover:shadow-[0_0_60px_hsl(45_100%_51%/0.5)] transition-all"
            >
              Unlock Unlimited Tickets
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
