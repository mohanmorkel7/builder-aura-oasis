import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  Building,
  User,
  Shield,
  Activity,
  Clock,
  CheckCircle,
} from "lucide-react";

const roleColors = {
  admin: "bg-red-100 text-red-700",
  sales: "bg-blue-100 text-blue-700",
  product: "bg-green-100 text-green-700",
};

const statusColors = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
};

// Mock activity data
const mockRecentActivity = [
  {
    id: 1,
    action: "Logged in to system",
    timestamp: "2024-01-15T10:30:00Z",
    details: "Successful login from Chrome browser",
  },
  {
    id: 2,
    action: "Updated client information",
    timestamp: "2024-01-15T09:45:00Z",
    details: "Modified Acme Corp contact details",
  },
  {
    id: 3,
    action: "Created new template",
    timestamp: "2024-01-14T16:20:00Z",
    details: "Enterprise Onboarding Template v2.0",
  },
  {
    id: 4,
    action: "Completed deployment",
    timestamp: "2024-01-14T14:15:00Z",
    details: "Core App v2.1.0 to production",
  },
  {
    id: 5,
    action: "Added new user",
    timestamp: "2024-01-13T11:30:00Z",
    details: "Created account for Sarah Wilson",
  },
];

// Mock permissions data
const mockPermissions = {
  admin: [
    "User Management",
    "Template Creation & Editing",
    "System Configuration",
    "Analytics & Reports",
    "Client Management",
    "Deployment Management",
  ],
  sales: [
    "Client Management",
    "Follow-up Tracking",
    "Template Usage",
    "Sales Reports",
    "Contact Management",
  ],
  product: [
    "Deployment Management",
    "Product Configuration",
    "Release Management",
    "System Monitoring",
    "Development Tools",
  ],
};

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Handle both numeric IDs and string IDs (like azure-1)
  const userId = id && !isNaN(parseInt(id)) ? parseInt(id) : 0;
  const { data: user, isLoading, error } = useUser(userId);
  const [resetError, setResetError] = React.useState<string | null>(null);

  // If ID is not numeric, show appropriate error
  const isInvalidId = id && isNaN(parseInt(id));

  const resetPassword = async () => {
    if (!id) return;

    setResetError(null);
    try {
      const response = await fetch(`/api/users/${id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      alert("Password reset email sent successfully!");
    } catch (error) {
      console.error("Failed to reset password:", error);
      setResetError(
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.",
      );
    }
  };

  const handleBack = () => {
    navigate("/admin/users");
  };

  const handleEdit = () => {
    navigate(`/admin/users/${id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading user details...</div>
      </div>
    );
  }

  if (isInvalidId) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <Alert>
            <AlertDescription>
              Invalid user ID "{id}". User IDs must be numeric. If you're looking for a specific user, please use the user management page to find them.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <Alert>
            <AlertDescription>
              Error loading user details. The user may not exist or there may be a connection issue.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const userData = user as any;
  const userPermissions = mockPermissions[userData.role] || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {userData.first_name} {userData.last_name}
            </h1>
            <p className="text-gray-600 mt-1">User Profile & Activity</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit User
        </Button>
      </div>

      {/* Error Display */}
      {resetError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{resetError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Basic user information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-6 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-xl bg-primary text-white">
                    {userData.first_name[0]}
                    {userData.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {userData.first_name} {userData.last_name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge className={roleColors[userData.role]}>
                      {userData.role.charAt(0).toUpperCase() +
                        userData.role.slice(1)}
                    </Badge>
                    <Badge className={statusColors[userData.status]}>
                      {userData.status.charAt(0).toUpperCase() +
                        userData.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Email:</span>
                    <a
                      href={`mailto:${userData.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {userData.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Phone:</span>
                    <span className="text-gray-900">
                      {userData.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Department:
                    </span>
                    <span className="text-gray-900">
                      {userData.department || "Not specified"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Start Date:
                    </span>
                    <span className="text-gray-900">
                      {userData.start_date
                        ? new Date(userData.start_date).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Last Login:
                    </span>
                    <span className="text-gray-900">
                      {userData.last_login
                        ? new Date(userData.last_login).toLocaleString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">2FA:</span>
                    <span className="text-gray-900">
                      {userData.two_factor_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              {userData.notes && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {userData.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest user actions and system interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.details}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Permissions & Actions */}
        <div className="space-y-6">
          {/* Role Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Access rights for {userData.role} role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPermissions.map((permission, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>
                Activity and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Total Logins
                </span>
                <span className="text-lg font-bold text-gray-900">142</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Actions This Month
                </span>
                <span className="text-lg font-bold text-gray-900">28</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Account Age
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {userData.created_at
                    ? Math.floor(
                        (Date.now() - new Date(userData.created_at).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : 0}{" "}
                  days
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={resetPassword}
              >
                <Shield className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                View Full Activity Log
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <User className="w-4 h-4 mr-2" />
                Change Role
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
