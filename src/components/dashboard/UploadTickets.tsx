import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import EventSearchList from './EventSearchList';
import TicketUploadFlow from './TicketUploadFlow';

type DbEvent = Tables<'events'>;

interface UploadTicketsProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UploadTickets({ onSuccess, onCancel }: UploadTicketsProps) {
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);

  return (
    <div className="space-y-6">
      {/* Step 1: Select Event */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Step 1: Select an Event
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Search and select the event to associate the ticket with
              </p>
            </div>

            {/* Selected Event Display */}
            {selectedEvent ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {selectedEvent.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(selectedEvent.event_date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedEvent.venue}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <EventSearchList
                onSelectEvent={setSelectedEvent}
                height="280px"
                pageSize={10}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Upload PDF */}
      <div className={!selectedEvent ? 'opacity-50 pointer-events-none' : ''}>
        <TicketUploadFlow
          eventId={selectedEvent?.id ?? ''}
          onSuccess={onSuccess}
        />
      </div>

      {/* Cancel Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
