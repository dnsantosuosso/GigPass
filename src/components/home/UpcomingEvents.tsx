import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  event_date: string;
  event_type: string;
  genre: string;
  capacity: number;
  claimed_count: number;
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(6);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-primary">
            Upcoming Events
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join us at these exclusive events. Sign up now to claim your
            tickets!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="bg-card border-border hover:border-primary/50 transition-all"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {event.genre}
                  </Badge>
                  <Badge
                    variant={
                      event.claimed_count < event.capacity
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {event.claimed_count < event.capacity
                      ? 'Available'
                      : 'Sold Out'}
                  </Badge>
                </div>
                <CardTitle className="text-xl text-foreground">
                  {event.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    {format(new Date(event.event_date), 'PPP p')}
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    {event.venue}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {event.claimed_count} / {event.capacity} attending
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
