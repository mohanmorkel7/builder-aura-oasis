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
import FinOpsTaskManager from "@/components/FinOpsTaskManager";
import FinOpsMonitoringDashboard from "@/components/FinOpsMonitoringDashboard";

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="task-management">Task Management</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Live Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <FinOpsMonitoringDashboard />
        </TabsContent>

        {/* Task Management Tab */}
        <TabsContent value="task-management" className="space-y-6">
          <FinOpsTaskManager />
        </TabsContent>

        {/* Daily Processes Tab */}
        <TabsContent value="daily-processes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Today's Status
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      All Clear
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Last Reconciliation
                    </p>
                    <p className="text-2xl font-bold">5:15 AM</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-green-600">98.5%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Today's Process Timeline</CardTitle>
              <CardDescription>
                Daily FinOps processes for {format(new Date(), "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyProcessSteps.map((step) => {
                  const StatusIcon = getStatusIcon(step.status);

                  return (
                    <div
                      key={step.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div
                        className={`p-2 rounded-full ${getStatusColor(step.status)}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{step.step_name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {step.step_description}
                            </p>

                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {step.start_time && (
                                <span>
                                  Started:{" "}
                                  {format(new Date(step.start_time), "h:mm a")}
                                </span>
                              )}
                              {step.completion_time && (
                                <span>
                                  Completed:{" "}
                                  {format(
                                    new Date(step.completion_time),
                                    "h:mm a",
                                  )}
                                </span>
                              )}
                              {step.is_automated && (
                                <Badge variant="outline" className="text-xs">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Automated
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {step.status === "failed" && (
                              <Button size="sm" variant="outline">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                              </Button>
                            )}
                            {step.status === "in_progress" &&
                              !step.is_automated && (
                                <Button size="sm">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Complete
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Scheduled tasks and automated processes for FinOps operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {automationsLoading ? (
                <div className="text-center py-8">Loading automations...</div>
              ) : (
                <div className="space-y-4">
                  {automations.map((automation: AutomationTask) => (
                    <div
                      key={automation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={automation.is_active}
                            onChange={() => {}}
                          />
                          <Timer
                            className={`w-4 h-4 ${getAutomationStatusColor(automation)}`}
                          />
                        </div>

                        <div>
                          <h3 className="font-medium">
                            {automation.automation_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Type: {automation.automation_type.replace("_", " ")}
                          </p>

                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {automation.last_run_at && (
                              <span>
                                Last run:{" "}
                                {format(
                                  new Date(automation.last_run_at),
                                  "MMM d, h:mm a",
                                )}
                              </span>
                            )}
                            <span>Success: {automation.success_count}</span>
                            <span>Failures: {automation.failure_count}</span>
                          </div>

                          {automation.last_error && (
                            <div className="mt-2">
                              <Alert
                                variant="destructive"
                                className="text-xs p-2"
                              >
                                <AlertDescription>
                                  Last error: {automation.last_error}
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTriggerAutomation(automation.id)}
                          disabled={triggerAutomationMutation.isPending}
                        >
                          <PlayCircle className="w-3 h-3 mr-1" />
                          Run Now
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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

        {/* Lead Integration Tab */}
        <TabsContent value="lead-integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead and Product Integration</CardTitle>
              <CardDescription>
                FinOps processes connected to leads and product development
                projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    FinOps processes automatically track financial data from
                    completed leads and active product projects. Daily
                    reconciliation includes data from both lead conversions and
                    project expenses.
                  </AlertDescription>
                </Alert>

                {finopsProjects.length > 0 ? (
                  <div className="space-y-3">
                    {finopsProjects.map((project: any) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-gray-600">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Status: {project.status}</span>
                            <span>
                              Progress: {project.progress_percentage || 0}%
                            </span>
                            <span>Team: {project.assigned_team}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <FileText className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No FinOps Projects
                    </h3>
                    <p className="text-gray-600">
                      FinOps processes will appear here when leads are converted
                      to projects.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
