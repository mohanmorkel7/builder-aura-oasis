import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useLeads,
  useLeadStats,
  useDeleteLead,
  useMyPartialSaves,
  useTemplateStepDashboard,
} from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  Mail,
  Phone,
  Globe,
  Users,
  Building,
  Zap,
  Trash2,
  MoreVertical,
  FileText,
  Play,
} from "lucide-react";
import { formatToIST } from "@/lib/dateUtils";

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

export default function LeadDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const {
    data: stats = { total: 0, in_progress: 0, won: 0, lost: 0, completed: 0 },
  } = useLeadStats();
  const deleteLead = useDeleteLead();
  const userId = user?.id ? parseInt(user.id) : undefined;
  const {
    data: partialSaves = [],
    isLoading: partialSavesLoading,
    refetch: refetchPartialSaves,
  } = useMyPartialSaves(userId);
  const { data: stepDashboardData = [], isLoading: stepDashboardLoading } = useTemplateStepDashboard();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"leads" | "drafts">("leads");

  // Refresh partial saves when component mounts
  useEffect(() => {
    if (userId) {
      refetchPartialSaves();
    }
  }, [userId, refetchPartialSaves]);

  const handleCreateLead = () => {
    navigate("/leads/new");
  };

  const handleLeadClick = (leadId: number) => {
    navigate(`/leads/${leadId}`);
  };

  const handleDeleteLead = async (leadId: number, leadName: string) => {
    try {
      await deleteLead.mutateAsync(leadId);
      console.log(`Lead ${leadName} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  };

  const handleResumePartialSave = (partialData: any) => {
    console.log("Navigating to CreateLead with resumeData:", {
      id: partialData.id,
      _resumeFromId: partialData._resumeFromId,
      clientName: partialData.client_name,
    });
    // Navigate to create lead page with partial data
    navigate("/leads/new", { state: { resumeData: partialData } });
  };

  const handleDeletePartialSave = async (
    partialSaveId: number,
    partialSaveName: string,
  ) => {
    try {
      await deleteLead.mutateAsync(partialSaveId);
      console.log(`Draft ${partialSaveName} deleted successfully`);
      // Refresh both partial saves and main leads to ensure clean state
      refetchPartialSaves();
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

  const getPartialSaveInfo = (partialSave: any) => {
    try {
      const notes = JSON.parse(partialSave.notes || "{}");
      return {
        lastSaved: notes.lastSaved,
        completedTabs: notes.completedTabs || [],
        originalData: notes.originalData || {},
      };
    } catch {
      return {
        lastSaved: partialSave.created_at,
        completedTabs: [],
        originalData: {},
      };
    }
  };

  // Filter leads based on search and filters, excluding partial saves
  const filteredLeads = leads.filter((lead: any) => {
    // Exclude partial saves from main leads list
    let isPartialSave = false;

    try {
      isPartialSave =
        lead.client_name === "PARTIAL_SAVE_IN_PROGRESS" ||
        lead.is_partial === true ||
        (lead.notes &&
          typeof lead.notes === "string" &&
          JSON.parse(lead.notes).isPartialSave === true);
    } catch (error) {
      // If JSON parsing fails, check for string indicators
      isPartialSave =
        lead.client_name === "PARTIAL_SAVE_IN_PROGRESS" ||
        lead.is_partial === true;
    }

    if (isPartialSave) {
      return false;
    }

    const matchesSearch =
      lead.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lead_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.contacts &&
        lead.contacts.some(
          (contact: any) =>
            contact.contact_name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            contact.email?.toLowerCase().includes(searchTerm.toLowerCase()),
        )) ||
      lead.project_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    const matchesSource =
      sourceFilter === "all" || lead.lead_source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  if (leadsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your sales pipeline and track lead progress
          </p>
        </div>
        <Button
          onClick={handleCreateLead}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Lead
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.total}
                </p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.in_progress}
                </p>
              </div>
              <div className="bg-orange-200 p-3 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Won</p>
                <p className="text-2xl font-bold text-green-900">{stats.won}</p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Lost</p>
                <p className="text-2xl font-bold text-red-900">{stats.lost}</p>
              </div>
              <div className="bg-red-200 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.completed}
                </p>
              </div>
              <div className="bg-purple-200 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step-wise Lead Distribution */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Step-wise Lead Distribution</h2>
            <p className="text-gray-600 text-sm">Track how many leads are in each template step with probability percentages</p>
          </div>
        </div>

        {stepDashboardLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading step distribution...</div>
            </CardContent>
          </Card>
        ) : stepDashboardData.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No step data available
              </h3>
              <p className="text-gray-600">
                Step distribution will appear here once you have leads assigned to templates
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stepDashboardData.map((stepData: any) => {
              const maxCount = Math.max(
                stepData.pending_count,
                stepData.in_progress_count,
                stepData.completed_count,
                stepData.blocked_count
              );
              const chartHeight = 80; // Base height for charts

              return (
                <Card key={`${stepData.template_id}-${stepData.step_id}`} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2">
                          {stepData.step_name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {stepData.template_name}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-blue-100 text-blue-700 ml-2"
                      >
                        {stepData.probability_percent}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Vertical Bar Chart */}
                    <div className="flex items-end justify-center space-x-1 mb-3" style={{ height: `${chartHeight}px` }}>
                      {/* Pending */}
                      <div className="flex flex-col items-center space-y-1">
                        <div
                          className="bg-yellow-400 rounded-t min-h-[4px] w-6 transition-all duration-300"
                          style={{
                            height: maxCount > 0 ? `${(stepData.pending_count / maxCount) * (chartHeight - 20)}px` : '4px'
                          }}
                        />
                        <span className="text-xs font-medium text-yellow-700">{stepData.pending_count}</span>
                      </div>

                      {/* In Progress */}
                      <div className="flex flex-col items-center space-y-1">
                        <div
                          className="bg-blue-500 rounded-t min-h-[4px] w-6 transition-all duration-300"
                          style={{
                            height: maxCount > 0 ? `${(stepData.in_progress_count / maxCount) * (chartHeight - 20)}px` : '4px'
                          }}
                        />
                        <span className="text-xs font-medium text-blue-700">{stepData.in_progress_count}</span>
                      </div>

                      {/* Completed */}
                      <div className="flex flex-col items-center space-y-1">
                        <div
                          className="bg-green-500 rounded-t min-h-[4px] w-6 transition-all duration-300"
                          style={{
                            height: maxCount > 0 ? `${(stepData.completed_count / maxCount) * (chartHeight - 20)}px` : '4px'
                          }}
                        />
                        <span className="text-xs font-medium text-green-700">{stepData.completed_count}</span>
                      </div>

                      {/* Blocked */}
                      <div className="flex flex-col items-center space-y-1">
                        <div
                          className="bg-red-500 rounded-t min-h-[4px] w-6 transition-all duration-300"
                          style={{
                            height: maxCount > 0 ? `${(stepData.blocked_count / maxCount) * (chartHeight - 20)}px` : '4px'
                          }}
                        />
                        <span className="text-xs font-medium text-red-700">{stepData.blocked_count}</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded"></div>
                        <span className="text-gray-600">Pending</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded"></div>
                        <span className="text-gray-600">In Progress</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded"></div>
                        <span className="text-gray-600">Completed</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded"></div>
                        <span className="text-gray-600">Blocked</span>
                      </div>
                    </div>

                    {/* Total count */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-center">
                        <span className="text-sm font-medium text-gray-700">
                          Total: {stepData.total_leads} leads
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs and Search/Filters */}
      <Card>
        <CardContent className="p-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant={activeTab === "leads" ? "default" : "outline"}
              onClick={() => setActiveTab("leads")}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Leads ({filteredLeads.length})
            </Button>
            <Button
              variant={activeTab === "drafts" ? "default" : "outline"}
              onClick={() => setActiveTab("drafts")}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Saved Drafts ({partialSaves.length})
            </Button>
          </div>

          {/* Search and Filters - Only show for leads tab */}
          {activeTab === "leads" && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads by name, contact, ID, or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold-call">Cold Call</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      <div className="grid gap-4">
        {activeTab === "leads" ? (
          filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No leads found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  sourceFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "Get started by creating your first lead"}
                </p>
                <Button onClick={handleCreateLead}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lead
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead: any) => {
              const SourceIcon =
                sourceIcons[lead.lead_source as keyof typeof sourceIcons] ||
                Zap;

              return (
                <Card
                  key={lead.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleLeadClick(lead.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {lead.client_name}
                          </h3>
                          <Badge className="text-xs">{lead.lead_id}</Badge>
                          <Badge
                            className={
                              statusColors[
                                lead.status as keyof typeof statusColors
                              ]
                            }
                          >
                            {lead.status.replace("-", " ")}
                          </Badge>
                          <Badge
                            className={
                              priorityColors[
                                lead.priority as keyof typeof priorityColors
                              ]
                            }
                          >
                            {lead.priority}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center space-x-1">
                            <div
                              className={`p-1 rounded ${sourceColors[lead.lead_source as keyof typeof sourceColors]}`}
                            >
                              <SourceIcon className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col">
                              <span className="capitalize">
                                {lead.lead_source.replace("-", " ")}
                              </span>
                              {lead.lead_source_value && (
                                <span
                                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                                  title={lead.lead_source_value}
                                >
                                  {lead.lead_source === "email" ? (
                                    <a
                                      href={`mailto:${lead.lead_source_value}`}
                                    >
                                      {lead.lead_source_value.length > 20
                                        ? `${lead.lead_source_value.substring(0, 20)}...`
                                        : lead.lead_source_value}
                                    </a>
                                  ) : lead.lead_source === "phone" ||
                                    lead.lead_source === "cold-call" ? (
                                    <a href={`tel:${lead.lead_source_value}`}>
                                      {lead.lead_source_value}
                                    </a>
                                  ) : lead.lead_source === "website" ? (
                                    <a
                                      href={
                                        lead.lead_source_value.startsWith(
                                          "http",
                                        )
                                          ? lead.lead_source_value
                                          : `https://${lead.lead_source_value}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {lead.lead_source_value.length > 20
                                        ? `${lead.lead_source_value.substring(0, 20)}...`
                                        : lead.lead_source_value}
                                    </a>
                                  ) : lead.lead_source_value.length > 20 ? (
                                    `${lead.lead_source_value.substring(0, 20)}...`
                                  ) : (
                                    lead.lead_source_value
                                  )}
                                </span>
                              )}
                            </div>
                          </span>
                          {lead.contacts && lead.contacts.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{lead.contacts[0].contact_name}</span>
                              <span>•</span>
                              <span>{lead.contacts[0].email}</span>
                            </>
                          )}
                          {lead.probability && (
                            <>
                              <span>•</span>
                              <span>{lead.probability}% probability</span>
                            </>
                          )}
                        </div>

                        {lead.project_title && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {lead.project_title}
                            </h4>
                            {lead.project_description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {lead.project_description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex flex-col items-end space-y-2">
                        {lead.expected_close_date && (
                          <div className="text-sm text-gray-500">
                            Expected: {formatToIST(lead.expected_close_date)}
                          </div>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {lead.client_name}"? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteLead(lead.id, lead.client_name)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {lead.company && <span>Company: {lead.company}</span>}
                        {lead.category && (
                          <span>Category: {lead.category}</span>
                        )}
                      </div>
                      <div>Created: {formatToIST(lead.created_at)}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        ) : /* Saved Drafts Tab */
        partialSavesLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-center">Loading saved drafts...</div>
            </CardContent>
          </Card>
        ) : partialSaves.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No saved drafts
              </h3>
              <p className="text-gray-600 mb-4">
                Start creating a lead and use "Save Progress" to save your work.
              </p>
              <Button onClick={handleCreateLead}>
                <Plus className="w-4 h-4 mr-2" />
                Create Lead
              </Button>
            </CardContent>
          </Card>
        ) : (
          partialSaves.map((partialSave: any) => {
            const info = getPartialSaveInfo(partialSave);
            const lastSaved = new Date(info.lastSaved);
            const timeSince = Math.floor(
              (Date.now() - lastSaved.getTime()) / (1000 * 60 * 60),
            ); // hours

            return (
              <Card
                key={partialSave.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {partialSave.client_name ===
                          "PARTIAL_SAVE_IN_PROGRESS"
                            ? "Unsaved Lead Draft"
                            : partialSave.client_name || "Untitled Draft"}
                        </h3>
                        <Badge className="text-xs bg-yellow-100 text-yellow-700">
                          DRAFT
                        </Badge>
                        {info.completedTabs.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {info.completedTabs[0]} tab
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {timeSince < 1
                              ? "Saved less than 1 hour ago"
                              : timeSince < 24
                                ? `Saved ${timeSince} hours ago`
                                : `Saved ${Math.floor(timeSince / 24)} days ago`}
                          </span>
                        </span>

                        {partialSave.project_title &&
                          partialSave.project_title !==
                            "Partial Save - In Progress" && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">
                                {partialSave.project_title}
                              </span>
                            </>
                          )}

                        {partialSave.lead_source && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {partialSave.lead_source.replace("-", " ")}
                            </span>
                          </>
                        )}
                      </div>

                      {partialSave.project_description && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {partialSave.project_description}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              const notes = JSON.parse(
                                partialSave.notes || "{}",
                              );
                              const originalData = notes.originalData || {};

                              // Helper function to safely parse JSON strings
                              const safeJsonParse = (
                                jsonString: string,
                                fallback: any = [],
                              ) => {
                                try {
                                  return JSON.parse(jsonString || "[]");
                                } catch {
                                  return fallback;
                                }
                              };

                              // Helper function to convert ISO date to YYYY-MM-DD format
                              const formatDateForInput = (dateValue: any) => {
                                if (!dateValue) return "";
                                if (
                                  typeof dateValue === "string" &&
                                  dateValue.includes("T")
                                ) {
                                  // ISO format, convert to YYYY-MM-DD using local timezone to avoid date shifts
                                  const date = new Date(dateValue);
                                  const year = date.getFullYear();
                                  const month = String(
                                    date.getMonth() + 1,
                                  ).padStart(2, "0");
                                  const day = String(date.getDate()).padStart(
                                    2,
                                    "0",
                                  );
                                  return `${year}-${month}-${day}`;
                                }
                                return dateValue; // Already in correct format
                              };

                              const resumeData = {
                                ...originalData,
                                // Override with database saved values, properly deserializing JSON fields
                                lead_source:
                                  partialSave.lead_source ||
                                  originalData.lead_source,
                                client_name:
                                  partialSave.client_name ===
                                  "PARTIAL_SAVE_IN_PROGRESS"
                                    ? ""
                                    : partialSave.client_name ||
                                      originalData.client_name,
                                project_title:
                                  partialSave.project_title ===
                                  "Partial Save - In Progress"
                                    ? ""
                                    : partialSave.project_title ||
                                      originalData.project_title,
                                project_description:
                                  partialSave.project_description ||
                                  originalData.project_description,
                                project_requirements:
                                  partialSave.project_requirements ||
                                  originalData.project_requirements,

                                // Deserialize JSON fields from database
                                solutions: safeJsonParse(
                                  partialSave.solutions,
                                  originalData.solutions || [],
                                ),
                                contacts: safeJsonParse(
                                  partialSave.contacts,
                                  originalData.contacts || [],
                                ),
                                flat_fee_config: safeJsonParse(
                                  partialSave.flat_fee_config,
                                  originalData.flat_fee_config || [],
                                ),
                                transaction_fee_config: safeJsonParse(
                                  partialSave.transaction_fee_config,
                                  originalData.transaction_fee_config || [],
                                ),

                                // Include other database fields
                                lead_created_by:
                                  partialSave.lead_created_by ||
                                  originalData.lead_created_by,
                                priority_level:
                                  partialSave.priority_level ||
                                  originalData.priority_level,
                                start_date: formatDateForInput(
                                  partialSave.start_date ||
                                    originalData.start_date,
                                ),
                                targeted_end_date: formatDateForInput(
                                  partialSave.targeted_end_date ||
                                    originalData.targeted_end_date,
                                ),
                                expected_close_date: formatDateForInput(
                                  partialSave.expected_close_date ||
                                    originalData.expected_close_date,
                                ),
                                expected_daily_txn_volume:
                                  partialSave.expected_daily_txn_volume ||
                                  originalData.expected_daily_txn_volume,
                                expected_daily_txn_volume_year1:
                                  partialSave.expected_daily_txn_volume_year1 ||
                                  originalData.expected_daily_txn_volume_year1,
                                expected_daily_txn_volume_year2:
                                  partialSave.expected_daily_txn_volume_year2 ||
                                  originalData.expected_daily_txn_volume_year2,
                                expected_daily_txn_volume_year3:
                                  partialSave.expected_daily_txn_volume_year3 ||
                                  originalData.expected_daily_txn_volume_year3,
                                expected_daily_txn_volume_year5:
                                  partialSave.expected_daily_txn_volume_year5 ||
                                  originalData.expected_daily_txn_volume_year5,
                                spoc: partialSave.spoc || originalData.spoc,
                                billing_currency:
                                  partialSave.billing_currency ||
                                  originalData.billing_currency,
                                client_type:
                                  partialSave.client_type ||
                                  originalData.client_type,
                                company_location:
                                  partialSave.company_location ||
                                  originalData.company_location,
                                category:
                                  partialSave.category || originalData.category,
                                country:
                                  partialSave.country || originalData.country,
                                probability:
                                  partialSave.probability ||
                                  originalData.probability,
                                template_id:
                                  partialSave.template_id ||
                                  originalData.template_id,
                                notes: originalData.notes, // Keep the original notes for form use

                                id: partialSave.id, // This is the key field that CreateLead looks for
                                _resumeFromId: partialSave.id,
                                _lastSaved: notes.lastSaved,
                                _completedTabs: notes.completedTabs,
                              };

                              handleResumePartialSave(resumeData);
                            } catch (error) {
                              console.error(
                                "Error resuming partial save:",
                                error,
                              );
                              alert(
                                "Error loading saved data. Please try again.",
                              );
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Saved Draft
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this saved
                                draft? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeletePartialSave(
                                    partialSave.id,
                                    partialSave.client_name ===
                                      "PARTIAL_SAVE_IN_PROGRESS"
                                      ? "Unsaved Lead Draft"
                                      : partialSave.client_name ||
                                          "Untitled Draft",
                                  )
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Draft
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <div className="text-sm text-gray-500">
                        Created: {formatToIST(partialSave.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
