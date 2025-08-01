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
import { apiClient } from "@/lib/api";

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

// Get real notifications based on follow-ups data
const getNotificationsFromFollowUps = async (
  userId: string,
  userName: string,
): Promise<Notification[]> => {
  try {
    console.log("Fetching follow-ups for notifications, userId:", userId, "userName:", userName);

    const followUps = await apiClient.getAllFollowUps({
      userId,
      userRole: "all",
    });

    if (!Array.isArray(followUps)) {
      console.warn("Follow-ups response is not an array:", followUps);
      return [];
    }

    const notifications: Notification[] = [];
    const currentDate = new Date();

    followUps.forEach((followUp: any) => {
      // Check if user is assigned to this follow-up
      if (
        followUp.assigned_user_name === userName &&
        followUp.status === "pending"
      ) {
        notifications.push({
          id: followUp.id,
          type: "follow_up_assigned",
          title: "Follow-up Assigned",
          message: `You have been assigned: ${followUp.title}`,
          follow_up_id: followUp.id,
          created_at: followUp.created_at,
          read: false,
        });
      }

      // Check if follow-up is overdue
      if (
        followUp.assigned_user_name === userName &&
        followUp.status !== "completed" &&
        followUp.due_date &&
        new Date(followUp.due_date) < currentDate
      ) {
        notifications.push({
          id: followUp.id + 1000, // Offset to avoid ID conflicts
          type: "follow_up_overdue",
          title: "Follow-up Overdue",
          message: `Overdue: ${followUp.title}`,
          follow_up_id: followUp.id,
          created_at: followUp.updated_at,
          read: false,
        });
      }
    });

    return notifications.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
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

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch real notifications on component mount
  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const realNotifications = await getNotificationsFromFollowUps(
            user.id,
            user.name,
          );
          setNotifications(realNotifications);
        } catch (error) {
          console.error("Failed to fetch notifications in useEffect:", error);
          // Keep existing notifications on error
        }
      }
    };

    fetchNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

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

        {/* Notifications */}
        <div className="p-4 border-t border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full relative">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {unreadCount} unread notifications
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read
                          ? "bg-blue-50 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === "follow_up_assigned"
                              ? "bg-blue-100"
                              : notification.type === "follow_up_mentioned"
                                ? "bg-red-100"
                                : "bg-yellow-100"
                          }`}
                        >
                          {notification.type === "follow_up_assigned" ? (
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                          ) : notification.type === "follow_up_mentioned" ? (
                            <Bell className="w-4 h-4 text-red-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(
                              notification.created_at,
                            ).toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate("/follow-ups")}
                  >
                    View All Follow-ups
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

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
