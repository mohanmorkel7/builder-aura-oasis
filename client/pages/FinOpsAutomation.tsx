import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Calendar,
  RefreshCw,
  Bell,
  FileText,
  TrendingUp,
  Database,
  Shield,
  DollarSign,
  Users,
  Activity,
  Settings,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Zap,
  Timer,
  Target,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import ClientBasedFinOpsTaskManager from "@/components/ClientBasedFinOpsTaskManager";
import FinOpsNotifications from "@/components/FinOpsNotifications";

interface AutomationTask {
  id: number;
  automation_name: string;
  automation_type:
    | "daily_task"
    | "scheduled_check"
    | "conditional_trigger"
    | "notification";
  schedule_config: any;
  action_config: any;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  success_count: number;
  failure_count: number;
  last_error?: string;
}

interface ProcessStep {
  id: number;
  step_name: string;
  step_description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  start_time?: string;
  completion_time?: string;
  is_automated: boolean;
  automation_config?: any;
}

export default function FinOpsAutomation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch workflow projects for FinOps
  const { data: finopsProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["workflow-projects-finops"],
    queryFn: () =>
      apiClient.getWorkflowProjects(parseInt(user?.id || "1"), "finance"),
  });

  // Fetch automation tasks
  const { data: automations = [], isLoading: automationsLoading } = useQuery({
    queryKey: ["workflow-automations"],
    queryFn: () => apiClient.getWorkflowAutomations(),
  });

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } =
    useQuery({
      queryKey: ["workflow-notifications"],
      queryFn: () =>
        apiClient.getWorkflowNotifications(parseInt(user?.id || "1"), true),
    });

  const triggerAutomationMutation = useMutation({
    mutationFn: (automationId: number) =>
      apiClient.triggerAutomation(automationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-automations"] });
    },
  });

  // Mock daily process steps for demonstration
  const dailyProcessSteps: ProcessStep[] = [
    {
      id: 1,
      step_name: "Daily Transaction Reconciliation",
      step_description:
        "Run automated transaction reconciliation at 5:00 AM daily",
      status: "completed",
      start_time: "2024-01-26T05:00:00Z",
      completion_time: "2024-01-26T05:15:00Z",
      is_automated: true,
      automation_config: {
        schedule: "0 5 * * 1-5",
        timeout: 30,
        alert_on_failure: true,
      },
    },
    {
      id: 2,
      step_name: "Process files before 5 AM",
      step_description:
        "Ensure all files are processed before the 5 AM cutoff time",
      status: "completed",
      start_time: "2024-01-26T04:30:00Z",
      completion_time: "2024-01-26T04:58:00Z",
      is_automated: true,
      automation_config: {
        schedule: "30 4 * * 1-5",
        alert_on_failure: true,
      },
    },
    {
      id: 3,
      step_name: "Follow-up with FinOps team",
      step_description:
        "Coordinate with FinOps team members on daily tasks and any issues",
      status: "in_progress",
      start_time: "2024-01-26T09:00:00Z",
      is_automated: false,
    },
    {
      id: 4,
      step_name: "Alert Lead and FinOps teams",
      step_description:
        "Send alerts to lead and FinOps teams if any processes fail or are delayed",
      status: "pending",
      is_automated: true,
      automation_config: {
        condition: "if_failures",
        recipients: ["lead_team", "finops_team"],
        priority: "high",
      },
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in_progress":
        return PlayCircle;
      case "failed":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getAutomationStatusColor = (automation: AutomationTask) => {
    if (!automation.is_active) return "text-gray-500";
    if (automation.failure_count > 0) return "text-red-600";
    if (automation.success_count > 0) return "text-green-600";
    return "text-blue-600";
  };

  const handleTriggerAutomation = (automationId: number) => {
    triggerAutomationMutation.mutate(automationId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            FinOps Management
          </h1>
          <p className="text-gray-600 mt-1">
            Automated daily processes, reconciliation, and team coordination
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/finops/dashboard")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Alert for Critical Notifications */}
      {notifications.filter((n: any) => n.priority === "critical").length >
        0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have{" "}
            {notifications.filter((n: any) => n.priority === "critical").length}{" "}
            critical alert(s) requiring immediate attention.
            <Button variant="link" className="p-0 h-auto ml-2">
              View Details <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="task-management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="task-management">Task Management</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Task Management Tab */}
        <TabsContent value="task-management" className="space-y-6">
          <ClientBasedFinOpsTaskManager />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <FinOpsNotifications />
        </TabsContent>


        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                Alerts and notifications from automated processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="text-center py-8">Loading notifications...</div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification: any) => {
                    const getPriorityColor = (priority: string) => {
                      switch (priority) {
                        case "critical":
                          return "border-l-red-500 bg-red-50";
                        case "high":
                          return "border-l-orange-500 bg-orange-50";
                        case "medium":
                          return "border-l-blue-500 bg-blue-50";
                        default:
                          return "border-l-gray-500 bg-gray-50";
                      }
                    };

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 border-l-4 rounded-lg ${getPriorityColor(notification.priority)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Badge variant="outline" className="text-xs">
                                {notification.priority}
                              </Badge>
                              <span>
                                {format(
                                  new Date(notification.created_at),
                                  "MMM d, h:mm a",
                                )}
                              </span>
                              <span>{notification.source_type}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="ghost">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark Read
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No New Notifications
                  </h3>
                  <p className="text-gray-600">
                    All automated processes are running smoothly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}
