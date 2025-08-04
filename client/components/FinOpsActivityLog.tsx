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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Activity,
  Download,
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Filter,
  Building2,
  Target,
  RefreshCw,
  Search,
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: "task_created" | "task_updated" | "subtask_status_changed" | "task_assigned" | "sla_alert" | "delay_reported";
  entity_type: "task" | "subtask";
  entity_id: string;
  entity_name: string;
  client_name?: string;
  user_name: string;
  details: string;
  changes?: any;
  status?: string;
  previous_status?: string;
  delay_reason?: string;
}

// Mock activity log data
const mockActivityLogs: ActivityLogEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    action: "subtask_status_changed",
    entity_type: "subtask",
    entity_id: "st_001",
    entity_name: "MASTER AND VISA FILE VALIDATION",
    client_name: "ABC Corporation",
    user_name: "John Durairaj",
    details: "Subtask status changed from 'in_progress' to 'completed'",
    status: "completed",
    previous_status: "in_progress"
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    action: "delay_reported",
    entity_type: "subtask",
    entity_id: "st_002",
    entity_name: "SHARING OF THE FILE TO M2P",
    client_name: "ABC Corporation",
    user_name: "John Durairaj",
    details: "Subtask marked as delayed due to external dependency",
    status: "delayed",
    previous_status: "in_progress",
    delay_reason: "External Dependency"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    action: "sla_alert",
    entity_type: "subtask",
    entity_id: "st_003",
    entity_name: "VISA - VALIDATION OF THE BASE 2 FILE",
    client_name: "ABC Corporation",
    user_name: "System",
    details: "SLA warning - Task will breach SLA in 15 minutes",
    status: "in_progress"
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    action: "task_created",
    entity_type: "task",
    entity_id: "t_001",
    entity_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    user_name: "Admin User",
    details: "New FinOps task created with 5 subtasks",
    changes: {
      assigned_to: "John Durairaj",
      duration: "daily",
      subtask_count: 5
    }
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    action: "task_assigned",
    entity_type: "task",
    entity_id: "t_002",
    entity_name: "DATA RECONCILIATION PROCESS",
    client_name: "XYZ Industries",
    user_name: "Admin User",
    details: "Task reassigned to Sarah Wilson",
    changes: {
      old_assignee: "Mike Johnson",
      new_assignee: "Sarah Wilson"
    }
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    action: "subtask_status_changed",
    entity_type: "subtask",
    entity_id: "st_004",
    entity_name: "RBL DUMP VS TCP DATA (DAILY ALERT MAIL)",
    client_name: "ABC Corporation",
    user_name: "John Durairaj",
    details: "Subtask started - status changed from 'pending' to 'in_progress'",
    status: "in_progress",
    previous_status: "pending"
  },
  {
    id: "7",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    action: "task_updated",
    entity_type: "task",
    entity_id: "t_003",
    entity_name: "CLIENT REPORTING AND PRESENTATION",
    client_name: "LMN Enterprises",
    user_name: "Admin User",
    details: "Task configuration updated - reporting managers added",
    changes: {
      reporting_managers_added: ["Jennifer", "Robert"]
    }
  }
];

