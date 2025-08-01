import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useUsers, useLeads, useLeadStats, useFollowUps } from "@/hooks/useApi";
import { formatToIST } from "@/lib/dateUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Rocket,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react";

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch real data from APIs
  const { data: users = [] } = useUsers();
  const { data: leads = [] } = useLeads();
  const { data: leadStats } = useLeadStats();

  // State for follow-ups data
  const [followUps, setFollowUps] = React.useState([]);

  // Fetch follow-ups data
  React.useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        const response = await fetch('/api/follow-ups');
        const data = await response.json();
        setFollowUps(data);
      } catch (error) {
        console.error('Failed to fetch follow-ups:', error);
      }
    };

    fetchFollowUps();
  }, []);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "create-template":
        navigate("/admin/templates/new");
        break;
      case "view-reports":
        navigate("/admin/reports");
        break;
      case "manage-users":
        navigate("/admin/users");
        break;
      case "add-client":
        navigate("/sales/new-client");
        break;
      case "schedule-followup":
        navigate("/sales/followup/new");
        break;
      case "view-sales-report":
        navigate("/sales/reports");
        break;
      case "new-deployment":
        navigate("/product/deployment/new");
        break;
      case "view-pipeline":
        navigate("/product/pipeline");
        break;
      case "monitor-health":
        navigate("/product/health");
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case "admin":
        return [
          {
            label: "Total Users",
            value: users.length.toString(),
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            label: "Total Leads",
            value: leads.length.toString(),
            icon: Rocket,
            color: "text-green-600",
            bgColor: "bg-green-100",
          },
          {
            label: "In Progress",
            value: (leadStats?.in_progress || 0).toString(),
            icon: AlertTriangle,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
          },
          {
            label: "Won Deals",
            value: (leadStats?.won || 0).toString(),
            icon: Activity,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100",
          },
        ];
      case "sales":
        return [
          {
            label: "Total Leads",
            value: leads.length.toString(),
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            label: "Active Deals",
            value: (leadStats?.in_progress || 0).toString(),
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-100",
          },
          {
            label: "Won Deals",
            value: (leadStats?.won || 0).toString(),
            icon: Calendar,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
          },
          {
            label: "Completed",
            value: (leadStats?.completed || 0).toString(),
            icon: CheckCircle,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100",
          },
        ];
      case "product":
        return [
          {
            label: "Total Leads",
            value: leads.length.toString(),
            icon: Rocket,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            label: "Completed",
            value: (leadStats?.completed || 0).toString(),
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-100",
          },
          {
            label: "Lost Deals",
            value: (leadStats?.lost || 0).toString(),
            icon: AlertTriangle,
            color: "text-red-600",
            bgColor: "bg-red-100",
          },
          {
            label: "In Progress",
            value: (leadStats?.in_progress || 0).toString(),
            icon: Calendar,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
          },
        ];
      default:
        return [];
    }
  };

  const stats = getRoleSpecificStats();

  const getRecentActivity = () => {
    const recentLeads = leads.slice(0, 3);
    const recentFollowUps = followUps.slice(0, 2);

    switch (user?.role) {
      case "admin":
        return [
          ...recentLeads.map((lead: any) => ({
            action: "New lead created",
            detail: `${lead.client_name} - ${lead.project_title || 'New project'}`,
            time: formatToIST(lead.created_at),
          })),
          ...recentFollowUps.map((followUp: any) => ({
            action: "Follow-up updated",
            detail: `${followUp.title || 'Follow-up'} - ${followUp.status}`,
            time: formatToIST(followUp.updated_at || followUp.created_at),
          })),
        ];
      case "sales":
        return [
          ...recentLeads.map((lead: any) => ({
            action: "Lead activity",
            detail: `${lead.client_name} - ${lead.status}`,
            time: formatToIST(lead.updated_at || lead.created_at),
          })),
          ...recentFollowUps.map((followUp: any) => ({
            action: "Follow-up activity",
            detail: `${followUp.title || 'Follow-up'} - ${followUp.status}`,
            time: formatToIST(followUp.updated_at || followUp.created_at),
          })),
        ];
      case "product":
        return [
          ...recentLeads.map((lead: any) => ({
            action: "Lead project update",
            detail: `${lead.client_name} - ${lead.project_title || 'Project'}`,
            time: formatToIST(lead.updated_at || lead.created_at),
          })),
          ...recentFollowUps.map((followUp: any) => ({
            action: "Follow-up review",
            detail: `${followUp.title || 'Follow-up'} - ${followUp.status}`,
            time: formatToIST(followUp.updated_at || followUp.created_at),
          })),
        ];
      default:
        return [];
    }
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your {user?.role} dashboard today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </p>
                    <p className={`text-3xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bgColor}`}
                  >
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and changes in your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600">{activity.detail}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.role === "admin" && (
                <>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("create-template")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create Onboarding Template
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("view-reports")}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    View System Reports
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("manage-users")}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Manage User Roles
                  </Button>
                </>
              )}

              {user?.role === "sales" && (
                <>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("add-client")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Add New Client
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("schedule-followup")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("view-sales-report")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Sales Report
                  </Button>
                </>
              )}

              {user?.role === "product" && (
                <>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("new-deployment")}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Create New Deployment
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("view-pipeline")}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    View Release Pipeline
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleQuickAction("monitor-health")}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Monitor System Health
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
