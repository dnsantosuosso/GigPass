import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import tiersData from '@/config/tiers.json';

interface Tier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
}

interface SubscriptionSelectorProps {
  onSelect: (tierId: string) => void;
  selectedTierId?: string;
  loading?: boolean;
}

export default function SubscriptionSelector({
  onSelect,
  selectedTierId,
  loading = false,
}: SubscriptionSelectorProps) {
  const tiers = tiersData.tiers as Tier[];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Choose Your Subscription
        </h2>
        <p className="text-muted-foreground">
          Select a membership tier to access exclusive events
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative cursor-pointer transition-all ${
              selectedTierId === tier.id
                ? 'border-primary shadow-lg'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => !loading && onSelect(tier.id)}
          >
            {selectedTierId === tier.id && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary">Selected</Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                {tier.name}
              </CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-primary">
                  ${tier.price}
                </span>
                <span className="text-muted-foreground">/{tier.interval}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {tier.description}
              </p>

              <div className="space-y-2">
                {tier.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2"
                  >
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                variant={selectedTierId === tier.id ? 'default' : 'outline'}
                disabled={loading}
              >
                {selectedTierId === tier.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
