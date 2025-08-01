import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTemplate } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  ArrowLeft,
  Trash2,
  Save,
} from "lucide-react";

interface TemplateStep {
  id: string;
  name: string;
  description: string;
}

export default function TemplateCreator() {
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateType, setTemplateType] = useState<
    "standard" | "enterprise" | "smb"
  >("standard");
  const [createdBy, setCreatedBy] = useState("");
  const [steps, setSteps] = useState<TemplateStep[]>([
    {
      id: "1",
      name: "Initial Contact",
      description:
        "Reach out to the client to introduce the onboarding process.",
      defaultEtaDays: 2,
      autoAlert: true,
      emailReminder: true,
    },
    {
      id: "2",
      name: "Document Collection",
      description:
        "Gather all necessary legal and financial documents from the client.",
      defaultEtaDays: 5,
      autoAlert: true,
      emailReminder: true,
    },
  ]);

  const handleBack = () => {
    navigate("/admin");
  };

  const handleSaveTemplate = () => {
    // In a real app, this would save to the backend
    console.log("Saving template:", {
      templateName,
      templateDescription,
      templateType,
      createdBy,
      steps,
    });
    navigate("/admin");
  };

  const handleAddStep = () => {
    const newStep: TemplateStep = {
      id: Date.now().toString(),
      name: "",
      description: "",
      defaultEtaDays: 3,
      autoAlert: false,
      emailReminder: false,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (
    id: string,
    field: keyof TemplateStep,
    value: any,
  ) => {
    setSteps(
      steps.map((step) =>
        step.id === id ? { ...step, [field]: value } : step,
      ),
    );
  };

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Onboarding Template Creator
          </h1>
          <p className="text-gray-600 mt-1">
            Create a new template for client onboarding workflows
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Template Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard Client Onboarding"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe the purpose and scope of this template..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateType">Template Type</Label>
                <Select
                  value={templateType}
                  onValueChange={(value: "standard" | "enterprise" | "smb") =>
                    setTemplateType(value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="smb">Small & Medium Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="createdBy">Created By</Label>
                <Input
                  id="createdBy"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="Your name or user ID"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Template Steps</CardTitle>
              <Button onClick={handleAddStep} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add New Step
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-700">
                    Step {index + 1}:
                  </span>
                  <div className="flex-1">
                    <Input
                      value={step.name}
                      onChange={(e) =>
                        handleUpdateStep(step.id, "name", e.target.value)
                      }
                      placeholder="Step name"
                      className="font-medium"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStep(step.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={step.description}
                      onChange={(e) =>
                        handleUpdateStep(step.id, "description", e.target.value)
                      }
                      placeholder="Describe what happens in this step..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Default ETA (Days)</Label>
                    <Input
                      type="number"
                      value={step.defaultEtaDays}
                      onChange={(e) =>
                        handleUpdateStep(
                          step.id,
                          "defaultEtaDays",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="mt-1"
                      min="1"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Follow-up Config</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={step.autoAlert}
                          onCheckedChange={(checked) =>
                            handleUpdateStep(step.id, "autoAlert", checked)
                          }
                        />
                        <label className="text-sm">Auto-alert if overdue</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={step.emailReminder}
                          onCheckedChange={(checked) =>
                            handleUpdateStep(step.id, "emailReminder", checked)
                          }
                        />
                        <label className="text-sm">Email reminder</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {steps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No steps added yet. Click "Add New Step" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <div className="space-x-3">
            <Button variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
