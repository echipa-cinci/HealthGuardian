import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  reason: string;
  status: string;
}

interface AppointmentListProps {
  title: string;
  appointments: Appointment[];
  isLoading: boolean;
  emptyMessage: string;
  linkText: string;
  linkUrl: string;
}

const AppointmentList = ({
  title,
  appointments,
  isLoading,
  emptyMessage,
  linkText,
  linkUrl,
}: AppointmentListProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{title}</h2>
        <div className="space-y-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))
          ) : appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div key={appointment.id} className="bg-neutral-light p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Patient #{appointment.patientId}</p>
                    <p className="text-xs text-gray-500 mt-1">{appointment.reason}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {format(new Date(appointment.date), 'h:mm a')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">{emptyMessage}</div>
          )}
        </div>
        <div className="mt-6">
          <Link href={linkUrl}>
            <Button variant="outline" className="w-full">
              {linkText}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentList;
