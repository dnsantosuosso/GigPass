import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardHeader>
        <Skeleton className="h-6 w-20 mb-2" />
        <Skeleton className="h-7 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function EventListSkeleton() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-28 sm:h-32 w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-5 w-full mb-2" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TicketListSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-8" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <TicketCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
