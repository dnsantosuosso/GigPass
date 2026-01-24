import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import tiersData from '@/config/tiers.json';

interface TicketTypeFormProps {
  eventId: string;
  onSuccess: () => void;
}

export default function TicketTypeForm({
  eventId,
  onSuccess,
}: TicketTypeFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const tiers = tiersData.tiers;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
  });

  const toggleTier = (tierId: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tierId)
        ? prev.filter((id) => id !== tierId)
        : [...prev, tierId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTiers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select at least one tier for this ticket type',
      });
      return;
    }

    setLoading(true);

    try {
      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert({
          event_id: eventId,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          tier_criteria: selectedTiers,
        });

      if (ticketError) throw ticketError;

      toast({
        title: 'Ticket type created',
        description: 'The ticket type has been added successfully',
      });

      setFormData({ name: '', description: '', price: '', quantity: '' });
      setSelectedTiers([]);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create ticket type',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Ticket Type</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Ticket Type Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., VIP, General Admission"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what's included..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="100"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Available to Subscription Tiers *</Label>
            <p className="text-sm text-muted-foreground">
              Select which subscription tiers can claim this ticket type
            </p>
            <div className="space-y-2">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`tier-${tier.id}`}
                    checked={selectedTiers.includes(tier.id)}
                    onCheckedChange={() => toggleTier(tier.id)}
                  />
                  <label
                    htmlFor={`tier-${tier.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {tier.name} (${tier.price}/{tier.interval})
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Ticket Type'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
