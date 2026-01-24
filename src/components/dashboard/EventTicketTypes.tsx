import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketTypeForm from "./TicketTypeForm";
import TicketTypeList from "./TicketTypeList";

interface EventTicketTypesProps {
  eventId: string;
  eventTitle: string;
}

export default function EventTicketTypes({ eventId, eventTitle }: EventTicketTypesProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Ticket Types - {eventTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">View Ticket Types</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="space-y-4">
            <TicketTypeList eventId={eventId} refresh={refreshKey} />
          </TabsContent>
          <TabsContent value="create">
            <TicketTypeForm eventId={eventId} onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
