import * as React from "react";
import { Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Settings,
  BarChart3,
  Users,
  LayoutDashboard,
  Bell,
  LogOut,
  Grid3X3,
  Target,
  FileText,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "sales", "product"],
  },
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Settings,
    roles: ["admin"],
  },
  {
    name: "Sales Dashboard",
    href: "/sales",
    icon: BarChart3,
    roles: ["admin", "sales"],
  },
  {
    name: "Leads",
    href: "/leads",
    icon: Target,
    roles: ["admin", "sales", "product"],
  },
  {
    name: "Proposals",
    href: "/proposals",
    icon: FileText,
    roles: ["admin", "sales", "product"],
  },
  {
    name: "Follow-ups",
    href: "/follow-ups",
    icon: MessageCircle,
    roles: ["admin", "sales", "product"],
  },
  {
    name: "Product Team",
    href: "/product",
    icon: Grid3X3,
    roles: ["admin", "product"],
  },
  {
    name: "Alerts & Notifications",
    href: "/alerts",
    icon: Bell,
    roles: ["admin", "sales", "product"],
  },
];

interface Notification {
  id: number;
  type: "follow_up_assigned" | "follow_up_mentioned" | "follow_up_overdue";
  title: string;
  message: string;
  follow_up_id: number;
  created_at: string;
  read: boolean;
}

// Mock notifications for the current user
const getMockNotifications = (userName: string): Notification[] => {
  if (userName === "Jane Smith") {
    return [
      {
        id: 1,
        type: "follow_up_assigned",
        title: "New Follow-up Assigned",
        message: "You have been assigned follow-up #16 for FinanceFirst Bank compliance review",
        follow_up_id: 16,
        created_at: "2024-01-20T14:20:00Z",
        read: false,
      },
      {
        id: 2,
        type: "follow_up_mentioned",
        title: "You were mentioned",
        message: "Mike Johnson mentioned you in follow-up #15 regarding RetailMax reporting features",
        follow_up_id: 15,
        created_at: "2024-01-19T10:30:00Z",
        read: false,
      }
    ];
  }

  if (userName === "Mike Johnson") {
    return [
      {
        id: 3,
        type: "follow_up_assigned",
        title: "New Follow-up Assigned",
        message: "You have been assigned follow-up #13 for TechCorp technical specifications review",
        follow_up_id: 13,
        created_at: "2024-01-16T14:15:00Z",
        read: false,
      },
      {
        id: 4,
        type: "follow_up_overdue",
        title: "Follow-up Overdue",
        message: "Follow-up #15 for RetailMax timeline assessment is overdue",
        follow_up_id: 15,
        created_at: "2024-01-21T09:00:00Z",
        read: true,
      }
    ];
  }

  return [];
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowedNavItems = navigationItems.filter((item) =>
    item.roles.includes(user.role),
  );

  const notifications = getMockNotifications(user.name);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read (in a real app, this would make an API call)
    notification.read = true;

    // Navigate to the follow-up tracker with the specific ID
    navigate(`/follow-ups?id=${notification.follow_up_id}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Banani App</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-white">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
