import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  tier_criteria: any;
}

interface TicketTypeListProps {
  eventId: string;
  refresh: number;
}

export default function TicketTypeList({ eventId, refresh }: TicketTypeListProps) {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTicketTypes();
  }, [eventId, refresh]);

  const fetchTicketTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", eventId)
        .order("price", { ascending: true });

      if (error) throw error;
      setTicketTypes(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load ticket types",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket type?")) return;

    try {
      const { error } = await supabase.from("ticket_types").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Ticket type deleted",
        description: "The ticket type has been removed",
      });

      fetchTicketTypes();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete ticket type",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading ticket types...</div>;
  }

  if (ticketTypes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No ticket types yet. Create one above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ticket Types</h3>
      {ticketTypes.map((ticketType) => (
        <Card key={ticketType.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{ticketType.name}</CardTitle>
                {ticketType.description && (
                  <p className="text-sm text-muted-foreground">{ticketType.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(ticketType.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium">Price:</span> ${ticketType.price.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {ticketType.quantity}
              </div>
            </div>

            {ticketType.tier_criteria && Object.keys(ticketType.tier_criteria).length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Tier Criteria:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ticketType.tier_criteria).map(([key, value]) => (
                    <Badge key={key} variant="secondary">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
