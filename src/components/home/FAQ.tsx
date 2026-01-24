import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Gigpass?",
    answer: "Gigpass is a membership platform that gives you unlimited access to events in your city for a flat monthly fee of $25."
  },
  {
    question: "Which cities is Gigpass available in?",
    answer: "Gigpass is currently available in Toronto and Vancouver, with more cities coming soon!"
  },
  {
    question: "How does Gigpass work?",
    answer: "Subscribe for $25/month, browse available events, claim tickets with one click, and show up to enjoy free entry!"
  },
  {
    question: "How many tickets can I claim?",
    answer: "You can claim unlimited tickets each month as long as you have an active membership."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time with no penalties or fees."
  },
  {
    question: "I claimed a ticket but haven't received it yet. When will it arrive?",
    answer: "Tickets are sent out a few hours before the event to prevent reselling and ticket sharing. You'll get yours in time for the show."
  },
  {
    question: "Is there a Gigpass app?",
    answer: "Our web platform works perfectly on mobile browsers. A dedicated app is coming soon!"
  }
];

export const FAQ = () => {
  return (
    <section className="py-20 bg-card/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
          FAQ
        </h2>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6 hover:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left text-foreground hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
