import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import MemberDashboard from '@/components/dashboard/MemberDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { useAppSelector } from '@/store';

export default function Dashboard() {
  const { user, loading } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole(user);

  useEffect(() => {
    // Redirect to auth if not authenticated and not loading
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading only for initial auth check, not role loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if we're on the /admin route
  const isAdminRoute = window.location.pathname === '/admin';

  // Show Admin Dashboard only on /admin route for admins
  // Use roleLoading state to determine if we should show admin dashboard
  if (!roleLoading && role === 'admin' && isAdminRoute) {
    return <AdminDashboard user={user} />;
  }

  // Otherwise show Member Dashboard (with tickets)
  // Pass roleLoading to prevent sidebar flickering
  return (
    <MemberDashboard
      user={user}
      isAdmin={!roleLoading && role === 'admin'}
    />
  );
}
