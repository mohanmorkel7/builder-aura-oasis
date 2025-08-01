import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useLead,
  useLeadSteps,
  useCreateLeadStep,
  useReorderLeadSteps,
} from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
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
  User,
  Target,
  Plus,
  Settings,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Award,
  Zap,
} from "lucide-react";

const statusColors = {
  "in-progress": "bg-blue-100 text-blue-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  completed: "bg-purple-100 text-purple-700",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const sourceIcons = {
  email: Mail,
  "social-media": Users,
  phone: Phone,
  website: Globe,
  referral: Award,
  "cold-call": Phone,
  event: Building,
  other: Zap,
};

const sourceColors = {
  email: "bg-blue-100 text-blue-700",
  "social-media": "bg-purple-100 text-purple-700",
  phone: "bg-green-100 text-green-700",
  website: "bg-orange-100 text-orange-700",
  referral: "bg-pink-100 text-pink-700",
  "cold-call": "bg-cyan-100 text-cyan-700",
  event: "bg-indigo-100 text-indigo-700",
  other: "bg-gray-100 text-gray-700",
};

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const leadId = parseInt(id || "0");

  const { data: lead, isLoading, error } = useLead(leadId);
  const { data: leadSteps = [], isLoading: stepsLoading } =
    useLeadSteps(leadId);
  const createStepMutation = useCreateLeadStep();
  const reorderStepsMutation = useReorderLeadSteps();

  const [newStepDialog, setNewStepDialog] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState(new Set<number>());
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    due_date: "",
    estimated_days: "3",
  });

  const handleBack = () => {
    navigate("/leads");
  };

  const handleEdit = () => {
    navigate(`/leads/${id}/edit`);
  };

  const handleAddStep = async () => {
    if (newStep.name.trim() && newStep.description.trim()) {
      try {
        const stepData = {
          name: newStep.name.trim(),
          description: newStep.description.trim(),
          due_date: newStep.due_date.trim() || undefined,
          estimated_days: parseInt(newStep.estimated_days) || 3,
        };

        console.log("Creating step with data:", { leadId, stepData });
        const result = await createStepMutation.mutateAsync({
          leadId,
          stepData,
        });
        console.log("Step creation result:", result);

        setNewStep({
          name: "",
          description: "",
          due_date: "",
        });
        setNewStepDialog(false);
      } catch (error) {
        console.error("Failed to create step:", error);
      }
    } else {
      console.warn("Step validation failed - missing name or description");
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

  const handleDeleteStep = (stepId: number) => {
    // TODO: Implement step deletion
    console.log("Deleting step:", stepId);
  };

  const handleReorderSteps = async (reorderedSteps: any[]) => {
    try {
      const stepOrders = reorderedSteps.map((step, index) => ({
        id: step.id,
        order: index + 1,
      }));

      await reorderStepsMutation.mutateAsync({
        leadId,
        stepOrders,
      });
    } catch (error) {
      console.error("Failed to reorder steps:", error);
    }
  };

  if (isLoading || stepsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading lead details
        </div>
      </div>
    );
  }

  const leadData = lead as any;
  const SourceIcon =
    sourceIcons[leadData.lead_source as keyof typeof sourceIcons] || Zap;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {leadData.client_name}
              </h1>
              <Badge className="text-xs">{leadData.lead_id}</Badge>
              <Badge
                className={
                  statusColors[leadData.status as keyof typeof statusColors]
                }
              >
                {leadData.status.replace("-", " ")}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              Lead Details & Custom Sales Pipeline
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Lead Information */}
        <div className="lg:col-span-3 space-y-6">
          {/* Lead Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Overview</CardTitle>
              <CardDescription>
                Basic lead information and project details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Lead Source:
                      </span>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-1 rounded ${sourceColors[leadData.lead_source as keyof typeof sourceColors]}`}
                        >
                          <SourceIcon className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col">
                          <span className="capitalize">
                            {leadData.lead_source.replace("-", " ")}
                          </span>
                          {leadData.lead_source_value && (
                            <span
                              className="text-sm text-blue-600 hover:underline cursor-pointer"
                              title={leadData.lead_source_value}
                            >
                              {leadData.lead_source === "email" ? (
                                <a
                                  href={`mailto:${leadData.lead_source_value}`}
                                >
                                  {leadData.lead_source_value}
                                </a>
                              ) : leadData.lead_source === "phone" ||
                                leadData.lead_source === "cold-call" ? (
                                <a href={`tel:${leadData.lead_source_value}`}>
                                  {leadData.lead_source_value}
                                </a>
                              ) : leadData.lead_source === "website" ? (
                                <a
                                  href={
                                    leadData.lead_source_value.startsWith(
                                      "http",
                                    )
                                      ? leadData.lead_source_value
                                      : `https://${leadData.lead_source_value}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {leadData.lead_source_value}
                                </a>
                              ) : (
                                leadData.lead_source_value
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">Status:</span>
                      <Badge
                        className={
                          statusColors[
                            leadData.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {leadData.status.charAt(0).toUpperCase() +
                          leadData.status.slice(1).replace("-", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Priority:
                      </span>
                      <Badge
                        className={
                          priorityColors[
                            leadData.priority as keyof typeof priorityColors
                          ]
                        }
                      >
                        {leadData.priority.charAt(0).toUpperCase() +
                          leadData.priority.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Probability:
                      </span>
                      <span className="text-gray-900">
                        {leadData.probability || 50}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    {leadData.contacts && leadData.contacts.length > 0 && (
                      <>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-600">
                            Contact Person:
                          </span>
                          <span className="text-gray-900">
                            {leadData.contacts[0].contact_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-600">
                            Email:
                          </span>
                          <a
                            href={`mailto:${leadData.contacts[0].email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {leadData.contacts[0].email}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-600">
                            Phone:
                          </span>
                          <span className="text-gray-900">
                            {leadData.contacts[0].phone || "Not provided"}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Company:
                      </span>
                      <span className="text-gray-900">
                        {leadData.company || leadData.client_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {leadData.project_title && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Project Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">
                          Title:{" "}
                        </span>
                        <span className="text-gray-900">
                          {leadData.project_title}
                        </span>
                      </div>
                      {leadData.project_description && (
                        <div>
                          <span className="font-medium text-gray-600">
                            Description:{" "}
                          </span>
                          <span className="text-gray-900">
                            {leadData.project_description}
                          </span>
                        </div>
                      )}

                      {leadData.project_requirements && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-600">
                            Requirements:{" "}
                          </span>
                          <span className="text-gray-900">
                            {leadData.project_requirements}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {leadData.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Notes:</span>
                    </div>
                    <div className="pl-6 text-gray-900 whitespace-pre-wrap">
                      {leadData.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Custom Sales Pipeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Sales Pipeline</CardTitle>
                  <CardDescription>
                    Manage lead-specific sales steps with rich communication
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
                      <DialogTitle>Add New Step</DialogTitle>
                      <DialogDescription>
                        Create a custom step for this lead's sales process
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="stepName">Step Name *</Label>
                        <Input
                          id="stepName"
                          value={newStep.name}
                          onChange={(e) =>
                            setNewStep((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="e.g., Technical Demo"
                          className=""
                        />
                      </div>
                      <div>
                        <Label htmlFor="stepDescription">Description *</Label>
                        <Textarea
                          id="stepDescription"
                          value={newStep.description}
                          onChange={(e) =>
                            setNewStep((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Describe what needs to be done in this step"
                          rows={3}
                          className=""
                        />
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newStep.due_date}
                          onChange={(e) =>
                            setNewStep((prev) => ({
                              ...prev,
                              due_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setNewStepDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddStep}
                        disabled={
                          !newStep.name.trim() || !newStep.description.trim()
                        }
                      >
                        Add Step
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {leadSteps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pipeline steps yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create custom steps to track your sales process for this
                    lead
                  </p>
                  <Button onClick={() => setNewStepDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Step
                  </Button>
                </div>
              ) : (
                <DraggableStepsList
                  leadId={leadId}
                  steps={leadSteps}
                  expandedSteps={expandedSteps}
                  onToggleExpansion={handleToggleExpansion}
                  onDeleteStep={handleDeleteStep}
                  onReorderSteps={handleReorderSteps}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  {leadData.probability}% probability
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {leadData.expected_close_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Close:</span>
                    <span className="text-gray-900">
                      {new Date(
                        leadData.expected_close_date,
                      ).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leadData.contacts &&
              leadData.contacts.length > 0 &&
              leadData.contacts[0].email ? (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `mailto:${leadData.contacts[0].email}?subject=Follow-up: ${leadData.project_title || leadData.client_name}&body=Hi ${leadData.contacts[0].contact_name},%0D%0A%0D%0AI wanted to follow up on our discussion regarding ${leadData.project_title || "your project"}...`,
                      "_blank",
                    )
                  }
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              ) : (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email (No email available)
                </Button>
              )}

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() =>
                  navigate(`/leads/${id}/follow-up`, {
                    state: {
                      fromQuickAction: true,
                      leadId: id,
                      stepName: "Quick Action",
                      messageId: null,
                      createSystemMessage: false,
                    },
                  })
                }
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </Button>

              {leadData.contacts &&
              leadData.contacts.length > 0 &&
              leadData.contacts[0].phone ? (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    window.open(`tel:${leadData.contacts[0].phone}`, "_self")
                  }
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call {leadData.contacts[0].contact_name}
                </Button>
              ) : (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Make Call (No phone available)
                </Button>
              )}

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() =>
                  navigate(`/leads/${id}/proposal`, {
                    state: {
                      leadData: leadData,
                    },
                  })
                }
              >
                <Target className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>

              <Separator />

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() =>
                  navigate(`/leads/${id}/pipeline-settings`, {
                    state: {
                      leadData: leadData,
                    },
                  })
                }
              >
                <Settings className="w-4 h-4 mr-2" />
                Pipeline Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
