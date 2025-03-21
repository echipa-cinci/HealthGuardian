import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";

interface Activity {
  id: number;
  userId: number;
  patientId: number;
  type: string;
  description: string;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading: boolean;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "appointment_created":
      return { icon: "event_available", bgColor: "bg-secondary-light", textColor: "text-secondary-dark" };
    case "appointment_updated":
      return { icon: "event", bgColor: "bg-secondary-light", textColor: "text-secondary-dark" };
    case "patient_registered":
      return { icon: "how_to_reg", bgColor: "bg-green-100", textColor: "text-green-700" };
    case "record_updated":
      return { icon: "assignment", bgColor: "bg-primary-light", textColor: "text-primary-dark" };
    case "prescription_updated":
      return { icon: "medication", bgColor: "bg-blue-100", textColor: "text-blue-700" };
    default:
      return { icon: "info", bgColor: "bg-gray-100", textColor: "text-gray-700" };
  }
};

const ActivityFeed = ({ activities, isLoading }: ActivityFeedProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="flow-root">
          <ul className="-mb-8">
            {isLoading ? (
              Array(4).fill(0).map((_, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index < 3 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <Skeleton className="h-5 w-3/4 mb-1" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : activities.length > 0 ? (
              activities.map((activity, index) => {
                const { icon, bgColor, textColor } = getActivityIcon(activity.type);
                const isLast = index === activities.length - 1;
                
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
                            <span className={`material-icons text-sm ${textColor}`}>{icon}</span>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="text-sm text-gray-500">
                            <span>{activity.description}</span>
                            <span className="whitespace-nowrap ml-2 text-xs text-gray-400">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="text-center py-4 text-gray-500">No recent activity</li>
            )}
          </ul>
        </div>
        <div className="mt-6">
          <Link href="/analytics">
            <Button variant="outline" className="w-full">
              View all
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
