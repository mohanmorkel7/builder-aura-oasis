import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Clock,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Calendar,
  User,
  Timer,
  Save,
  X,
  Bell,
  MessageSquare,
  AlertCircle,
  Target,
  Users,
  Activity,
  Filter,
  Building2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow, addHours, addMinutes, isBefore, isAfter } from "date-fns";

// Enhanced interfaces with client integration
interface ClientBasedFinOpsSubTask {
  id: string;
  name: string;
  description?: string;
  start_time: string; // Daily start time (e.g., "05:00")
  order_position: number;
  status: "pending" | "in_progress" | "completed" | "delayed" | "overdue";
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  due_at?: string;
  delay_reason?: string;
  delay_notes?: string;
  alerts_sent?: string[];
}

interface ClientBasedFinOpsTask {
  id: number;
  task_name: string;
  description: string;
  client_id: number;
  client_name: string;
  assigned_to: string;
  reporting_managers: string[];
  escalation_managers: string[];
  effective_from: string;
  duration: "daily" | "weekly" | "monthly";
  is_active: boolean;
  subtasks: ClientBasedFinOpsSubTask[];
  created_at: string;
  updated_at: string;
  created_by: string;
  last_run?: string;
  next_run?: string;
  status: "active" | "inactive" | "completed" | "overdue" | "delayed";
}

// Enhanced Sortable SubTask Component with inline status change
interface SortableSubTaskItemProps {
  subtask: ClientBasedFinOpsSubTask;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onStatusChange?: (subtaskId: string, status: string, delayReason?: string, delayNotes?: string) => void;
  isInline?: boolean;
}

