import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  MessageCircle,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Reply,
  Target,
} from "lucide-react";
import { formatToIST, formatToISTDateTime, isOverdue } from "@/lib/dateUtils";

interface FollowUp {
  id: number;
  message_id: number;
  step_id: number;
  lead_id: number;
  lead_name: string;
  step_name: string;
  original_message: string;
  assigned_to: string;
  assigned_by: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string;
  created_at: string;
  completed_at?: string;
  notes?: string;
}

// Mock follow-up data
const mockFollowUps: FollowUp[] = [
  {
    id: 13,
    message_id: 2,
    step_id: 1,
    lead_id: 1,
    lead_name: "TechCorp Solutions",
    step_name: "Initial Contact",
    original_message:
      "Client requirements documented and shared with the team. @Mike Johnson please review the technical specifications #13",
    assigned_to: "Mike Johnson",
    assigned_by: "Jane Smith",
    status: "pending",
    priority: "high",
    due_date: "2024-01-25T10:00:00Z",
    created_at: "2024-01-16T14:15:00Z",
    notes: "Need to validate feasibility of custom integration requirements",
  },
  {
    id: 14,
    message_id: 4,
    step_id: 3,
    lead_id: 1,
    lead_name: "TechCorp Solutions",
    step_name: "Document Collection",
    original_message:
      "Working on the proposal. Need technical specifications from the development team. Follow up needed on API documentation #14",
    assigned_to: "John Doe",
    assigned_by: "Jane Smith",
    status: "in_progress",
    priority: "medium",
    due_date: "2024-01-24T15:30:00Z",
    created_at: "2024-01-21T09:00:00Z",
    notes: "API documentation is 70% complete, waiting for security review",
  },
  {
    id: 15,
    message_id: 6,
    step_id: 2,
    lead_id: 2,
    lead_name: "RetailMax Inc",
    step_name: "Proposal Sent",
    original_message:
      "Demo feedback received. Client wants additional reporting features. @Product Team please assess timeline impact #15",
    assigned_to: "Mike Johnson",
    assigned_by: "John Doe",
    status: "completed",
    priority: "medium",
    due_date: "2024-01-20T12:00:00Z",
    created_at: "2024-01-18T11:30:00Z",
    completed_at: "2024-01-19T16:45:00Z",
    notes:
      "Timeline assessment completed - 2 additional weeks needed for reporting features",
  },
  {
    id: 16,
    message_id: 8,
    step_id: 1,
    lead_id: 3,
    lead_name: "FinanceFirst Bank",
    step_name: "Initial Contact",
    original_message:
      "Compliance requirements discussion scheduled. @Legal Team review banking regulations for data handling #16",
    assigned_to: "Jane Smith",
    assigned_by: "Mike Johnson",
    status: "overdue",
    priority: "urgent",
    due_date: "2024-01-22T09:00:00Z",
    created_at: "2024-01-20T14:20:00Z",
    notes: "Banking compliance review is critical for proposal approval",
  },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700",
  urgent: "bg-purple-100 text-purple-700",
};

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  overdue: AlertCircle,
};

