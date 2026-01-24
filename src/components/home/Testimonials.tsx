import { Card } from "@/components/ui/card";

const testimonials = [
  {
    text: "I have genuinely saved money and seen artists I never would have otherwise were it not for Gigpass. 10/10",
    author: "@lava.sandwich"
  },
  {
    text: "Gigpass is 🔥 🔥 🔥",
    author: "@jackiedrinkscoffee"
  },
  {
    text: "If you're someone who just likes to check out events around the city, especially events you maybe otherwise wouldn't have, it's honestly great.",
    author: "u/pea-s"
  },
  {
    text: "It has literally saved me at least $100/month that I would have otherwise spent in cover!",
    author: "u/Numerous-Thanks4507"
  },
  {
    text: "Gigpass is the goat 🔥",
    author: "@z_richman"
  }
];

export const Testimonials = () => {
  return (
    <section className="py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden">
          <div className="flex animate-[slide-in-right_30s_linear_infinite] hover:[animation-play-state:paused]">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <Card 
                key={index}
                className="flex-shrink-0 w-80 mx-4 p-6 bg-card border-border hover:border-primary/50 transition-colors"
              >
                <p className="text-foreground mb-4">{testimonial.text}</p>
                <p className="text-primary font-semibold">{testimonial.author}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