function SortableSubTaskItem({ subtask, index, onUpdate, onRemove, onStatusChange, isInline = false }: SortableSubTaskItemProps) {
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayNotes, setDelayNotes] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStatusChange = (newStatus: string) => {
    if (isInline && onStatusChange) {
      if (newStatus === "delayed") {
        setShowDelayDialog(true);
      } else {
        onStatusChange(subtask.id, newStatus);
      }
    } else {
      onUpdate(index, 'status', newStatus);
    }
  };

  const handleDelaySubmit = () => {
    if (isInline && onStatusChange) {
      onStatusChange(subtask.id, "delayed", delayReason, delayNotes);
    }
    setShowDelayDialog(false);
    setDelayReason("");
    setDelayNotes("");
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-start gap-3">
          {!isInline && (
            <div {...attributes} {...listeners} className="mt-2 cursor-grab">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          )}

          <div className="flex-1 space-y-3">
            {isInline ? (
              // Inline view for task management
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm break-words whitespace-pre-wrap">{subtask.name}</h4>
                    {subtask.description && (
                      <p className="text-xs text-gray-600 mt-1 break-words whitespace-pre-wrap">{subtask.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>Start: {subtask.start_time}</span>
                      {subtask.started_at && (
                        <span>Started: {format(new Date(subtask.started_at), "h:mm a")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Select value={subtask.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Show delay information if present */}
                {subtask.status === "delayed" && subtask.delay_reason && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Delayed</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      <div><strong>Reason:</strong> {subtask.delay_reason}</div>
                      {subtask.delay_notes && <div><strong>Notes:</strong> {subtask.delay_notes}</div>}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              // Form view for add/edit
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Subtask Name *</Label>
                  <Input
                    value={subtask.name || ''}
                    onChange={(e) => onUpdate(index, 'name', e.target.value)}
                    placeholder="e.g., RBL DUMP VS TCP DATA (DAILY ALERT MAIL)"
                    required
                  />
                </div>

                <div>
                  <Label>Daily Start Time *</Label>
                  <Input
                    type="time"
                    value={subtask.start_time || ''}
                    onChange={(e) => onUpdate(index, 'start_time', e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={subtask.description || ''}
                    onChange={(e) => onUpdate(index, 'description', e.target.value)}
                    placeholder="Additional details about this subtask..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={subtask.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {!isInline && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Delay Reason Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Delayed</DialogTitle>
            <DialogDescription>
              Please provide a reason for the delay. This will trigger notifications to reporting managers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Delay Reason *</Label>
              <Select value={delayReason} onValueChange={setDelayReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delay reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical_issue">Technical Issue</SelectItem>
                  <SelectItem value="data_unavailable">Data Unavailable</SelectItem>
                  <SelectItem value="external_dependency">External Dependency</SelectItem>
                  <SelectItem value="resource_constraint">Resource Constraint</SelectItem>
                  <SelectItem value="process_change">Process Change</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={delayNotes}
                onChange={(e) => setDelayNotes(e.target.value)}
                placeholder="Provide additional context about the delay..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelaySubmit} disabled={!delayReason}>
              Mark as Delayed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ClientBasedFinOpsTaskManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClientBasedFinOpsTask | null>(null);

  // Filter states
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [viewMode, setViewMode] = useState<"all" | "daily">("daily");

  // Show more/less states for subtasks
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  // Real-time timer state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form state for creating/editing tasks
  const [taskForm, setTaskForm] = useState({
    task_name: "",
    description: "",
    client_id: "",
    assigned_to: "",
    reporting_managers: [] as string[],
    escalation_managers: [] as string[],
    effective_from: new Date().toISOString().split('T')[0],
    duration: "daily" as "daily" | "weekly" | "monthly",
    is_active: true,
    subtasks: [] as ClientBasedFinOpsSubTask[],
  });

  // Fetch FinOps tasks
  const { data: finopsTasks = [], isLoading } = useQuery({
    queryKey: ["client-finops-tasks"],
    queryFn: () => apiClient.getFinOpsTasks(),
    refetchInterval: 30000,
  });

  // Real-time updates for SLA warnings
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch clients (from leads)
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      try {
        // Try to get from leads API first
        const leads = await apiClient.getLeads();
        console.log("Leads data:", leads);

        if (!leads || leads.length === 0) {
          console.log("No leads found, trying clients API");
          return await apiClient.getClients();
        }

        const uniqueClients = leads.reduce((acc: any[], lead: any) => {
          // Check multiple properties for client/company name
          const clientName = lead.company_name || lead.client_name || lead.company || lead.name;

          if (clientName && !acc.find(c => c.company_name === clientName)) {
            acc.push({
              id: lead.id,
              company_name: clientName,
              client_name: lead.client_name || clientName,
              // Keep original lead data for reference
              lead_data: lead
            });
          }
          return acc;
        }, []);

        console.log("Processed clients from leads:", uniqueClients);
        return uniqueClients.length > 0 ? uniqueClients : await apiClient.getClients();

      } catch (error) {
        console.error("Error fetching from leads API:", error);
        // Fallback to clients API
        try {
          const clientsData = await apiClient.getClients();
          console.log("Fallback clients data:", clientsData);
          return clientsData;
        } catch (fallbackError) {
          console.error("Both APIs failed:", fallbackError);
          // Return mock data for development
          return [
            { id: 1, company_name: "Sample Client 1", client_name: "Sample Client 1" },
            { id: 2, company_name: "Sample Client 2", client_name: "Sample Client 2" },
            { id: 3, company_name: "Sample Client 3", client_name: "Sample Client 3" }
          ];
        }
      }
    },
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.getUsers(),
  });

  // Mutations for CRUD operations
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiClient.createFinOpsTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-finops-tasks"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }: { id: number; taskData: any }) =>
      apiClient.updateFinOpsTask(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-finops-tasks"] });
      setEditingTask(null);
      resetForm();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteFinOpsTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-finops-tasks"] });
    },
  });

  const updateSubTaskMutation = useMutation({
    mutationFn: ({ taskId, subTaskId, status, userName, delayReason, delayNotes }: { 
      taskId: number; 
      subTaskId: string; 
      status: string;
      userName?: string;
      delayReason?: string;
      delayNotes?: string;
    }) => apiClient.updateFinOpsSubTask(taskId, subTaskId, status, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-finops-tasks"] });
    },
  });

  const resetForm = () => {
    setTaskForm({
      task_name: "",
      description: "",
      client_id: "",
      assigned_to: "",
      reporting_managers: [],
      escalation_managers: [],
      effective_from: new Date().toISOString().split('T')[0],
      duration: "daily",
      is_active: true,
      subtasks: [],
    });
  };

  const addSubTask = () => {
    const newSubTask: ClientBasedFinOpsSubTask = {
      id: Date.now().toString(),
      name: "",
      description: "",
      start_time: "05:00",
      order_position: taskForm.subtasks.length,
      status: "pending",
    };
    setTaskForm(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, newSubTask],
    }));
  };

  const updateSubTask = (index: number, field: string, value: any) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask, i) =>
        i === index ? { ...subtask, [field]: value } : subtask
      ),
    }));
  };

  const removeSubTask = (index: number) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }));
  };

  const handleInlineSubTaskStatusChange = (taskId: number, subtaskId: string, status: string, delayReason?: string, delayNotes?: string) => {
    updateSubTaskMutation.mutate({
      taskId,
      subTaskId: subtaskId,
      status,
      userName: user?.first_name + " " + user?.last_name,
      delayReason,
      delayNotes,
    });
  };

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getTimeSinceStart = (startTime: string) => {
    if (!startTime || typeof startTime !== 'string') return 'N/A';

    const [hours, minutes] = startTime.split(':').map(Number);
    const taskStartTime = new Date();
    taskStartTime.setHours(hours, minutes, 0, 0);

    const diffMs = currentTime.getTime() - taskStartTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 0) {
      const remaining = Math.abs(diffMinutes);
      return `Starts in ${remaining} min`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ${diffMinutes % 60}m ago`;
    }
  };

  const getSLAWarning = (startTime: string, status: string) => {
    if (status === "completed" || !startTime || typeof startTime !== 'string') return null;

    const [hours, minutes] = startTime.split(':').map(Number);
    const taskStartTime = new Date();
    taskStartTime.setHours(hours, minutes, 0, 0);

    // Add 15 minutes SLA buffer
    const slaDeadline = new Date(taskStartTime.getTime() + 15 * 60 * 1000);
    const diffMs = slaDeadline.getTime() - currentTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes <= 0) {
      return { type: "overdue", message: `Overdue by ${Math.abs(diffMinutes)} min` };
    } else if (diffMinutes <= 15) {
      return { type: "warning", message: `SLA Warning - ${diffMinutes} min remaining` };
    }

    return null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTaskForm(prev => {
        const oldIndex = prev.subtasks.findIndex(item => item.id === active.id);
        const newIndex = prev.subtasks.findIndex(item => item.id === over?.id);

        const reorderedSubtasks = arrayMove(prev.subtasks, oldIndex, newIndex);

        const updatedItems = reorderedSubtasks.map((item, index) => ({
          ...item,
          order_position: index,
        }));

        return { ...prev, subtasks: updatedItems };
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClientData = clients.find((c: any) => c.id.toString() === taskForm.client_id);
    
    const taskData = {
      ...taskForm,
      client_name: selectedClientData?.company_name || "",
      created_by: user?.id || 1,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const startEditing = (task: ClientBasedFinOpsTask) => {
    setEditingTask(task);
    setTaskForm({
      task_name: task.task_name || "",
      description: task.description || "",
      client_id: task.client_id?.toString() || "",
      assigned_to: task.assigned_to || "",
      reporting_managers: task.reporting_managers || [],
      escalation_managers: task.escalation_managers || [],
      effective_from: task.effective_from || new Date().toISOString().split('T')[0],
      duration: task.duration || "daily",
      is_active: task.is_active ?? true,
      subtasks: (task.subtasks || []).map(subtask => ({
        ...subtask,
        name: subtask.name || "",
        description: subtask.description || "",
        start_time: subtask.start_time || "05:00",
      })),
    });
    setIsCreateDialogOpen(true);
  };

  // Filter tasks based on client, status, search, and date
  const filteredTasks = finopsTasks.filter((task: ClientBasedFinOpsTask) => {
    // Client filter
    if (selectedClient !== "all") {
      if (selectedClient === "unknown") {
        if (task.client_id && task.client_name && task.client_name !== "Unknown Client") return false;
      } else {
        if (task.client_id?.toString() !== selectedClient) return false;
      }
    }

    // Status filter
    if (statusFilter !== "all" && task.status !== statusFilter) return false;

    // Search filter
    if (searchTerm && !task.task_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.client_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    // Date filter for daily tasks (always enabled)
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const taskDate = new Date(task.effective_from);

      // For daily tasks, check if task should run on the selected date
      if (task.duration === "daily") {
        if (taskDate > filterDate) return false; // Task hasn't started yet
      } else {
        // For non-daily tasks, just check if the date matches
        if (taskDate.toDateString() !== filterDate.toDateString()) return false;
      }
    }

    return true;
  });

  // Calculate summary statistics
  const getOverallSummary = () => {
    const summary = {
      total_tasks: filteredTasks.length,
      total_subtasks: 0,
      completed_tasks: 0,
      delayed_tasks: 0,
      overdue_tasks: 0,
      completed_subtasks: 0,
      delayed_subtasks: 0,
      overdue_subtasks: 0,
    };

    filteredTasks.forEach((task: ClientBasedFinOpsTask) => {
      summary.total_subtasks += task.subtasks?.length || 0;
      if (task.status === 'completed') summary.completed_tasks++;
      if (task.status === 'delayed') summary.delayed_tasks++;
      if (task.status === 'overdue') summary.overdue_tasks++;
      
      task.subtasks?.forEach(subtask => {
        if (subtask.status === 'completed') summary.completed_subtasks++;
        if (subtask.status === 'delayed') summary.delayed_subtasks++;
        if (subtask.status === 'overdue') summary.overdue_subtasks++;
      });
    });

    return summary;
  };

  // Get client-wise summary
  const getClientSummary = () => {
    const clientSummary: { [key: string]: any } = {};

    filteredTasks.forEach((task: ClientBasedFinOpsTask) => {
      // Only show clients that have actual client names, skip "Unknown Client"
      if (!task.client_name || task.client_name === "Unknown Client") return;

      const clientName = task.client_name;
      if (!clientSummary[clientName]) {
        clientSummary[clientName] = {
          total_tasks: 0,
          total_subtasks: 0,
          completed_subtasks: 0,
          delayed_subtasks: 0,
          overdue_subtasks: 0,
        };
      }

      clientSummary[clientName].total_tasks++;
      clientSummary[clientName].total_subtasks += task.subtasks?.length || 0;

      task.subtasks?.forEach(subtask => {
        if (subtask.status === 'completed') clientSummary[clientName].completed_subtasks++;
        if (subtask.status === 'delayed') clientSummary[clientName].delayed_subtasks++;
        if (subtask.status === 'overdue') clientSummary[clientName].overdue_subtasks++;
      });
    });

    return clientSummary;
  };

  const overallSummary = getOverallSummary();
  const clientSummary = getClientSummary();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in_progress":
        return PlayCircle;
      case "delayed":
        return Clock;
      case "overdue":
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
      case "delayed":
        return "text-yellow-600 bg-yellow-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Summary Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              FinOps Daily Process - {format(new Date(dateFilter), "MMM d, yyyy")}
            </h2>
            <p className="text-gray-600 mt-1">
              Daily process tracking and task execution monitoring for the selected date
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{overallSummary.total_tasks}</div>
              <div className="text-xs text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{overallSummary.total_subtasks}</div>
              <div className="text-xs text-gray-600">Total Subtasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{overallSummary.completed_subtasks}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{overallSummary.delayed_subtasks}</div>
              <div className="text-xs text-gray-600">Delayed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{overallSummary.overdue_subtasks}</div>
              <div className="text-xs text-gray-600">Overdue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(clientSummary).length}</div>
              <div className="text-xs text-gray-600">Active Clients</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[150px]">
              <Label>Date</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="font-medium"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>Search Tasks</Label>
              <Input
                placeholder="Search by task name or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="min-w-[150px]">
              <Label>Filter by Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.length > 0 ? (
                    clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.company_name || client.client_name || `Client ${client.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-clients" disabled>
                      No clients available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label>Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client-wise Summary */}
      {Object.keys(clientSummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Daily Process Summary by Client
              <Badge variant="outline" className="ml-2">
                {format(new Date(dateFilter), "MMM d, yyyy")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(clientSummary).map(([clientName, summary]: [string, any]) => (
                <div key={clientName} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-sm mb-2">{clientName}</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{summary.total_tasks}</div>
                      <div className="text-xs text-gray-600">Tasks</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{summary.completed_subtasks}</div>
                      <div className="text-xs text-gray-600">Done</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">{summary.delayed_subtasks}</div>
                      <div className="text-xs text-gray-600">Delayed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{summary.overdue_subtasks}</div>
                      <div className="text-xs text-gray-600">Overdue</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading tasks...</p>
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Found</h3>
              <p className="text-gray-600 mb-4">
                {finopsTasks.length === 0 
                  ? "Create your first task to get started."
                  : "No tasks match your current filters."}
              </p>
              {finopsTasks.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task: ClientBasedFinOpsTask) => {
            const completedSubtasks = task.subtasks?.filter(st => st.status === "completed").length || 0;
            const totalSubtasks = task.subtasks?.length || 0;
            const delayedSubtasks = task.subtasks?.filter(st => st.status === "delayed").length || 0;
            const overdueSubtasks = task.subtasks?.filter(st => st.status === "overdue").length || 0;
            
            const taskStatus = overdueSubtasks > 0 ? "overdue" : 
                             delayedSubtasks > 0 ? "delayed" :
                             completedSubtasks === totalSubtasks && totalSubtasks > 0 ? "completed" :
                             completedSubtasks > 0 ? "in_progress" : "pending";
            const StatusIcon = getStatusIcon(taskStatus);

            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg break-words">{task.task_name}</CardTitle>
                        {task.client_name && task.client_name !== "Unknown Client" && (
                          <Badge variant="outline" className="text-blue-600">
                            {task.client_name}
                          </Badge>
                        )}
                        <Badge variant={task.is_active ? "default" : "secondary"}>
                          {task.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className={getStatusColor(taskStatus)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1).replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription className="break-words whitespace-pre-wrap">{task.description}</CardDescription>
                      
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Assigned: {task.assigned_to}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{task.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span>{completedSubtasks}/{totalSubtasks} completed</span>
                        </div>
                        {task.duration === "daily" && (
                          <div className="flex items-center gap-1">
                            <Timer className="w-4 h-4" />
                            <span>
                              {task.subtasks && task.subtasks.length > 0
                                ? (() => {
                                    const subtasksWithTime = task.subtasks.filter(st => st.start_time);
                                    if (subtasksWithTime.length === 0) return "No schedule set";
                                    const sorted = subtasksWithTime.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
                                    return `Starts: ${sorted[0].start_time}`;
                                  })()
                                : "No schedule set"
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(task)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${task.task_name}"?`)) {
                            deleteTaskMutation.mutate(task.id);
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Inline Subtasks Management */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Subtasks ({completedSubtasks}/{totalSubtasks} completed)
                        </h4>
                        {task.subtasks.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTaskExpansion(task.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {expandedTasks.has(task.id) ? "Show Less" : "Show More"}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const inProgressSubtasks = task.subtasks.filter(st => st.status === "in_progress");
                          const otherSubtasks = task.subtasks.filter(st => st.status !== "in_progress");
                          const isExpanded = expandedTasks.has(task.id);

                          // Always show in-progress subtasks
                          let subtasksToShow = [...inProgressSubtasks];

                          if (isExpanded) {
                            // Show all subtasks when expanded
                            subtasksToShow = task.subtasks;
                          } else {
                            // Show in-progress + up to 2 others
                            subtasksToShow = [...inProgressSubtasks, ...otherSubtasks.slice(0, Math.max(0, 3 - inProgressSubtasks.length))];
                          }

                          return subtasksToShow.map((subtask) => {
                            const slaWarning = getSLAWarning(subtask.start_time, subtask.status);
                            return (
                              <div key={subtask.id}>
                                <SortableSubTaskItem
                                  subtask={subtask}
                                  index={0}
                                  onUpdate={() => {}}
                                  onRemove={() => {}}
                                  onStatusChange={(subtaskId, status, delayReason, delayNotes) =>
                                    handleInlineSubTaskStatusChange(task.id, subtaskId, status, delayReason, delayNotes)
                                  }
                                  isInline={true}
                                />
                                {slaWarning && (
                                  <Alert className={`mt-2 p-2 ${
                                    slaWarning.type === "overdue" ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"
                                  }`}>
                                    <Clock className={`h-3 w-3 ${
                                      slaWarning.type === "overdue" ? "text-red-600" : "text-orange-600"
                                    }`} />
                                    <AlertDescription className={`text-xs ml-1 ${
                                      slaWarning.type === "overdue" ? "text-red-700" : "text-orange-700"
                                    }`}>
                                      {slaWarning.message} • {getTimeSinceStart(subtask.start_time)}
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            );
                          });
                        })()}

                        {!expandedTasks.has(task.id) && task.subtasks.length > 3 && (
                          <div className="text-center py-2">
                            <span className="text-sm text-gray-500">
                              {task.subtasks.length - Math.min(3, task.subtasks.filter(st => st.status === "in_progress").length + Math.max(0, 3 - task.subtasks.filter(st => st.status === "in_progress").length))} more subtasks hidden
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setEditingTask(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit FinOps Task" : "Create New FinOps Task"}
            </DialogTitle>
            <DialogDescription>
              Configure client-based FinOps processes with comprehensive tracking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task_name">Task Name *</Label>
                <Input
                  id="task_name"
                  value={taskForm.task_name}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, task_name: e.target.value }))}
                  placeholder="e.g., CLEARING - FILE TRANSFER AND VALIDATION"
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={taskForm.client_id}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, client_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading clients...
                      </SelectItem>
                    ) : clients.length > 0 ? (
                      clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.company_name || client.client_name || `Client ${client.id}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-clients" disabled>
                        No clients available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!clientsLoading && clients.length === 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-red-600">
                      No clients found. Clients are automatically loaded from leads.
                    </p>
                    {clientsError && (
                      <p className="text-xs text-gray-500 mt-1">
                        Error: {clientsError.message}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["clients"] });
                      }}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh Clients
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="duration">Duration *</Label>
                <Select
                  value={taskForm.duration}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, duration: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assigned_to">Assigned To *</Label>
                <Select
                  value={taskForm.assigned_to}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={`${user.first_name} ${user.last_name}`}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., clearing daily steps for file transfer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="effective_from">Effective From *</Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={taskForm.effective_from}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, effective_from: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={taskForm.is_active}
                  onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Task is active</Label>
              </div>
            </div>

            {/* Team Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Team & Escalation</h3>
              
              <div>
                <Label>Reporting Managers</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !taskForm.reporting_managers.includes(value)) {
                        setTaskForm(prev => ({
                          ...prev,
                          reporting_managers: [...prev.reporting_managers, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reporting manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={`${user.first_name} ${user.last_name}`}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {taskForm.reporting_managers.map((manager, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {manager}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setTaskForm(prev => ({
                          ...prev,
                          reporting_managers: prev.reporting_managers.filter((_, i) => i !== index)
                        }))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Escalation Managers</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !taskForm.escalation_managers.includes(value)) {
                        setTaskForm(prev => ({
                          ...prev,
                          escalation_managers: [...prev.escalation_managers, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select escalation manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={`${user.first_name} ${user.last_name}`}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {taskForm.escalation_managers.map((manager, index) => (
                    <Badge key={index} variant="destructive" className="gap-1">
                      {manager}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setTaskForm(prev => ({
                          ...prev,
                          escalation_managers: prev.escalation_managers.filter((_, i) => i !== index)
                        }))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Subtasks without SLA Hours/Minutes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Subtasks</h3>
                <Button type="button" onClick={addSubTask} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subtask
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={taskForm.subtasks.map(st => st.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {taskForm.subtasks.map((subtask, index) => (
                      <SortableSubTaskItem
                        key={subtask.id}
                        subtask={subtask}
                        index={index}
                        onUpdate={updateSubTask}
                        onRemove={removeSubTask}
                        isInline={false}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {taskForm.subtasks.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Timer className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No subtasks added yet</p>
                  <p className="text-sm">Add subtasks to break down your process</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending || updateTaskMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {editingTask ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
