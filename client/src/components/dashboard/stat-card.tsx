import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "primary" | "secondary" | "info" | "accent";
  link: string;
}

const colorVariants = {
  primary: {
    bg: "bg-primary-light",
    text: "text-primary-dark",
  },
  secondary: {
    bg: "bg-secondary-light",
    text: "text-secondary-dark",
  },
  info: {
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  accent: {
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
};

const StatCard = ({ title, value, icon: Icon, color, link }: StatCardProps) => {
  const colorClasses = colorVariants[color];
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${colorClasses.bg} rounded-md p-3`}>
              <Icon className={`h-6 w-6 ${colorClasses.text}`} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <div>
                <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                <p className="text-lg font-medium text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href={link}>
              <a className="font-medium text-primary hover:text-primary-dark">
                View all
              </a>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
