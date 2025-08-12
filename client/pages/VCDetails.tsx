import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useLead,
  useLeadSteps,
  useCreateLeadStep,
  useReorderLeadSteps,
  useTemplate,
} from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { formatToISTDateTime } from "@/lib/dateUtils";

export default function VCDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Using lead hooks for now - will update with VC-specific hooks later
  const {
    data: vc,
    isLoading,
    error,
    refetch: refetchVC,
  } = useLead(parseInt(id!));

  const {
    data: vcSteps = [],
    isLoading: stepsLoading,
    error: stepsError,
    refetch: refetchSteps,
  } = useLeadSteps(parseInt(id!));

  const createStepMutation = useCreateLeadStep();
  const reorderStepsMutation = useReorderLeadSteps();

  const [newStepForm, setNewStepForm] = useState({
    name: "",
    description: "",
    priority: "medium" as const,
    assigned_to: "",
    due_date: "",
  });

  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const handleBack = () => {
    navigate("/vc");
  };

  const handleEdit = () => {
    navigate(`/vc/${id}/edit`);
  };

  const handleCreateStep = async () => {
    if (!newStepForm.name.trim()) return;

    try {
      const stepData = {
        lead_id: parseInt(id!),
        name: newStepForm.name,
        description: newStepForm.description,
        status: "pending" as const,
        priority: newStepForm.priority,
        assigned_to: newStepForm.assigned_to ? parseInt(newStepForm.assigned_to) : null,
        due_date: newStepForm.due_date || null,
        created_by: parseInt(user.id),
      };

      await createStepMutation.mutateAsync(stepData);
      refetchSteps();
      setIsAddStepOpen(false);
      setNewStepForm({
        name: "",
        description: "",
        priority: "medium",
        assigned_to: "",
        due_date: "",
      });
    } catch (error) {
      console.error("Failed to create step:", error);
      alert("Failed to create step. Please try again.");
    }
  };

  const handleReorderSteps = async (reorderedSteps: any[]) => {
    try {
      const stepOrders = reorderedSteps.map((step, index) => ({
        id: step.id,
        order_index: index,
      }));

      await reorderStepsMutation.mutateAsync({
        leadId: parseInt(id!),
        stepOrders,
      });

      refetchSteps();
    } catch (error) {
      console.error("Failed to reorder steps:", error);
    }
  };

  const handleToggleExpansion = (stepId: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      // For now, we'll use the same delete logic as leads
      // This should be updated to use VC-specific step deletion when available
      await fetch(`/api/leads/steps/${stepId}`, {
        method: "DELETE",
      });
      refetchSteps();
    } catch (error) {
      console.error("Failed to delete step:", error);
      alert("Failed to delete step. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "won":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Won
          </Badge>
        );
      case "lost":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Lost
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "medium":
        return <Badge variant="outline">Medium Priority</Badge>;
      case "low":
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">Loading VC details...</div>
      </div>
    );
  }

  if (error || !vc) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          Error loading VC details. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to VC Dashboard
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {vc.project_title || "Untitled Round"}
              </h1>
              {getStatusBadge(vc.status)}
              {vc.priority_level && getPriorityBadge(vc.priority_level)}
            </div>
            <p className="text-gray-600">VC ID: {vc.lead_id}</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit VC
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Round Information */}
          <Card>
            <CardHeader>
              <CardTitle>Round Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vc.project_description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-gray-900">{vc.project_description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vc.start_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                      <p className="text-gray-900">
                        {new Date(vc.start_date).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {vc.targeted_end_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Target Close Date</Label>
                      <p className="text-gray-900">
                        {new Date(vc.targeted_end_date).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {vc.spoc && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="text-sm font-medium text-gray-500">SPOC</Label>
                      <p className="text-gray-900">{vc.spoc}</p>
                    </div>
                  </div>
                )}

                {vc.billing_currency && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Currency</Label>
                      <p className="text-gray-900">{vc.billing_currency}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Steps and Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Round Progress</CardTitle>
                <CardDescription>Track the progress of this VC opportunity</CardDescription>
              </div>
              <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Step</DialogTitle>
                    <DialogDescription>
                      Create a new step to track progress on this VC opportunity.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="step_name">Step Name</Label>
                      <Input
                        id="step_name"
                        placeholder="e.g., Initial pitch deck review"
                        value={newStepForm.name}
                        onChange={(e) =>
                          setNewStepForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="step_description">Description</Label>
                      <Textarea
                        id="step_description"
                        placeholder="Describe what needs to be done..."
                        value={newStepForm.description}
                        onChange={(e) =>
                          setNewStepForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="step_priority">Priority</Label>
                        <Select
                          value={newStepForm.priority}
                          onValueChange={(value) =>
                            setNewStepForm((prev) => ({
                              ...prev,
                              priority: value as "high" | "medium" | "low",
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="step_due_date">Due Date</Label>
                        <Input
                          id="step_due_date"
                          type="date"
                          value={newStepForm.due_date}
                          onChange={(e) =>
                            setNewStepForm((prev) => ({
                              ...prev,
                              due_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateStep} disabled={!newStepForm.name.trim()}>
                      Create Step
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {stepsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading steps...</div>
              ) : stepsError ? (
                <div className="text-center py-8 text-red-500">Error loading steps</div>
              ) : vcSteps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No steps yet. Create your first step to start tracking progress.
                </div>
              ) : (
                <DraggableStepsList
                  steps={vcSteps}
                  onReorder={handleReorderSteps}
                  leadId={parseInt(id!)}
                  onStepsChange={refetchSteps}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Investor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Investor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-500" />
                <div>
                  <Label className="text-sm font-medium text-gray-500">Investor</Label>
                  <p className="text-gray-900 font-medium">
                    {vc.client_name || "Unknown Investor"}
                  </p>
                </div>
              </div>

              {vc.contact_person && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Contact Person</Label>
                    <p className="text-gray-900">{vc.contact_person}</p>
                  </div>
                </div>
              )}

              {vc.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-gray-900">
                      <a
                        href={`mailto:${vc.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {vc.email}
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {vc.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                    <p className="text-gray-900">
                      <a
                        href={`tel:${vc.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {vc.phone}
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {(vc.address || vc.city || vc.state || vc.country) && (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Address</Label>
                    <div className="text-gray-900">
                      {vc.address && <div>{vc.address}</div>}
                      <div>
                        {[vc.city, vc.state, vc.country].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vc.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Website</Label>
                    <p className="text-gray-900">
                      <a
                        href={vc.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {vc.website}
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">VC Created</p>
                    <p className="text-xs text-gray-500">
                      {formatToISTDateTime(vc.created_at)}
                    </p>
                  </div>
                </div>

                {vc.updated_at && vc.updated_at !== vc.created_at && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-gray-500">
                        {formatToISTDateTime(vc.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
