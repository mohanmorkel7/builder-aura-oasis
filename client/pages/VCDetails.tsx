import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { DraggableStepsList } from "@/components/DraggableStepsList";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  Plus,
  Target,
  Users,
  MapPin,
  Globe,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Briefcase,
  FileText,
  MessageCircle,
  Hash,
} from "lucide-react";
import { formatToISTDateTime } from "@/lib/dateUtils";

const statusColors = {
  "in-progress": "bg-blue-100 text-blue-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  completed: "bg-purple-100 text-purple-700",
};

const investorCategoryColors = {
  angel: "bg-blue-100 text-blue-700",
  vc: "bg-green-100 text-green-700",
  private_equity: "bg-purple-100 text-purple-700",
  family_office: "bg-orange-100 text-orange-700",
  merchant_banker: "bg-indigo-100 text-indigo-700",
};

export default function VCDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch VC details
  const {
    data: vc,
    isLoading,
    error,
    refetch: refetchVC,
  } = useQuery({
    queryKey: ["vc", id],
    queryFn: () => apiClient.request(`/vc/${id}`),
    enabled: !!id,
    retry: 1,
  });

  // Fetch VC steps
  const {
    data: vcSteps = [],
    isLoading: stepsLoading,
    error: stepsError,
    refetch: refetchSteps,
  } = useQuery({
    queryKey: ["vc-steps", id],
    queryFn: () => apiClient.request(`/vc/${id}/steps`),
    enabled: !!id,
    retry: 1,
  });

  // Fetch VC comments/chat
  const {
    data: vcComments = [],
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["vc-comments", id],
    queryFn: () => apiClient.request(`/vc/${id}/comments`),
    enabled: !!id,
    retry: 1,
  });

  // Mutations
  const createStepMutation = useMutation({
    mutationFn: (stepData: any) =>
      apiClient.request(`/vc/${id}/steps`, {
        method: "POST",
        body: JSON.stringify(stepData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc-steps", id] });
      setIsAddStepOpen(false);
      resetNewStepForm();
    },
  });

  const updateVCStatusMutation = useMutation({
    mutationFn: (status: string) =>
      apiClient.request(`/vc/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc", id] });
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment: string) =>
      apiClient.request(`/vc/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          message: comment,
          created_by: parseInt(user?.id || "1"),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc-comments", id] });
      setNewComment("");
    },
  });

  const reorderStepsMutation = useMutation({
    mutationFn: (stepOrders: Array<{ id: number; order_index: number }>) =>
      apiClient.request(`/vc/${id}/steps/reorder`, {
        method: "PUT",
        body: JSON.stringify({ stepOrders }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc-steps", id] });
    },
  });

  const [newStepForm, setNewStepForm] = useState({
    name: "",
    description: "",
    priority: "medium" as const,
    assigned_to: "",
    due_date: "",
  });

  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [newComment, setNewComment] = useState("");

  const resetNewStepForm = () => {
    setNewStepForm({
      name: "",
      description: "",
      priority: "medium",
      assigned_to: "",
      due_date: "",
    });
  };

  const handleBack = () => {
    navigate("/vc");
  };

  const handleToggleExpansion = (stepId: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      await apiClient.request(`/vc/${id}/steps/${stepId}`, {
        method: "DELETE",
      });
      queryClient.invalidateQueries({ queryKey: ["vc-steps", id] });
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  };

  const handleReorderSteps = (newSteps: any[]) => {
    const stepOrders = newSteps.map((step, index) => ({
      id: step.id,
      order_index: index,
    }));
    reorderStepsMutation.mutate(stepOrders);
  };

  const handleAddStep = () => {
    if (!newStepForm.name.trim()) return;

    createStepMutation.mutate({
      ...newStepForm,
      created_by: parseInt(user?.id || "1"),
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateVCStatusMutation.mutate(newStatus);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "won":
        return <CheckCircle className="w-4 h-4" />;
      case "lost":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <Target className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: string, currency: string = "INR") => {
    if (!amount) return "N/A";
    const symbol = currency === "USD" ? "$" : currency === "AED" ? "د.إ" : "₹";
    return `${symbol}${amount}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !vc) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              VC Opportunity Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The VC opportunity you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to VC Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Parse contacts if they're stored as JSON string
  let contacts = [];
  try {
    contacts = vc.contacts ? JSON.parse(vc.contacts) : [];
  } catch (e) {
    contacts = [];
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to VC Dashboard
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {vc.round_title || "Untitled Round"}
              </h1>
              {vc.vc_id && <Badge variant="secondary">{vc.vc_id}</Badge>}
            </div>
            <p className="text-gray-600 mt-1">
              {vc.investor_name} • {vc.investor_category?.replace("_", " ").toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={vc.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate(`/vc/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Round Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(vc.status)}
                    <Badge
                      className={`${statusColors[vc.status as keyof typeof statusColors]} border-0`}
                    >
                      {vc.status?.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-600">Round Stage</Label>
                    <p className="font-medium">
                      {vc.round_stage ? vc.round_stage.replace("_", " ").toUpperCase() : "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Round Size</Label>
                    <p className="font-medium">
                      {formatCurrency(vc.round_size, vc.billing_currency)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Valuation</Label>
                    <p className="font-medium">
                      {formatCurrency(vc.valuation, vc.billing_currency)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Priority</Label>
                    <Badge variant="outline" className="ml-2">
                      {vc.priority_level?.toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Start Date</Label>
                    <p className="font-medium">
                      {vc.start_date ? formatToISTDateTime(vc.start_date) : "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Target Close</Label>
                    <p className="font-medium">
                      {vc.targeted_end_date ? formatToISTDateTime(vc.targeted_end_date) : "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">SPOC</Label>
                    <p className="font-medium">{vc.spoc || "N/A"}</p>
                  </div>
                </div>
              </div>

              {vc.round_description && (
                <div>
                  <Label className="text-sm text-gray-600">Description</Label>
                  <p className="mt-1 text-gray-900">{vc.round_description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Investor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Investor</Label>
                <p className="font-medium">{vc.investor_name}</p>
                {vc.investor_category && (
                  <Badge
                    className={`${investorCategoryColors[vc.investor_category as keyof typeof investorCategoryColors]} border-0 text-xs mt-1`}
                  >
                    {vc.investor_category.replace("_", " ").toUpperCase()}
                  </Badge>
                )}
              </div>

              <div>
                <Label className="text-sm text-gray-600">Primary Contact</Label>
                <p className="font-medium">{vc.contact_person || "N/A"}</p>
              </div>

              <div className="space-y-2">
                {vc.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${vc.email}`} className="text-blue-600 hover:underline">
                      {vc.email}
                    </a>
                  </div>
                )}
                {vc.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${vc.phone}`} className="text-blue-600 hover:underline">
                      {vc.phone}
                    </a>
                  </div>
                )}
                {vc.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a href={vc.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {vc.website}
                    </a>
                  </div>
                )}
              </div>

              {(vc.address || vc.city || vc.state || vc.country) && (
                <div>
                  <Label className="text-sm text-gray-600">Address</Label>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm">
                      {vc.address && <p>{vc.address}</p>}
                      <p>
                        {[vc.city, vc.state, vc.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Investment Details */}
              <Separator />
              <div>
                <Label className="text-sm text-gray-600">Investment Range</Label>
                <div className="mt-1">
                  {vc.minimum_size && (
                    <p className="text-sm">
                      Min: {formatCurrency(vc.minimum_size.toString(), vc.billing_currency)}
                    </p>
                  )}
                  {vc.maximum_size && (
                    <p className="text-sm">
                      Max: {formatCurrency(vc.maximum_size.toString(), vc.billing_currency)}
                    </p>
                  )}
                  {vc.minimum_arr_requirement && (
                    <p className="text-sm">
                      Min ARR: {formatCurrency(vc.minimum_arr_requirement.toString(), vc.billing_currency)}
                    </p>
                  )}
                </div>
              </div>

              {vc.potential_lead_investor && (
                <div>
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Potential Lead Investor
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Steps Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Round Steps</CardTitle>
              <CardDescription>
                Track the progress of this funding round
              </CardDescription>
            </div>
            <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Step</DialogTitle>
                  <DialogDescription>
                    Create a new step for this VC round.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="step-name">Step Name *</Label>
                    <Input
                      id="step-name"
                      value={newStepForm.name}
                      onChange={(e) =>
                        setNewStepForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Due Diligence Review"
                    />
                  </div>
                  <div>
                    <Label htmlFor="step-description">Description</Label>
                    <Textarea
                      id="step-description"
                      value={newStepForm.description}
                      onChange={(e) =>
                        setNewStepForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe what needs to be done..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="step-priority">Priority</Label>
                      <Select
                        value={newStepForm.priority}
                        onValueChange={(value) =>
                          setNewStepForm((prev) => ({ ...prev, priority: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="step-due-date">Due Date</Label>
                      <Input
                        id="step-due-date"
                        type="date"
                        value={newStepForm.due_date}
                        onChange={(e) =>
                          setNewStepForm((prev) => ({ ...prev, due_date: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddStepOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddStep}
                    disabled={!newStepForm.name.trim() || createStepMutation.isPending}
                  >
                    {createStepMutation.isPending ? "Adding..." : "Add Step"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {stepsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading steps...</p>
            </div>
          ) : (
            <DraggableStepsList
              steps={vcSteps}
              onReorder={handleReorderSteps}
              onStatusChange={(stepId, status) => {
                // Handle step status change
                console.log("Status change:", stepId, status);
              }}
              expandedSteps={expandedSteps}
              onToggleExpansion={handleToggleExpansion}
              onDeleteStep={handleDeleteStep}
              leadId={parseInt(id!)}
            />
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Team Chat & Comments
          </CardTitle>
          <CardDescription>
            Discuss this VC opportunity with your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add Comment */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
              </Button>
            </div>

            <Separator />

            {/* Comments List */}
            <div className="space-y-4">
              {commentsLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <p className="mt-1 text-sm text-gray-600">Loading comments...</p>
                </div>
              ) : vcComments.length > 0 ? (
                vcComments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.created_by_name || `User ${comment.created_by}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatToISTDateTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{comment.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Contacts */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{contact.contact_name || "Unnamed Contact"}</span>
                  </div>
                  {contact.designation && (
                    <p className="text-sm text-gray-600 mb-2">{contact.designation}</p>
                  )}
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <a href={`tel:${contact.phone}`} className="text-xs text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.linkedin && (
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
