import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useClient,
  useClientOnboardingSteps,
  useCreateOnboardingStep,
  useUpdateOnboardingStep,
  useDeleteOnboardingStep,
  useStepDocuments,
  useUploadStepDocument,
  useStepComments,
  useCreateStepComment
} from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  MessageCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  Download,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import { StepItem } from "@/components/StepItem";

const statusColors = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  onboarding: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

// Mock follow-up data
const mockFollowUps = [
  {
    id: 1,
    description: "Follow up on missing tax documents",
    due_date: "2024-07-15",
    status: "overdue",
    assigned_to: "Jane Smith",
  },
  {
    id: 2,
    description: "Schedule follow-up call for contract review",
    due_date: "2024-07-10",
    status: "overdue",
    assigned_to: "Jane Smith",
  },
  {
    id: 3,
    description: "Send welcome packet",
    due_date: "2024-07-20",
    status: "pending",
    assigned_to: "Jane Smith",
  },
  {
    id: 4,
    description: "Confirm initial setup requirements",
    due_date: "2024-07-25",
    status: "upcoming",
    assigned_to: "Jane Smith",
  },
];



export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientId = parseInt(id || "0");

  const { data: client, isLoading, error } = useClient(clientId);
  const { data: onboardingSteps = [], isLoading: stepsLoading } = useClientOnboardingSteps(clientId);

  // Mutations
  const createStepMutation = useCreateOnboardingStep();
  const updateStepMutation = useUpdateOnboardingStep();
  const deleteStepMutation = useDeleteOnboardingStep();
  const uploadDocumentMutation = useUploadStepDocument();
  const createCommentMutation = useCreateStepComment();

  // UI State
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [newStepDialog, setNewStepDialog] = useState(false);
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    estimated_days: 1,
    due_date: ""
  });
  const [newComment, setNewComment] = useState<{[key: number]: string}>({});
  const [stepDocuments, setStepDocuments] = useState<{[key: number]: any[]}>({});
  const [stepComments, setStepComments] = useState<{[key: number]: any[]}>({});

  const handleBack = () => {
    navigate("/sales");
  };

  const handleEdit = () => {
    navigate(`/sales/client/${id}/edit`);
  };

  const handleAddFollowUp = () => {
    navigate(`/sales/client/${id}/followup/new`);
  };

  const updateStepStatus = async (stepId: number, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completed_date = new Date().toISOString().split("T")[0];
      }
      await updateStepMutation.mutateAsync({ stepId, stepData: updateData });
    } catch (error) {
      console.error("Failed to update step status:", error);
    }
  };

  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const handleAddStep = async () => {
    if (newStep.name.trim() && newStep.description.trim()) {
      try {
        await createStepMutation.mutateAsync({
          clientId,
          stepData: newStep
        });
        setNewStep({ name: "", description: "", estimated_days: 1, due_date: "" });
        setNewStepDialog(false);
      } catch (error) {
        console.error("Failed to create step:", error);
      }
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      await deleteStepMutation.mutateAsync(stepId);
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  };

  const handleAddComment = async (stepId: number) => {
    const comment = newComment[stepId]?.trim();
    if (!comment || !user) return;

    try {
      await createCommentMutation.mutateAsync({
        stepId,
        commentData: {
          message: comment,
          user_name: `${user.first_name} ${user.last_name}`,
          user_id: parseInt(user.id),
          comment_type: "note"
        }
      });
      setNewComment(prev => ({ ...prev, [stepId]: "" }));
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleFileUpload = async (stepId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];

    try {
      // In a real implementation, you'd upload the file to a server/cloud storage
      // For now, we'll simulate the file upload
      const documentData = {
        name: file.name,
        file_path: `/uploads/${file.name}`,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: `${user.first_name} ${user.last_name}`
      };

      await uploadDocumentMutation.mutateAsync({ stepId, documentData });

      // Reset input
      event.target.value = "";
    } catch (error) {
      console.error("Failed to upload document:", error);
    }
  };

  if (isLoading || stepsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading client details...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading client details
        </div>
      </div>
    );
  }

  const clientData = client as any;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {clientData.client_name}
            </h1>
            <p className="text-gray-600 mt-1">
              Client Details & Custom Onboarding Workflow
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleAddFollowUp}>
            <Calendar className="w-4 h-4 mr-2" />
            Add Follow-up
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Client Information */}
        <div className="lg:col-span-3 space-y-6">
          {/* Client Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Client Overview</CardTitle>
              <CardDescription>
                Basic client information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Client Name:
                      </span>
                      <span className="text-gray-900">
                        {clientData.client_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">Status:</span>
                      <Badge className={statusColors[clientData.status]}>
                        {clientData.status.charAt(0).toUpperCase() +
                          clientData.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Priority:
                      </span>
                      <Badge className={priorityColors[clientData.priority]}>
                        {clientData.priority.charAt(0).toUpperCase() +
                          clientData.priority.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Industry:
                      </span>
                      <span className="text-gray-900">
                        {clientData.industry || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Company Size:
                      </span>
                      <span className="text-gray-900">
                        {clientData.company_size || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Contact Person:
                      </span>
                      <span className="text-gray-900">
                        {clientData.contact_person}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Email:</span>
                      <a
                        href={`mailto:${clientData.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {clientData.email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span className="text-gray-900">
                        {clientData.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Expected Value:
                      </span>
                      <span className="text-gray-900">
                        {clientData.expected_value
                          ? `$${clientData.expected_value.toLocaleString()}`
                          : "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Start Date:
                      </span>
                      <span className="text-gray-900">
                        {clientData.start_date
                          ? new Date(clientData.start_date).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {clientData.address && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Address:
                      </span>
                    </div>
                    <div className="pl-6 text-gray-900">
                      <div>{clientData.address}</div>
                      <div>
                        {clientData.city}, {clientData.state}{" "}
                        {clientData.zip_code}
                      </div>
                      <div>{clientData.country}</div>
                    </div>
                  </div>
                </>
              )}

              {clientData.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Notes:</span>
                    </div>
                    <div className="pl-6 text-gray-900 whitespace-pre-wrap">
                      {clientData.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Custom Onboarding Workflow */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Onboarding Workflow</CardTitle>
                  <CardDescription>
                    Manage client-specific onboarding steps, documents, and communication
                  </CardDescription>
                </div>
                <Dialog open={newStepDialog} onOpenChange={setNewStepDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Onboarding Step</DialogTitle>
                      <DialogDescription>
                        Create a custom step for this client's onboarding process
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="stepName">Step Name</Label>
                        <Input
                          id="stepName"
                          value={newStep.name}
                          onChange={(e) => setNewStep(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Technical Setup"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stepDescription">Description</Label>
                        <Textarea
                          id="stepDescription"
                          value={newStep.description}
                          onChange={(e) => setNewStep(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what needs to be done in this step"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="estimatedDays">Estimated Days</Label>
                          <Input
                            id="estimatedDays"
                            type="number"
                            min="1"
                            value={newStep.estimated_days}
                            onChange={(e) => setNewStep(prev => ({ ...prev, estimated_days: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newStep.due_date}
                            onChange={(e) => setNewStep(prev => ({ ...prev, due_date: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewStepDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddStep}>Add Step</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboardingSteps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg">
                    <Collapsible
                      open={expandedSteps.includes(step.id)}
                      onOpenChange={() => toggleStepExpansion(step.id)}
                    >
                      <div className="flex items-center space-x-4 p-4">
                        <div className="flex-shrink-0">
                          {step.status === "completed" ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : step.status === "in_progress" ? (
                            <Clock className="w-6 h-6 text-blue-600" />
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                        <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {step.name}
                              </span>
                              <div className="flex items-center space-x-2">
                                {step.documents.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {step.documents.length} doc{step.documents.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {step.comments.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {step.comments.length} comment{step.comments.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {step.description}
                            </div>
                            <div className="text-sm text-gray-600">
                              {step.status === "completed" &&
                                step.completed_date &&
                                `Completed on ${new Date(step.completed_date).toLocaleDateString()}`}
                              {step.status !== "completed" &&
                                step.due_date &&
                                `Due: ${new Date(step.due_date).toLocaleDateString()}`}
                            </div>
                          </div>
                          {expandedSteps.includes(step.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </CollapsibleTrigger>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={step.status}
                            onValueChange={(value) => updateStepStatus(index, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStep(step.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 border-t bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                            {/* Documents Section */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">Documents</h4>
                                <div>
                                  <input
                                    type="file"
                                    id={`file-upload-${step.id}`}
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(step.id, e)}
                                    multiple
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => document.getElementById(`file-upload-${step.id}`)?.click()}
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {step.documents.length === 0 ? (
                                  <p className="text-sm text-gray-500 text-center py-4">
                                    No documents uploaded yet
                                  </p>
                                ) : (
                                  step.documents.map((doc) => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center justify-between p-2 bg-white rounded border"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {doc.name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {doc.size} • {doc.uploaded_by} • {doc.uploaded_at}
                                          </div>
                                        </div>
                                      </div>
                                      <Button size="sm" variant="ghost">
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Comments Section */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">Comments</h4>
                                <MessageCircle className="w-4 h-4 text-gray-400" />
                              </div>
                              <div className="space-y-3">
                                {step.comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="p-3 bg-white rounded border"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        {comment.user}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {comment.timestamp}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.message}</p>
                                    {comment.type === "system" && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        System
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                                {step.comments.length === 0 && (
                                  <p className="text-sm text-gray-500 text-center py-4">
                                    No comments yet
                                  </p>
                                )}
                                <div className="flex space-x-2">
                                  <Input
                                    placeholder="Add a comment..."
                                    value={newComment[step.id] || ""}
                                    onChange={(e) => setNewComment(prev => ({ ...prev, [step.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment(step.id);
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddComment(step.id)}
                                    disabled={!newComment[step.id]?.trim()}
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Follow-up Tracker */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Tracker</CardTitle>
              <CardDescription>Manage client follow-up tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFollowUps.map((followUp) => (
                  <div key={followUp.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {followUp.description}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Due:{" "}
                          {new Date(followUp.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          followUp.status === "overdue"
                            ? "bg-red-100 text-red-700"
                            : followUp.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                        }
                      >
                        {followUp.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Assigned to: {followUp.assigned_to}
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      </div>
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
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Building className="w-4 h-4 mr-2" />
                View Company Profile
              </Button>
              <Separator />
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Workflow Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
