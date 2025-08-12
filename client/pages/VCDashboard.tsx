import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
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
  DollarSign,
  Briefcase,
  Eye,
  Edit,
  Calendar,
  AlertCircle,
  PieChart,
  BarChart3,
  Activity,
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

const investorCategoryColors = {
  angel: "bg-blue-100 text-blue-700",
  vc: "bg-green-100 text-green-700",
  private_equity: "bg-purple-100 text-purple-700",
  family_office: "bg-orange-100 text-orange-700",
  merchant_banker: "bg-indigo-100 text-indigo-700",
};

export default function VCDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch VCs
  const {
    data: vcList = [],
    isLoading: vcLoading,
    error: vcError,
    refetch: refetchVCs,
  } = useQuery({
    queryKey: ["vcs", statusFilter, categoryFilter, searchTerm],
    queryFn: () => {
      let url = "/vc";
      const params = new URLSearchParams();
      
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("investor_category", categoryFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      return apiClient.request(url);
    },
    retry: 1,
  });

  // Fetch VC stats
  const {
    data: vcStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["vc-stats"],
    queryFn: () => apiClient.request("/vc/stats"),
    retry: 1,
  });

  // Mock data for follow-ups and progress since these endpoints don't exist yet
  const vcFollowUps = [
    {
      id: 1,
      vc_id: 1,
      round_title: "Series A Funding",
      investor_name: "Accel Partners",
      is_due: true,
      is_overdue: false,
      due_date: new Date().toISOString(),
    },
    {
      id: 2,
      vc_id: 2,
      round_title: "Seed Round",
      investor_name: "Sequoia Capital",
      is_due: false,
      is_overdue: true,
      due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    },
  ];

  const vcProgressData = [
    {
      round_title: "Series A Funding",
      investor_name: "Accel Partners",
      status: "in-progress",
      progress: 65,
    },
    {
      round_title: "Seed Round",
      investor_name: "Sequoia Capital",
      status: "in-progress",
      progress: 40,
    },
    {
      round_title: "Bridge Round",
      investor_name: "Matrix Partners",
      status: "won",
      progress: 100,
    },
  ];

  const followUpsLoading = false;
  const progressLoading = false;

  // Fetch VC templates for quick insights
  const {
    data: vcTemplates = [],
    isLoading: templatesLoading,
  } = useQuery({
    queryKey: ["vc-templates-dashboard"],
    queryFn: async () => {
      try {
        const categories = await apiClient.request("/templates-production/categories");
        const vcCategory = categories.find((cat: any) => cat.name === "VC");
        
        if (vcCategory) {
          return await apiClient.request(`/templates-production/category/${vcCategory.id}`);
        }
        return [];
      } catch (error) {
        console.error("Error fetching VC templates:", error);
        return [];
      }
    },
    retry: 1,
  });

  // Filter and sort VCs
  const filteredVCs = vcList
    .filter((vc: any) => {
      const matchesSearch =
        vc.round_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.vc_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.investor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || vc.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || vc.investor_category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a: any, b: any) => {
      const aValue = a[sortBy] || "";
      const bValue = b[sortBy] || "";
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleDeleteVC = async (vcId: number) => {
    try {
      await apiClient.request(`/vc/${vcId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
      queryClient.invalidateQueries({ queryKey: ["vc-stats"] });
    } catch (error) {
      console.error("Failed to delete VC:", error);
      alert("Failed to delete VC. Please try again.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "won":
        return <CheckCircle className="w-4 h-4" />;
      case "lost":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <Target className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    const IconComponent = sourceIcons[source as keyof typeof sourceIcons] || Zap;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatCurrency = (amount: string, currency: string = "INR") => {
    if (!amount) return "N/A";
    const symbol = currency === "USD" ? "$" : currency === "AED" ? "د.إ" : "₹";
    return `${symbol}${amount}`;
  };

  if (vcError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load VC Data
            </h3>
            <p className="text-gray-600 mb-4">
              There was an error loading the VC dashboard.
            </p>
            <Button onClick={() => refetchVCs()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">VC Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage venture capital opportunities and funding rounds
          </p>
        </div>
        <Button onClick={() => navigate("/vc/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Create VC Opportunity
        </Button>
      </div>

      {/* Statistics Cards - Enhanced with Gradients */}
      {!statsLoading && vcStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Opportunities</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {vcStats.total || 0}
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
                    {vcStats.in_progress || 0}
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
                  <p className="text-green-600 text-sm font-medium">Successful Rounds</p>
                  <p className="text-2xl font-bold text-green-900">{vcStats.won || 0}</p>
                </div>
                <div className="bg-green-200 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">VC Templates</p>
                  <p className="text-2xl font-bold text-purple-900">{vcTemplates.length}</p>
                </div>
                <div className="bg-purple-200 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search opportunities, investors, or round titles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by investor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Investors</SelectItem>
                <SelectItem value="angel">Angel</SelectItem>
                <SelectItem value="vc">VC</SelectItem>
                <SelectItem value="private_equity">Private Equity</SelectItem>
                <SelectItem value="family_office">Family Office</SelectItem>
                <SelectItem value="merchant_banker">Merchant Banker</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split("-");
              setSortBy(field);
              setSortOrder(order as "asc" | "desc");
            }}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="round_title-asc">Round A-Z</SelectItem>
                <SelectItem value="round_title-desc">Round Z-A</SelectItem>
                <SelectItem value="investor_name-asc">Investor A-Z</SelectItem>
                <SelectItem value="investor_name-desc">Investor Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* VC Progress Chart */}
      {vcProgressData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              VC Progress Dashboard
            </CardTitle>
            <CardDescription>
              Track each VC opportunity's current stage and funding progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-4">
                All VC Opportunities Progress ({vcProgressData.length} rounds)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vcProgressData.map((vcProgress: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm truncate">
                        {vcProgress.round_title || 'Untitled Round'}
                      </h4>
                      <Badge className={`${statusColors[vcProgress.status as keyof typeof statusColors]} border-0 text-xs`}>
                        {vcProgress.status?.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{vcProgress.investor_name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{vcProgress.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${vcProgress.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-ups Due and Overdue */}
      {!followUpsLoading && vcFollowUps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Follow-ups Due
              </CardTitle>
              <CardDescription>
                VC opportunities requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vcFollowUps.filter((followUp: any) => followUp.is_due && !followUp.is_overdue).slice(0, 5).map((followUp: any) => (
                  <div key={followUp.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{followUp.round_title}</p>
                      <p className="text-xs text-gray-600">{followUp.investor_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-orange-600 font-medium">Due Today</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 h-6 px-2 text-xs"
                        onClick={() => navigate(`/vc/${followUp.vc_id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No follow-ups due today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Overdue Follow-ups
              </CardTitle>
              <CardDescription>
                VC opportunities that need urgent attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vcFollowUps.filter((followUp: any) => followUp.is_overdue).slice(0, 5).map((followUp: any) => (
                  <div key={followUp.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{followUp.round_title}</p>
                      <p className="text-xs text-gray-600">{followUp.investor_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-red-600 font-medium">Overdue</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 h-6 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => navigate(`/vc/${followUp.vc_id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No overdue follow-ups</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VC Opportunities List */}
      <Card>
        <CardHeader>
          <CardTitle>VC Opportunities ({filteredVCs.length})</CardTitle>
          <CardDescription>
            Manage your venture capital funding opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vcLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading VC opportunities...</p>
            </div>
          ) : filteredVCs.length > 0 ? (
            <div className="space-y-4">
              {filteredVCs.map((vc: any) => (
                <div
                  key={vc.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {vc.round_title || "Untitled Round"}
                            </h3>
                            <Badge variant="secondary">{vc.vc_id}</Badge>
                            {vc.status && (
                              <Badge
                                className={`${statusColors[vc.status as keyof typeof statusColors]} border-0`}
                              >
                                {getStatusIcon(vc.status)}
                                <span className="ml-1 capitalize">{vc.status.replace("-", " ")}</span>
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-600">Investor</p>
                              <p className="font-medium">{vc.investor_name || "N/A"}</p>
                              {vc.investor_category && (
                                <Badge
                                  className={`${investorCategoryColors[vc.investor_category as keyof typeof investorCategoryColors]} border-0 text-xs`}
                                >
                                  {vc.investor_category.replace("_", " ").toUpperCase()}
                                </Badge>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-gray-600">Round Details</p>
                              <p className="font-medium">
                                {vc.round_stage ? vc.round_stage.replace("_", " ").toUpperCase() : "N/A"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(vc.round_size, vc.billing_currency)}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-600">Contact</p>
                              <p className="font-medium">{vc.contact_person || "N/A"}</p>
                              <p className="text-sm text-gray-500">{vc.email || "N/A"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              {getSourceIcon(vc.lead_source)}
                              <span className="capitalize">{vc.lead_source?.replace("-", " ")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Created {formatToIST(vc.created_at)}</span>
                            </div>
                            {vc.priority_level && (
                              <Badge
                                className={`${priorityColors[vc.priority_level as keyof typeof priorityColors]} border-0 text-xs`}
                              >
                                {vc.priority_level.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/vc/${vc.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/vc/${vc.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete VC Opportunity</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{vc.round_title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVC(vc.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No VC Opportunities Found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Get started by creating your first VC opportunity."}
              </p>
              <Button onClick={() => navigate("/vc/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create VC Opportunity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
