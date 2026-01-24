import { Search, Ticket, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Search,
    title: "Discover Events",
    description: "Browse unlimited events in your city"
  },
  {
    icon: Ticket,
    title: "Claim Tickets",
    description: "Reserve your spot with one click"
  },
  {
    icon: PartyPopper,
    title: "Go For Free!",
    description: "Show up and enjoy the experience"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
          HOW IT WORKS
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="p-8 text-center bg-card border-border hover:border-primary/50 transition-all hover:shadow-[0_0_30px_hsl(45_100%_51%/0.2)] group"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
