import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  User,
  Calendar,
  MessageSquare,
  Filter,
  RefreshCw,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

interface FinOpsNotification {
  id: string;
  type: "sla_warning" | "sla_overdue" | "task_delayed" | "task_completed" | "daily_reminder" | "escalation";
  title: string;
  message: string;
  task_name: string;
  client_name?: string;
  subtask_name?: string;
  assigned_to: string;
  reporting_managers: string[];
  priority: "low" | "medium" | "high" | "critical";
  status: "unread" | "read" | "archived";
  created_at: string;
  action_required: boolean;
  delay_reason?: string;
  sla_remaining?: string;
}

// Mock notifications data
const mockNotifications: FinOpsNotification[] = [
  {
    id: "1",
    type: "sla_overdue",
    title: "SLA Overdue Alert",
    message: "MASTER AND VISA FILE VALIDATION subtask is overdue by 2 hours",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    subtask_name: "MASTER AND VISA FILE VALIDATION",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "critical",
    status: "unread",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    action_required: true,
    sla_remaining: "-2 hours"
  },
  {
    id: "2",
    type: "sla_warning",
    title: "SLA Warning - 15 Minutes Remaining",
    message: "VISA - VALIDATION OF THE BASE 2 FILE will breach SLA in 15 minutes",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    subtask_name: "VISA - VALIDATION OF THE BASE 2 FILE",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "high",
    status: "unread",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    action_required: true,
    sla_remaining: "15 minutes"
  },
  {
    id: "3",
    type: "task_delayed",
    title: "Task Marked as Delayed",
    message: "SHARING OF THE FILE TO M2P has been marked as delayed due to external dependency",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    subtask_name: "SHARING OF THE FILE TO M2P",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "medium",
    status: "read",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    action_required: false,
    delay_reason: "External Dependency"
  },
  {
    id: "4",
    type: "task_completed",
    title: "Task Completed Successfully",
    message: "RBL DUMP VS TCP DATA (DAILY ALERT MAIL) has been completed on time",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    subtask_name: "RBL DUMP VS TCP DATA (DAILY ALERT MAIL) VS DAILY STATUS FILE COUNT",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "low",
    status: "read",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    action_required: false
  },
  {
    id: "5",
    type: "daily_reminder",
    title: "Daily Process Starting Soon",
    message: "Daily clearing process will start in 30 minutes. Please ensure all prerequisites are met.",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "medium",
    status: "unread",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    action_required: true
  },
  {
    id: "6",
    type: "escalation",
    title: "Escalation Required",
    message: "Multiple subtasks are overdue. Escalation managers have been notified.",
    task_name: "DATA RECONCILIATION PROCESS",
    client_name: "XYZ Industries",
    assigned_to: "Sarah Wilson",
    reporting_managers: ["Albert", "Hari"],
    priority: "critical",
    status: "unread",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    action_required: true
  },
  {
    id: "7",
    type: "sla_warning",
    title: "SLA Warning - Client Meeting",
    message: "Prepare client presentation materials - SLA expires in 1 hour",
    task_name: "CLIENT REPORTING AND PRESENTATION",
    client_name: "LMN Enterprises",
    assigned_to: "Mike Johnson",
    reporting_managers: ["Jennifer", "Robert"],
    priority: "high",
    status: "read",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    action_required: true,
    sla_remaining: "1 hour"
  }
];

export default function FinOpsNotifications() {
  const [notifications, setNotifications] = useState<FinOpsNotification[]>(mockNotifications);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== "all" && notification.type !== filterType) return false;
    if (filterPriority !== "all" && notification.priority !== filterPriority) return false;
    if (filterStatus !== "all" && notification.status !== filterStatus) return false;
    return true;
  });

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: "read" as const }
          : notification
      )
    );
  };

  const markAsArchived = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: "archived" as const }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, status: "read" as const }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "sla_overdue":
      case "escalation":
        return AlertTriangle;
      case "sla_warning":
        return Clock;
      case "task_completed":
        return CheckCircle;
      case "task_delayed":
        return MessageSquare;
      case "daily_reminder":
        return Calendar;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-blue-500 bg-blue-50";
      case "low":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-blue-600 bg-blue-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  // Calculate summary statistics
  const unreadCount = notifications.filter(n => n.status === "unread").length;
  const criticalCount = notifications.filter(n => n.priority === "critical" && n.status !== "archived").length;
  const actionRequiredCount = notifications.filter(n => n.action_required && n.status !== "archived").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            FinOps Notifications
          </h2>
          <p className="text-gray-600 mt-1">
            Stay updated with task progress, SLA alerts, and important notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-xs text-gray-600">Total Notifications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <div className="text-xs text-gray-600">Unread</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-xs text-gray-600">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{actionRequiredCount}</div>
            <div className="text-xs text-gray-600">Action Required</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[150px]">
              <Label>Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sla_overdue">SLA Overdue</SelectItem>
                  <SelectItem value="sla_warning">SLA Warning</SelectItem>
                  <SelectItem value="task_delayed">Task Delayed</SelectItem>
                  <SelectItem value="task_completed">Task Completed</SelectItem>
                  <SelectItem value="daily_reminder">Daily Reminder</SelectItem>
                  <SelectItem value="escalation">Escalation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label>Filter by Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Alerts</AlertTitle>
          <AlertDescription className="text-red-700">
            You have {criticalCount} critical notification(s) that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">
                {notifications.length === 0 
                  ? "No notifications yet. You'll receive updates about task progress and alerts here."
                  : "No notifications match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <Card 
                key={notification.id} 
                className={`${getNotificationColor(notification.priority)} border-l-4 ${
                  notification.status === "unread" ? "shadow-md" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        notification.priority === "critical" ? "text-red-600" :
                        notification.priority === "high" ? "text-orange-600" :
                        notification.priority === "medium" ? "text-blue-600" : "text-green-600"
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className={`font-medium text-sm ${
                              notification.status === "unread" ? "font-semibold" : ""
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-700 mt-1 break-words">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            {notification.status === "unread" && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {notification.task_name}
                          </span>
                          {notification.client_name && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {notification.client_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {notification.assigned_to}
                          </span>
                          <span>{getRelativeTime(notification.created_at)}</span>
                        </div>

                        {notification.subtask_name && (
                          <div className="text-xs text-gray-600 mb-2">
                            <strong>Subtask:</strong> {notification.subtask_name}
                          </div>
                        )}

                        {notification.delay_reason && (
                          <div className="text-xs text-yellow-700 mb-2">
                            <strong>Delay Reason:</strong> {notification.delay_reason}
                          </div>
                        )}

                        {notification.sla_remaining && (
                          <div className={`text-xs mb-2 ${
                            notification.type === "sla_overdue" ? "text-red-600" : "text-orange-600"
                          }`}>
                            <strong>SLA Status:</strong> {notification.sla_remaining}
                          </div>
                        )}

                        {notification.action_required && (
                          <Alert className="mt-3 p-2 border-orange-200 bg-orange-50">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            <AlertDescription className="text-xs text-orange-700 ml-1">
                              Action required - Please review and take necessary steps
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 ml-3">
                      {notification.status === "unread" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 px-2"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsArchived(notification.id)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          // Handle view action - could open task details
                          console.log("View notification:", notification.id);
                        }}
                        title="View Details"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
