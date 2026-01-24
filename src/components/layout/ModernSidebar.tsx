import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Ticket,
  User,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import gigpassLogo from '@/assets/gigpass-logo.png';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ModernSidebarProps {
  userEmail?: string;
  displayName?: string;
  isAdmin?: boolean;
}

export function ModernSidebar({
  userEmail,
  displayName,
  isAdmin = false,
}: ModernSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Memoize nav items to prevent recalculation
  const navItems = [
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/dashboard', icon: Ticket, label: 'My Tickets' },
    ...(isAdmin
      ? [{ href: '/admin', icon: Shield, label: 'Admin Portal' }]
      : []),
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img
            src={gigpassLogo}
            alt="Gigpass"
            className="h-7 w-auto"
          />
          <span className="text-base font-bold text-primary">Gigpass</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 w-9 p-0"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-50 md:z-auto h-screen bg-card/95 backdrop-blur-md border-r border-border flex flex-col transition-transform duration-300 ease-in-out',
          'w-[220px] md:w-[220px]',
          isMobile && !isOpen && '-translate-x-full',
          isMobile && isOpen && 'translate-x-0 shadow-2xl',
          !isMobile && 'translate-x-0'
        )}
      >
        {/* Logo - Hidden on mobile (shown in header) */}
        <div className="hidden md:flex h-14 items-center gap-2.5 border-b border-border px-4 shrink-0">
          <img
            src={gigpassLogo}
            alt="Gigpass"
            className="h-7 w-auto"
          />
        </div>

        {/* Mobile spacer for header */}
        <div className="md:hidden h-14 shrink-0" />

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
              >
                <div
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        {userEmail && (
          <div className="border-t border-border p-3 space-y-2 shrink-0">
            <Link to="/settings">
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground truncate flex-1 hover:text-foreground">
                  {displayName || userEmail}
                </span>
              </div>
            </Link>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground h-8 text-xs"
              size="sm"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
