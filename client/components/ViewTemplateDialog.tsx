import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";

interface ViewTemplateDialogProps {
  templateId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewTemplateDialog({
  templateId,
  isOpen,
  onClose,
}: ViewTemplateDialogProps) {
  const { data: template, isLoading } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => (templateId ? apiClient.getTemplate(templateId) : null),
    enabled: !!templateId && isOpen,
  });

  if (!templateId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading template details...</div>
        ) : template ? (
          <div className="space-y-6">
            {/* Template Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-gray-600 mt-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant={template.is_active ? "default" : "secondary"}
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Created by {template.creator_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>
                      Created{" "}
                      {format(new Date(template.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>{template.step_count || 0} steps</span>
                  </div>
                  {template.steps && template.steps.some((step: any) => step.probability_percent !== undefined) && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span className={`${
                        template.steps.reduce((sum: number, step: any) => sum + (step.probability_percent || 0), 0) === 100
                          ? 'text-green-600 font-medium'
                          : 'text-orange-600 font-medium'
                      }`}>
                        Total: {template.steps.reduce((sum: number, step: any) => sum + (step.probability_percent || 0), 0)}% probability
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Template Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Template Steps</CardTitle>
                  {template.steps && template.steps.some((step: any) => step.probability_percent !== undefined) && (
                    <div className="text-sm">
                      <span className="text-gray-600">Total Probability: </span>
                      <span className={`font-medium ${
                        template.steps.reduce((sum: number, step: any) => sum + (step.probability_percent || 0), 0) === 100
                          ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {template.steps.reduce((sum: number, step: any) => sum + (step.probability_percent || 0), 0)}%
                      </span>
                      <span className="text-gray-500 ml-1">/ 100%</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {template.steps && template.steps.length > 0 ? (
                  <div className="space-y-4">
                    {template.steps
                      .sort((a: any, b: any) => (a.step_order || a.order_position || 0) - (b.step_order || b.order_position || 0))
                      .map((step: any, index: number) => (
                      <div
                        key={step.id || index}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                              {index + 1}
                            </div>
                            <h4 className="font-medium">{step.name}</h4>
                          </div>
                          {(step.probability_percent !== undefined && step.probability_percent !== null) && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700"
                            >
                              {step.probability_percent}%
                            </Badge>
                          )}
                        </div>

                        {step.description && (
                          <p className="text-gray-600 mb-3 ml-10">
                            {step.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No steps defined in this template
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Metadata */}
            {template.tags && template.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Template not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
