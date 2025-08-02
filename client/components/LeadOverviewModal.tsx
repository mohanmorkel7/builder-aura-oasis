import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Building,
  Target,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface LeadOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
}

export function LeadOverviewModal({
  isOpen,
  onClose,
  lead,
}: LeadOverviewModalProps) {
  if (!lead) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "in_progress": return "text-blue-600 bg-blue-100";
      case "won": return "text-emerald-600 bg-emerald-100";
      case "lost": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-100";
      case "high": return "text-orange-600 bg-orange-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Lead Overview - {lead.client_name}
          </DialogTitle>
          <DialogDescription>
            Read-only overview of completed lead ready for product development
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(lead.status || lead.lead_status)}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {(lead.status || lead.lead_status || "completed").replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(lead.priority || "medium")}>
                      {(lead.priority || "medium").charAt(0).toUpperCase() + (lead.priority || "medium").slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Completion</Label>
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.round((lead.completed_steps / lead.total_steps) * 100) || 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {lead.completed_steps || 0}/{lead.total_steps || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Completed</Label>
                  <div className="mt-1 text-sm">
                    {lead.completion_date ? format(new Date(lead.completion_date), "MMM d, yyyy") : "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Project Title</Label>
                  <p className="text-sm mt-1 font-medium">{lead.project_title}</p>
                </div>
                {lead.project_description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-gray-600 mt-1">{lead.project_description}</p>
                  </div>
                )}
                {lead.project_requirements && (
                  <div>
                    <Label className="text-sm font-medium">Requirements</Label>
                    <p className="text-sm text-gray-600 mt-1">{lead.project_requirements}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.estimated_budget && (
                    <div>
                      <Label className="text-sm font-medium">Estimated Budget</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">₹{lead.estimated_budget?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {lead.expected_close_date && (
                    <div>
                      <Label className="text-sm font-medium">Expected Close Date</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{format(new Date(lead.expected_close_date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm">{lead.client_name}</p>
                    </div>
                  </div>
                  {lead.contacts && lead.contacts.length > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <Label className="text-sm font-medium">Contact Person</Label>
                          <p className="text-sm">{lead.contacts[0].contact_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm text-blue-600">{lead.contacts[0].email}</p>
                        </div>
                      </div>
                      {lead.contacts[0].phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div>
                            <Label className="text-sm font-medium">Phone</Label>
                            <p className="text-sm">{lead.contacts[0].phone}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Lead Source</Label>
                    <p className="text-sm capitalize">{(lead.lead_source || "unknown").replace("_", " ")}</p>
                  </div>
                  {lead.lead_source_value && (
                    <div>
                      <Label className="text-sm font-medium">Source Details</Label>
                      <p className="text-sm text-gray-600">{lead.lead_source_value}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Probability</Label>
                    <p className="text-sm">{lead.probability || 50}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Ready for Product Development */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">Ready for Product Development</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                This lead has completed all required steps and is ready to be converted into a product development project.
              </div>
              <div className="mt-2 text-sm text-green-600">
                <strong>Completed Steps:</strong> {lead.completed_steps}/{lead.total_steps} • 
                <strong> Completion Date:</strong> {lead.completion_date ? format(new Date(lead.completion_date), "MMM d, yyyy") : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
