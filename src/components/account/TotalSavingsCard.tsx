import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, AlertCircle, Ticket } from 'lucide-react';
import { formatCurrency, SavingsData } from '@/hooks/useTotalSavings';

interface TotalSavingsCardProps {
  savingsData: SavingsData;
}

export function TotalSavingsCard({ savingsData }: TotalSavingsCardProps) {
  const { totalSavings, totalTicketValue, subscriptionCost, eventsAttended, loading, error, hasMissingPriceData } = savingsData;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Total Savings</CardTitle>
            <CardDescription>
              Money saved by attending events as a member vs full ticket price
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Unable to load savings data</span>
          </div>
        ) : eventsAttended === 0 ? (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Ticket className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Attend events to start saving with your membership.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(totalSavings)}
              </span>
              <span className="text-sm text-muted-foreground">saved</span>
            </div>
            
            {/* Breakdown */}
            <div className="text-sm text-muted-foreground space-y-1 border-t border-border pt-3">
              <div className="flex justify-between">
                <span>Ticket value ({eventsAttended} event{eventsAttended !== 1 ? 's' : ''})</span>
                <span className="text-foreground">{formatCurrency(totalTicketValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Membership cost</span>
                <span className="text-foreground">-{formatCurrency(subscriptionCost)}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
                <span className="text-foreground">Net savings</span>
                <span className="text-primary">{formatCurrency(totalSavings)}</span>
              </div>
            </div>

            {hasMissingPriceData && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Some events may not be included due to missing price data.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