export default function FinOpsActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>(mockActivityLogs);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch clients for filter
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiClient.getClients(),
  });

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Date filter
    if (dateFrom) {
      const fromDate = startOfDay(parseISO(dateFrom));
      if (isBefore(parseISO(log.timestamp), fromDate)) return false;
    }
    if (dateTo) {
      const toDate = endOfDay(parseISO(dateTo));
      if (isAfter(parseISO(log.timestamp), toDate)) return false;
    }

    // Client filter
    if (clientFilter !== "all" && log.client_name !== clientFilter) return false;

    // Status filter
    if (statusFilter !== "all" && log.status !== statusFilter) return false;

    // Action filter
    if (actionFilter !== "all" && log.action !== actionFilter) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !log.entity_name.toLowerCase().includes(searchLower) &&
        !log.details.toLowerCase().includes(searchLower) &&
        !log.user_name.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    return true;
  });

  // Get unique clients, tasks, and statuses for filters
  const uniqueClients = [...new Set(logs.map(log => log.client_name).filter(Boolean))];
  const uniqueTasks = [...new Set(logs.map(log => log.entity_name))];
  const uniqueStatuses = [...new Set(logs.map(log => log.status).filter(Boolean))];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "task_created":
        return Target;
      case "task_updated":
      case "task_assigned":
        return Activity;
      case "subtask_status_changed":
        return CheckCircle;
      case "delay_reported":
        return AlertTriangle;
      case "sla_alert":
        return Clock;
      default:
        return Activity;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "task_created":
        return "text-green-600 bg-green-100";
      case "task_updated":
      case "task_assigned":
        return "text-blue-600 bg-blue-100";
      case "subtask_status_changed":
        return "text-purple-600 bg-purple-100";
      case "delay_reported":
        return "text-yellow-600 bg-yellow-100";
      case "sla_alert":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "delayed":
        return "text-yellow-600 bg-yellow-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const exportToCSV = () => {
    const headers = ["Timestamp", "Action", "Entity", "Client", "User", "Details", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => [
        `"${format(parseISO(log.timestamp), "yyyy-MM-dd HH:mm:ss")}"`,
        `"${log.action.replace(/_/g, ' ')}"`,
        `"${log.entity_name}"`,
        `"${log.client_name || 'N/A'}"`,
        `"${log.user_name}"`,
        `"${log.details.replace(/"/g, '""')}"`,
        `"${log.status || 'N/A'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finops-activity-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToText = () => {
    const textContent = filteredLogs.map(log => {
      return `[${format(parseISO(log.timestamp), "yyyy-MM-dd HH:mm:ss")}] ${log.action.replace(/_/g, ' ').toUpperCase()}\n` +
             `Entity: ${log.entity_name}\n` +
             `Client: ${log.client_name || 'N/A'}\n` +
             `User: ${log.user_name}\n` +
             `Details: ${log.details}\n` +
             `Status: ${log.status || 'N/A'}\n` +
             `${'-'.repeat(80)}\n`;
    }).join('\n');

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finops-activity-log-${format(new Date(), "yyyy-MM-dd")}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setClientFilter("all");
    setTaskFilter("all");
    setStatusFilter("all");
    setActionFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Activity Log
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive log of all FinOps task activities and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToText}>
            <FileText className="w-4 h-4 mr-1" />
            Export TXT
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredLogs.length}</div>
            <div className="text-xs text-gray-600">Filtered Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs.filter(log => log.action === "task_created").length}
            </div>
            <div className="text-xs text-gray-600">Tasks Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredLogs.filter(log => log.action === "subtask_status_changed").length}
            </div>
            <div className="text-xs text-gray-600">Status Changes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(log => log.action === "sla_alert" || log.action === "delay_reported").length}
            </div>
            <div className="text-xs text-gray-600">Alerts & Delays</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label>Client</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {uniqueClients.map((client) => (
                    <SelectItem key={client} value={client!}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="task_created">Task Created</SelectItem>
                  <SelectItem value="task_updated">Task Updated</SelectItem>
                  <SelectItem value="task_assigned">Task Assigned</SelectItem>
                  <SelectItem value="subtask_status_changed">Status Changed</SelectItem>
                  <SelectItem value="delay_reported">Delay Reported</SelectItem>
                  <SelectItem value="sla_alert">SLA Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status!}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks, users, details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Entries */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
              <p className="text-gray-600">
                {logs.length === 0 
                  ? "No activity logs yet. Activity will appear here as tasks are created and modified."
                  : "No activity matches your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const ActionIcon = getActionIcon(log.action);
            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">
                            {log.action.replace(/_/g, ' ').toUpperCase()}
                          </h4>
                          <p className="text-sm text-gray-700 mt-1 break-words">
                            {log.details}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {log.status && (
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {getRelativeTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {log.entity_name}
                        </span>
                        {log.client_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {log.client_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(log.timestamp), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>

                      {log.delay_reason && (
                        <Alert className="mt-3 p-2 border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <AlertDescription className="text-xs text-yellow-700 ml-1">
                            <strong>Delay Reason:</strong> {log.delay_reason}
                          </AlertDescription>
                        </Alert>
                      )}

                      {log.changes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <strong>Changes:</strong> {JSON.stringify(log.changes, null, 2).replace(/[{}",]/g, ' ').trim()}
                        </div>
                      )}
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