export default function FollowUpTracker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(
    null,
  );
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch follow-ups data from API
  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          userId: user?.id || "",
          userRole: user?.role || "",
        });

        const response = await fetch(`/api/follow-ups?${params.toString()}`);
        const data = await response.json();

        // Convert to expected format and ensure IST timestamps
        const formattedFollowUps = data.map((f: any) => ({
          ...f,
          created_at: new Date(f.created_at).toISOString(),
          updated_at: new Date(f.updated_at).toISOString(),
          due_date: f.due_date || new Date().toISOString().split('T')[0],
        }));

        setFollowUps(formattedFollowUps);
      } catch (error) {
        console.error("Failed to fetch follow-ups:", error);
        setFollowUps([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFollowUps();
    }
  }, [user]);

  // Check if we came here to view a specific follow-up ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const followUpId = params.get("id");
    if (followUpId && followUps.length > 0) {
      const followUp = followUps.find((f) => f.id === parseInt(followUpId));
      if (followUp) {
        setSelectedFollowUp(followUp);
      }
    }
  }, [location.search, followUps]);

  const handleNavigateToMessage = (followUp: FollowUp) => {
    // Navigate to the lead details page and scroll to the specific message
    navigate(`/leads/${followUp.lead_id}`, {
      state: {
        scrollToMessage: followUp.message_id,
        highlightMessage: true,
        fromFollowUp: followUp.id,
      },
    });
  };

  const handleUpdateStatus = async (followUpId: number, newStatus: string) => {
    try {
      const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          completed_at: completedAt,
        }),
      });

      if (response.ok) {
        // Update local state
        setFollowUps(prevFollowUps =>
          prevFollowUps.map(f =>
            f.id === followUpId
              ? { ...f, status: newStatus as any, completed_at: completedAt }
              : f
          )
        );
        console.log(`Follow-up ${followUpId} status updated to ${newStatus}`);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update follow-up status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  // Filter follow-ups based on search and filters
  const filteredFollowUps = followUps.filter((followUp) => {
    if (!followUp) return false;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (followUp.lead_name || followUp.lead_client_name || "").toLowerCase().includes(searchLower) ||
      (followUp.step_name || "").toLowerCase().includes(searchLower) ||
      (followUp.assigned_user_name || "").toLowerCase().includes(searchLower) ||
      (followUp.created_by_name || "").toLowerCase().includes(searchLower) ||
      (followUp.title || "").toLowerCase().includes(searchLower) ||
      (followUp.description || "").toLowerCase().includes(searchLower) ||
      (followUp.id || "").toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || followUp.status === statusFilter;
    const matchesAssignee =
      assigneeFilter === "all" || followUp.assigned_user_name === assigneeFilter;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const myFollowUps = filteredFollowUps.filter(
    (f) => f.assigned_user_name === user?.name,
  );
  const assignedByMe = filteredFollowUps.filter(
    (f) => f.created_by_name === user?.name,
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Follow-up Tracker
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage all follow-up tasks from team conversations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {myFollowUps.length} assigned to me
          </Badge>
          <Badge variant="outline" className="text-sm">
            {assignedByMe.length} assigned by me
          </Badge>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {followUps.filter((f) => f.status === "pending").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-900">
                  {
                    followUps.filter((f) => f.status === "in_progress")
                      .length
                  }
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {followUps.filter((f) => f.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-900">
                  {followUps.filter((f) => f.status === "overdue").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by lead, assignee, message content, or follow-up ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                  <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading follow-ups...
              </h3>
            </CardContent>
          </Card>
        ) : filteredFollowUps.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No follow-ups found
              </h3>
              <p className="text-gray-600">
                {searchTerm ||
                statusFilter !== "all" ||
                assigneeFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "Follow-ups will appear here when team members mention specific tasks"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFollowUps.map((followUp) => {
            const StatusIcon = statusIcons[followUp.status];
            const isFollowUpOverdue = followUp.status === "overdue" ||
              (followUp.status !== "completed" && isOverdue(followUp.due_date));
            const isAssignedToMe = followUp.assigned_to === user?.name;

            return (
              <Card
                key={followUp.id}
                className={`hover:shadow-md transition-shadow border-l-4 ${
                  isAssignedToMe
                    ? isFollowUpOverdue
                      ? "border-l-red-500 bg-red-50"
                      : "border-l-blue-500 bg-blue-50"
                    : "border-l-gray-300"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge
                          className="text-lg font-bold cursor-pointer hover:bg-primary hover:text-white transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(`#${followUp.id}`);
                            // Show a brief success message
                          }}
                        >
                          #{followUp.id}
                        </Badge>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {followUp.lead_client_name || followUp.client_name || "Unknown Lead"} • {followUp.title || "Follow-up"}
                        </h3>
                        <Badge className={statusColors[followUp.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {followUp.status.replace("_", " ")}
                        </Badge>
                        <Badge className={priorityColors[followUp.priority]}>
                          {followUp.priority}
                        </Badge>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg mb-3 border-l-4 border-blue-200">
                        <p className="text-sm text-gray-700 italic">
                          "{followUp.original_message}"
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>
                            Assigned to: <strong>{followUp.assigned_to}</strong>
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>By: {followUp.assigned_by}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span
                            className={
                              isFollowUpOverdue ? "text-red-600 font-medium" : ""
                            }
                          >
                            Due: {formatToISTDateTime(followUp.due_date, {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      </div>

                      {followUp.notes && (
                        <div className="bg-yellow-50 p-2 rounded text-sm text-gray-700 mb-3">
                          <strong>Notes:</strong> {followUp.notes}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Created: {formatToIST(followUp.created_at)}
                        </span>
                        {followUp.completed_at && (
                          <span>
                            Completed: {formatToIST(followUp.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigateToMessage(followUp)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Message
                      </Button>

                      {followUp.status !== "completed" && (
                        <Select
                          value={followUp.status}
                          onValueChange={(value) =>
                            handleUpdateStatus(followUp.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/leads/${followUp.lead_id}`)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Go to Lead
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
