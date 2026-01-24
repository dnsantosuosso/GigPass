import { Link } from "react-router-dom";
import { Instagram, Music, MessageCircle, Facebook } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Gigpass</h3>
            <p className="text-muted-foreground">
              Unlimited event access for one flat monthly fee.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/events" className="block text-muted-foreground hover:text-primary transition-colors">
                Events
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/partners" className="block text-muted-foreground hover:text-primary transition-colors">
                Partners
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Music className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Help: support@gigpass.io
            </p>
          </div>
        </div>
        
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          © 2025 Gigpass. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
