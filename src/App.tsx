import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { store } from './store';
import { AuthInitializer } from './store/AuthInitializer';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import TicketDetail from './pages/TicketDetail';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AccountSettings from './pages/AccountSettings';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <AuthInitializer>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={<Index />}
              />
              <Route
                path="/auth"
                element={<Auth />}
              />
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />
              <Route
                path="/admin"
                element={<Dashboard />}
              />
              <Route
                path="/events"
                element={<Events />}
              />
              <Route
                path="/events/:id"
                element={<EventDetail />}
              />
              <Route
                path="/ticket/:id"
                element={<TicketDetail />}
              />
              <Route
                path="/terms"
                element={<Terms />}
              />
              <Route
                path="/privacy"
                element={<PrivacyPolicy />}
              />
              <Route
                path="/settings"
                element={<AccountSettings />}
              />
              <Route
                path="/pricing"
                element={<Pricing />}
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="*"
                element={<NotFound />}
              />
            </Routes>
          </BrowserRouter>
          <Analytics />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthInitializer>
  </Provider>
);

export default App;
