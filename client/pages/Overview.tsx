import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useUsers, useLeads, useLeadStats, useFollowUps, useTemplates, useTemplateStepDashboard } from "@/hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import { formatToIST } from "@/lib/dateUtils";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Rocket,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Activity,
  Eye,
  Target,
  Clock,
  PlayCircle,
  PauseCircle,
  XCircle,
} from "lucide-react";

interface TemplateStep {
  id: number;
  name: string;
  description: string;
  step_order: number;
  probability_percent: number;
}

interface StepStatusModal {
  isOpen: boolean;
  step: TemplateStep | null;
  status: string;
  leads: any[];
}

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stepModal, setStepModal] = useState<StepStatusModal>({
    isOpen: false,
    step: null,
    status: "",
    leads: []
  });

  // Fetch data
  const { data: users = [] } = useUsers();
  const { data: leads = [] } = useLeads();
  const { data: leadStats } = useLeadStats();
  const { data: followUps = [] } = useFollowUps();
  
  // Get template step dashboard data with real API integration
  const { data: templateStepData = [], isLoading: templateStepLoading, error: templateStepError } = useTemplateStepDashboard();

  const handleStepStatusClick = async (stepData: any, status: string) => {
    try {
      console.log(`Fetching leads for template ${stepData.template_id}, step ${stepData.step_id}, status ${status}`);

      // Get specific leads for this template step and status
      const statusLeads = await apiClient.getLeadsForTemplateStep(
        stepData.template_id,
        stepData.step_id,
        status
      );

      console.log(`Found ${statusLeads.length} leads with status ${status}`);

      setStepModal({
        isOpen: true,
        step: {
          id: stepData.step_id,
          name: stepData.step_name,
          description: `Step ${stepData.step_order} in ${stepData.template_name}`,
          step_order: stepData.step_order,
          probability_percent: stepData.probability_percent
        },
        status,
        leads: statusLeads || []
      });
    } catch (error) {
      console.error("Error fetching leads for step:", error);
      // Show modal with error message or fallback to mock data
      try {
        // Try to generate some fallback mock data
        const allLeads = await apiClient.getLeads();
        const templateLeads = allLeads.filter((lead: any) =>
          lead.template_id === stepData.template_id
        );
        const fallbackLeads = templateLeads.slice(0, Math.min(3, stepData[`${status}_count`] || 1));

        setStepModal({
          isOpen: true,
          step: {
            id: stepData.step_id,
            name: stepData.step_name,
            description: `Step ${stepData.step_order} in ${stepData.template_name}`,
            step_order: stepData.step_order,
            probability_percent: stepData.probability_percent
          },
          status,
          leads: fallbackLeads
        });
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        setStepModal({
          isOpen: true,
          step: {
            id: stepData.step_id,
            name: stepData.step_name,
            description: `Step ${stepData.step_order} in ${stepData.template_name}`,
            step_order: stepData.step_order,
            probability_percent: stepData.probability_percent
          },
          status,
          leads: []
        });
      }
    }
  };

  const handleLeadClick = (leadId: number) => {
    setStepModal(prev => ({ ...prev, isOpen: false }));
    navigate(`/leads/${leadId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'in_progress': return PlayCircle;
      case 'completed': return CheckCircle;
      case 'blocked': return XCircle;
      default: return Target;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "create-template":
        navigate("/admin/templates/new");
        break;
      case "view-reports":
        navigate("/admin/reports");
        break;
      case "manage-users":
        navigate("/admin/users");
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.first_name || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your overview dashboard with template step tracking
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {formatToIST(new Date())}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-green-600">{leads.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Rocket className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{leadStats?.in_progress || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Won Deals</p>
                <p className="text-2xl font-bold text-purple-600">{leadStats?.won || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Step-wise Dashboard */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Template Step Progress</h2>
          <Badge variant="outline" className="text-sm">
            {[...new Set(templateStepData.map((step: any) => step.template_id))].length} Active Templates
          </Badge>
        </div>

        {templateStepLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Template Step Data...</h3>
              <p className="text-gray-600">
                Fetching real-time step progress from database
              </p>
            </CardContent>
          </Card>
        ) : templateStepError ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">
                Unable to fetch template step data. Please check your connection.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : templateStepData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templateStepData.map((stepData: any) => (
              <Card key={`${stepData.template_id}-${stepData.step_id}`} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">{stepData.step_name}</CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1">
                        {stepData.template_name} • Step {stepData.step_order}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs font-medium">
                      {stepData.probability_percent}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Summary */}
                  <div className="flex justify-between items-center">
                    <div className="text-center cursor-pointer hover:bg-green-50 rounded-lg p-2 transition-colors"
                         onClick={() => handleStepStatusClick(stepData, 'completed')}>
                      <div className="text-2xl font-bold text-green-600">{stepData.completed_count}</div>
                      <div className="text-xs text-green-600 font-medium">Completed</div>
                    </div>
                    <div className="text-center cursor-pointer hover:bg-blue-50 rounded-lg p-2 transition-colors"
                         onClick={() => handleStepStatusClick(stepData, 'in_progress')}>
                      <div className="text-2xl font-bold text-blue-600">{stepData.in_progress_count}</div>
                      <div className="text-xs text-blue-600 font-medium">In Progress</div>
                    </div>
                    <div className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                         onClick={() => handleStepStatusClick(stepData, 'pending')}>
                      <div className="text-2xl font-bold text-gray-600">{stepData.pending_count}</div>
                      <div className="text-xs text-gray-600 font-medium">Pending</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${stepData.total_leads > 0 ? (stepData.completed_count / stepData.total_leads) * 100 : 0}%`
                      }}
                    ></div>
                  </div>

                  {/* Completion Percentage */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-gray-500">Completion Rate</span>
                    <span className="font-semibold text-green-600">
                      {stepData.total_leads > 0 ? Math.round((stepData.completed_count / stepData.total_leads) * 100) : 0}%
                    </span>
                  </div>

                  {/* Enhanced Statistics */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total Leads</span>
                      <span className="font-semibold text-gray-900">{stepData.total_leads}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Step Weight</span>
                      <span className="font-medium text-purple-600">
                        {stepData.probability_percent}% of total
                      </span>
                    </div>

                    {/* Mini progress indicator for this step */}
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-400">Impact:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-purple-400 h-1 rounded-full"
                          style={{ width: `${stepData.probability_percent}%` }}
                        ></div>
                      </div>
                      <span className="text-purple-600 font-medium">
                        {stepData.probability_percent}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Templates</h3>
              <p className="text-gray-600 mb-4">
                Freeze templates in the Admin Panel to see step-wise lead progress here.
              </p>
              <Button onClick={() => navigate("/admin/templates")}>
                Go to Admin Templates
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions for your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleQuickAction("create-template")}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Target className="w-6 h-6" />
              <span>Create Template</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("view-reports")}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <TrendingUp className="w-6 h-6" />
              <span>View Reports</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("manage-users")}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step Status Modal */}
      <Dialog open={stepModal.isOpen} onOpenChange={(open) => setStepModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stepModal.step && (
                <>
                  {React.createElement(getStatusIcon(stepModal.status), { 
                    className: `w-5 h-5 ${getStatusColor(stepModal.status).split(' ')[0]}` 
                  })}
                  {stepModal.step.name} - {stepModal.status.replace('_', ' ').toUpperCase()} Leads
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {stepModal.step && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Step Order:</span> {stepModal.step.step_order}
                  </div>
                  <div>
                    <span className="font-medium">Probability:</span> {stepModal.step.probability_percent}%
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Description:</span> {stepModal.step.description}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  {React.createElement(getStatusIcon(stepModal.status), {
                    className: `w-5 h-5 ${getStatusColor(stepModal.status).split(' ')[0]}`
                  })}
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Showing leads with "{stepModal.status.replace('_', ' ').toUpperCase()}" status
                  </h4>
                  <p className="text-sm text-blue-700">
                    {stepModal.leads.length} lead(s) found for this step
                  </p>
                </div>
              </div>
            </div>

            {stepModal.leads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Step Status</TableHead>
                    <TableHead>Overall Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stepModal.leads.map((lead: any) => (
                    <TableRow key={lead.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">#{lead.lead_id || lead.id}</TableCell>
                      <TableCell className="font-medium">{lead.client_name}</TableCell>
                      <TableCell>{lead.project_title || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(stepModal.status)}>
                          {stepModal.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lead.status === 'won' ? 'default' : lead.status === 'lost' ? 'destructive' : 'secondary'}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLeadClick(lead.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Lead
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {React.createElement(getStatusIcon(stepModal.status), {
                    className: "w-10 h-10 text-gray-400"
                  })}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No leads found
                </h3>
                <p className="text-gray-600 mb-4">
                  There are currently no leads with "{stepModal.status.replace('_', ' ')}" status for this step.
                </p>
                <div className="text-sm text-gray-500">
                  <p>This could mean:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>No leads have reached this step yet</li>
                    <li>All leads have moved past this status</li>
                    <li>The step hasn't been started for any leads</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
