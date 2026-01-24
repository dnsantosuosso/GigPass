import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import gigpassLogo from '@/assets/gigpass-logo.png';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <img
            src={gigpassLogo}
            alt="Gigpass"
            className="h-10 w-auto"
          />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/events"
            className="text-foreground hover:text-primary transition-colors"
          >
            Events
          </Link>
          <Link
            to="/pricing"
            className="text-foreground hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/partners"
            className="text-foreground hover:text-primary transition-colors"
          >
            Partners
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary"
            >
              Log In
            </Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Join Now
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
