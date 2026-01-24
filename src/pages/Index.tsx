import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { Hero } from '@/components/home/Hero';
import { Testimonials } from '@/components/home/Testimonials';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FAQ } from '@/components/home/FAQ';
import UpcomingEvents from '@/components/home/UpcomingEvents';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAppSelector } from '@/store';

const Index = () => {
  const { user, session } = useAppSelector((state) => state.auth);
  const { role } = useUserRole(session);
  const { displayName } = useUserProfile(user);

  const content = (
    <>
      <Hero />
      <UpcomingEvents />
      <Testimonials />
      <HowItWorks />
      <FAQ />
    </>
  );

  // If user is logged in, show with sidebar (but still show all content including hero)
  if (user) {
    return (
      <div className="flex min-h-screen bg-background">
        <ModernSidebar
          userEmail={user.email}
          displayName={displayName || undefined}
          isAdmin={role === 'admin'}
        />
        <div className="flex-1 overflow-auto">
          <div className="min-h-screen bg-background">
            {content}
            <Footer />
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, show with navbar and footer
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {content}
      <Footer />
    </div>
  );
};

export default Index;
