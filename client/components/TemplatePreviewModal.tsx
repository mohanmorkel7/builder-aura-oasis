import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Calendar, CheckCircle } from "lucide-react";

interface TemplateStep {
  id: number;
  name: string;
  description: string;
  order_position: number;
  is_required: boolean;
  estimated_days?: number;
  assigned_role?: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  steps: TemplateStep[];
  created_by?: string;
  created_at?: string;
}

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const totalSteps = template.steps?.length || 0;
  const requiredSteps = template.steps?.filter(step => step.is_required).length || 0;
  const totalEstimatedDays = template.steps?.reduce((total, step) => total + (step.estimated_days || 0), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description || "Template preview with all steps and details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{totalSteps}</div>
                <div className="text-sm text-gray-600">Total Steps</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{requiredSteps}</div>
                <div className="text-sm text-gray-600">Required Steps</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{totalEstimatedDays}</div>
                <div className="text-sm text-gray-600">Est. Days</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(template.steps?.map(step => step.assigned_role)).size || 0}
                </div>
                <div className="text-sm text-gray-600">Roles</div>
              </CardContent>
            </Card>
          </div>

          {/* Steps List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Template Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template.steps && template.steps.length > 0 ? (
                <div className="space-y-4">
                  {template.steps
                    .sort((a, b) => a.order_position - b.order_position)
                    .map((step, index) => (
                      <div key={step.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                                {index + 1}
                              </div>
                              <h3 className="font-medium text-gray-900">{step.name}</h3>
                              {step.is_required && (
                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 ml-11 mb-3">
                              {step.description}
                            </p>
                            <div className="flex items-center space-x-4 ml-11 text-xs text-gray-500">
                              {step.estimated_days && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{step.estimated_days} day{step.estimated_days !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {step.assigned_role && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span className="capitalize">{step.assigned_role}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No steps defined in this template</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Info */}
          {(template.created_by || template.created_at) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  {template.created_by && (
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Created by: {template.created_by}</span>
                    </div>
                  )}
                  {template.created_at && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
