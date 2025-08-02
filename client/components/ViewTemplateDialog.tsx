import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";

interface ViewTemplateDialogProps {
  templateId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewTemplateDialog({ templateId, isOpen, onClose }: ViewTemplateDialogProps) {
  const { data: template, isLoading } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => templateId ? apiClient.getTemplate(templateId) : null,
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
                      <p className="text-gray-600 mt-2">{template.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {template.type && (
                      <Badge variant="outline">
                        {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Created by {template.creator_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Created {format(new Date(template.created_at), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>{template.step_count || 0} steps</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Template Steps</CardTitle>
              </CardHeader>
              <CardContent>
                {template.steps && template.steps.length > 0 ? (
                  <div className="space-y-4">
                    {template.steps.map((step: any, index: number) => (
                      <div key={step.id || index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Step {index + 1}</Badge>
                            <h4 className="font-medium">{step.name}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {step.default_eta_days} day{step.default_eta_days !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        {step.description && (
                          <p className="text-gray-600 mb-3">{step.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {step.assigned_role && (
                            <Badge variant="secondary">
                              <User className="w-3 h-3 mr-1" />
                              {step.assigned_role}
                            </Badge>
                          )}
                          {step.auto_alert && (
                            <Badge variant="outline">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Auto Alert
                            </Badge>
                          )}
                          {step.email_reminder && (
                            <Badge variant="outline">
                              Email Reminder
                            </Badge>
                          )}
                          {step.approval_required && (
                            <Badge variant="outline">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approval Required
                            </Badge>
                          )}
                          {step.parallel_execution && (
                            <Badge variant="outline">
                              Parallel Execution
                            </Badge>
                          )}
                        </div>
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
