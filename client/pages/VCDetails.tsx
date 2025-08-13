import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { useTemplate, useUpdateVCStep, useDeleteVCStep } from "@/hooks/useApi";
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
  Megaphone,
  Database,
  Wifi,
  WifiOff,
  Target,
  PiggyBank,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";
import { formatToISTDateTime } from "@/lib/dateUtils";

const statusColors = {
  "in-progress": "bg-amber-100 text-amber-800 border-amber-200",
  won: "bg-emerald-100 text-emerald-800 border-emerald-200",
  lost: "bg-rose-100 text-rose-800 border-rose-200",
  completed: "bg-violet-100 text-violet-800 border-violet-200",
};

const investorCategoryColors = {
  angel: "bg-sky-100 text-sky-800 border-sky-200",
  vc: "bg-indigo-100 text-indigo-800 border-indigo-200",
  private_equity: "bg-purple-100 text-purple-800 border-purple-200",
  family_office: "bg-orange-100 text-orange-800 border-orange-200",
  merchant_banker: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

const roundStageColors = {
  pre_seed: "bg-gray-100 text-gray-800",
  seed: "bg-green-100 text-green-800",
  series_a: "bg-blue-100 text-blue-800",
  series_b: "bg-purple-100 text-purple-800",
  series_c: "bg-pink-100 text-pink-800",
  bridge: "bg-yellow-100 text-yellow-800",
  mezzanine: "bg-red-100 text-red-800",
};

export default function VCDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    priority: "medium" as const,
    estimated_days: 1,
  });

  // Check database availability
  const { data: dbStatus } = useQuery({
    queryKey: ["database-status"],
    queryFn: async () => {
      try {
        const response = await apiClient.request("/database/status");
        return response;
      } catch (error) {
        return { isDatabaseAvailable: false, error: "Database check failed" };
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const isDatabaseAvailable = dbStatus?.isDatabaseAvailable || false;

  // Fetch VC details
  const {
    data: vcData,
    isLoading: vcLoading,
    error: vcError,
  } = useQuery({
    queryKey: ["vc", id],
    queryFn: async () => {
      console.log("🔍 Fetching VC details for ID:", id);
      try {
        const response = await apiClient.request(`/vc/${id}`);
        console.log("✅ VC API Response:", response);
        return response;
      } catch (error) {
        console.error("❌ VC API Error:", error);
        throw error;
      }
    },
    enabled: !!id,
  });

  // Fetch VC steps
  const {
    data: vcSteps,
    isLoading: stepsLoading,
    refetch: refetchSteps,
  } = useQuery({
    queryKey: ["vc-steps", id],
    queryFn: async () => {
      const response = await apiClient.request(`/vc/${id}/steps`);
      return response;
    },
    enabled: !!id,
  });

  // Fetch template details if VC has template_id
  const { data: templateData, isLoading: templateLoading } = useTemplate(
    vcData?.template_id,
    { enabled: !!vcData?.template_id },
  );

  // Create step mutation
  const createStepMutation = useMutation({
    mutationFn: async (stepData: any) => {
      const response = await apiClient.request(`/vc/${id}/steps`, {
        method: "POST",
        body: JSON.stringify(stepData),
      });
      return response;
    },
    onSuccess: () => {
      refetchSteps();
      setShowAddStep(false);
      setNewStep({
        name: "",
        description: "",
        priority: "medium",
        estimated_days: 1,
      });
    },
  });

  const updateVCStepMutation = useUpdateVCStep();
  const deleteVCStepMutation = useDeleteVCStep();

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
      await deleteVCStepMutation.mutateAsync(stepId);
      refetchSteps();
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  };

  const handleReorderSteps = (reorderedSteps: any[]) => {
    // Update local state immediately for better UX
    // The actual API call would be handled by the draggable component
    refetchSteps();
  };

  if (vcLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (vcError || !vcData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            VC Not Found
          </h3>
          <p className="text-gray-600">
            The requested VC details could not be found.
          </p>
          <Button
            onClick={() => navigate("/vc")}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to VC Overview
          </Button>
        </div>
      </div>
    );
  }

  const handleAddStep = () => {
    if (!newStep.name.trim()) return;

    createStepMutation.mutate({
      name: newStep.name,
      description: newStep.description,
      priority: newStep.priority,
      status: "pending",
      estimated_days: newStep.estimated_days,
      created_by: parseInt(user?.id || "1"),
    });
  };

  const handleUpdateStepStatus = async (stepId: number, newStatus: string) => {
    try {
      await updateVCStepMutation.mutateAsync({
        stepId,
        updates: { status: newStatus },
      });
      refetchSteps();
    } catch (error) {
      console.error("Failed to update step:", error);
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "pending":
        return <Target className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRoundStageDisplay = (stage: string) => {
    return (
      stage
        ?.split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || "N/A"
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with database status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/vc")}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to VC Overview
          </Button>
          <div className="flex items-center gap-2">
            {isDatabaseAvailable ? (
              <>
                <Database className="h-4 w-4 text-emerald-600" />
                <Wifi className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Live Database
                </span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4 text-amber-600" />
                <WifiOff className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  Mock Data Mode
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          onClick={() => setIsEditMode(!isEditMode)}
          variant="outline"
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditMode ? "Save Changes" : "Edit VC"}
        </Button>
      </div>

      {/* Main VC Info Card */}
      <Card className="shadow-lg border-indigo-100">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Megaphone className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {vcData.round_title || "Untitled Round"}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    {vcData.investor_name}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    statusColors[vcData.status as keyof typeof statusColors]
                  }
                >
                  {vcData.status?.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    investorCategoryColors[
                      vcData.investor_category as keyof typeof investorCategoryColors
                    ]
                  }
                >
                  {vcData.investor_category?.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    roundStageColors[
                      vcData.round_stage as keyof typeof roundStageColors
                    ]
                  }
                >
                  {getRoundStageDisplay(vcData.round_stage)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Hash className="h-4 w-4" />
                {vcData.vc_id}
              </div>
              <div className="text-3xl font-bold text-indigo-600">
                {vcData.round_size || "TBD"}
              </div>
              <div className="text-sm text-gray-600">
                @ {vcData.valuation || "TBD"} valuation
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Contact Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{vcData.contact_person}</div>
                    <div className="text-sm text-gray-600">Primary Contact</div>
                  </div>
                </div>
                {vcData.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a
                      href={`mailto:${vcData.email}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {vcData.email}
                    </a>
                  </div>
                )}
                {vcData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <a
                      href={`tel:${vcData.phone}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {vcData.phone}
                    </a>
                  </div>
                )}
                {vcData.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a
                      href={vcData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {vcData.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-indigo-600" />
                Financial Terms
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Round Size</span>
                  <span className="font-semibold">
                    {vcData.round_size || "TBD"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Valuation</span>
                  <span className="font-semibold">
                    {vcData.valuation || "TBD"}
                  </span>
                </div>
                {vcData.minimum_size && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Min. Investment</span>
                    <span className="font-semibold">
                      ${(vcData.minimum_size / 1000000).toFixed(1)}M
                    </span>
                  </div>
                )}
                {vcData.maximum_size && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Max. Investment</span>
                    <span className="font-semibold">
                      ${(vcData.maximum_size / 1000000).toFixed(1)}M
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Currency</span>
                  <span className="font-semibold">
                    {vcData.billing_currency || "USD"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline & Status */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Timeline & Progress
              </h3>
              <div className="space-y-3">
                {vcData.start_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Started</span>
                    <span className="font-semibold">
                      {new Date(vcData.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {vcData.targeted_end_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Target Close</span>
                    <span className="font-semibold">
                      {new Date(vcData.targeted_end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Priority</span>
                  <Badge
                    variant="outline"
                    className={
                      vcData.priority_level === "high"
                        ? "border-red-200 text-red-700"
                        : vcData.priority_level === "medium"
                          ? "border-yellow-200 text-yellow-700"
                          : "border-green-200 text-green-700"
                    }
                  >
                    {vcData.priority_level?.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lead Investor</span>
                  <span className="font-semibold">
                    {vcData.potential_lead_investor ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {vcData.round_description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Round Description
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {vcData.round_description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VC Steps Management */}
      <Card className="shadow-lg border-indigo-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Funding Process Steps
              </CardTitle>
              <CardDescription>
                Track your fundraising milestones and progress with drag-and-drop organization
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddStep(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {stepsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : vcSteps && vcSteps.length > 0 ? (
            <VCDraggableStepsList
              vcId={parseInt(id!)}
              steps={vcSteps}
              expandedSteps={expandedSteps}
              onToggleExpansion={handleToggleExpansion}
              onDeleteStep={handleDeleteStep}
              onReorderSteps={handleReorderSteps}
            />
          ) : (
            <div className="text-center py-8 px-6">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Steps Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start tracking your fundraising process by adding steps
              </p>
              <Button
                onClick={() => setShowAddStep(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Step
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Integration */}
      {templateData && (
        <Card className="shadow-lg border-emerald-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              Template: {templateData.name}
            </CardTitle>
            <CardDescription>
              Specialized process template for {templateData.type} tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Template Steps
                </h4>
                <div className="space-y-2">
                  {templateData.steps?.map((step: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded border border-emerald-200 bg-emerald-50/50"
                    >
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-semibold text-emerald-700">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {step.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {step.description}
                        </div>
                      </div>
                      <div className="text-xs text-emerald-600 font-medium">
                        {step.estimated_days || 1}d
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Template Benefits
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    Specialized for {vcData.round_stage} funding rounds
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    Industry-standard milestones and timelines
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    Proven success framework for VC interactions
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Step Dialog */}
      <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Step</DialogTitle>
            <DialogDescription>
              Create a new milestone for your fundraising process
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="step-name">Step Name</Label>
              <Input
                id="step-name"
                value={newStep.name}
                onChange={(e) =>
                  setNewStep({ ...newStep, name: e.target.value })
                }
                placeholder="e.g., Initial Pitch Presentation"
              />
            </div>
            <div>
              <Label htmlFor="step-description">Description</Label>
              <Textarea
                id="step-description"
                value={newStep.description}
                onChange={(e) =>
                  setNewStep({ ...newStep, description: e.target.value })
                }
                placeholder="Describe what needs to be accomplished in this step"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newStep.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setNewStep({ ...newStep, priority: value })
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
                <Label htmlFor="estimated-days">Estimated Days</Label>
                <Input
                  id="estimated-days"
                  type="number"
                  value={newStep.estimated_days}
                  onChange={(e) =>
                    setNewStep({
                      ...newStep,
                      estimated_days: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStep(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStep}
              disabled={!newStep.name.trim() || createStepMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createStepMutation.isPending ? "Adding..." : "Add Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
