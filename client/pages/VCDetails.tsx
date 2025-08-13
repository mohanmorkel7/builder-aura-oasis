import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { useTemplate, useUpdateVCStep, useDeleteVCStep } from "@/hooks/useApi";
import { VCDraggableStepsList } from "@/components/VCDraggableStepsList";
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
  Target,
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
} from "lucide-react";
import { formatToISTDateTime } from "@/lib/dateUtils";

const statusColors = {
  "in-progress": "bg-blue-100 text-blue-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  completed: "bg-purple-100 text-purple-700",
};

const investorCategoryColors = {
  angel: "bg-blue-100 text-blue-700",
  vc: "bg-green-100 text-green-700",
  private_equity: "bg-purple-100 text-purple-700",
  family_office: "bg-orange-100 text-orange-700",
  merchant_banker: "bg-indigo-100 text-indigo-700",
};

export default function VCDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mock VC details data (replacing failing API calls)
  const getMockVC = (vcId: string) => {
    const mockVCs = {
      "1": {
        id: 1,
        vc_id: "VC-001",
        round_title: "Series A Funding",
        investor_name: "Accel Partners",
        investor_category: "vc",
        status: "in-progress",
        round_stage: "series_a",
        round_size: "$10M",
        valuation: "$40M",
        contact_person: "John Smith",
        email: "john@accel.com",
        phone: "+1-555-0123",
        website: "https://accel.com",
        address: "428 University Ave",
        city: "Palo Alto",
        state: "California",
        country: "United States",
        priority_level: "high",
        lead_source: "referral",
        start_date: new Date(Date.now() - 86400000 * 7).toISOString(),
        targeted_end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        spoc: "Alice Johnson",
        billing_currency: "USD",
        round_description:
          "Series A funding round to expand product development and market reach.",
        potential_lead_investor: true,
        minimum_size: 5000000,
        maximum_size: 15000000,
        minimum_arr_requirement: 2000000,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      "2": {
        id: 2,
        vc_id: "VC-002",
        round_title: "Seed Round",
        investor_name: "Sequoia Capital",
        investor_category: "vc",
        status: "in-progress",
        round_stage: "seed",
        round_size: "$5M",
        valuation: "$20M",
        contact_person: "Sarah Johnson",
        email: "sarah@sequoia.com",
        phone: "+1-555-0456",
        website: "https://sequoiacap.com",
        address: "3000 Sand Hill Rd",
        city: "Menlo Park",
        state: "California",
        country: "United States",
        priority_level: "medium",
        lead_source: "email",
        start_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        targeted_end_date: new Date(Date.now() + 86400000 * 45).toISOString(),
        spoc: "Bob Wilson",
        billing_currency: "USD",
        round_description:
          "Seed funding to validate product-market fit and build initial team.",
        potential_lead_investor: false,
        minimum_size: 2000000,
        maximum_size: 8000000,
        minimum_arr_requirement: 500000,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      "3": {
        id: 3,
        vc_id: "VC-003",
        round_title: "Bridge Round",
        investor_name: "Matrix Partners",
        investor_category: "vc",
        status: "won",
        round_stage: "bridge",
        round_size: "$3M",
        valuation: "$25M",
        contact_person: "Michael Chen",
        email: "michael@matrix.com",
        phone: "+1-555-0789",
        website: "https://matrix.com",
        address: "101 Main St",
        city: "Boston",
        state: "Massachusetts",
        country: "United States",
        priority_level: "high",
        lead_source: "website",
        start_date: new Date(Date.now() - 86400000 * 14).toISOString(),
        targeted_end_date: new Date(Date.now() - 86400000 * 7).toISOString(),
        spoc: "Carol Davis",
        billing_currency: "USD",
        round_description: "Bridge financing to extend runway until Series A.",
        potential_lead_investor: true,
        minimum_size: 1000000,
        maximum_size: 5000000,
        minimum_arr_requirement: 1000000,
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      "4": {
        id: 4,
        vc_id: "VC-004",
        round_title: "Pre-Series A",
        investor_name: "Lightspeed Venture",
        investor_category: "vc",
        status: "in-progress",
        round_stage: "series_a",
        round_size: "$8M",
        valuation: "$32M",
        contact_person: "Emily Davis",
        email: "emily@lightspeed.com",
        phone: "+1-555-0321",
        website: "https://lsvp.com",
        address: "2200 Sand Hill Rd",
        city: "Menlo Park",
        state: "California",
        country: "United States",
        priority_level: "medium",
        lead_source: "social-media",
        start_date: new Date(Date.now() - 86400000 * 1).toISOString(),
        targeted_end_date: new Date(Date.now() + 86400000 * 60).toISOString(),
        spoc: "David Kim",
        billing_currency: "USD",
        round_description:
          "Pre-Series A funding to accelerate growth and prepare for larger institutional round.",
        potential_lead_investor: false,
        minimum_size: 3000000,
        maximum_size: 12000000,
        minimum_arr_requirement: 1500000,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      "5": {
        id: 5,
        vc_id: "VC-005",
        round_title: "Series B Extension",
        investor_name: "Benchmark Capital",
        investor_category: "vc",
        status: "lost",
        round_stage: "series_b",
        round_size: "$15M",
        valuation: "$80M",
        contact_person: "Robert Wilson",
        email: "robert@benchmark.com",
        phone: "+1-555-0654",
        website: "https://benchmark.com",
        address: "2965 Woodside Rd",
        city: "Woodside",
        state: "California",
        country: "United States",
        priority_level: "low",
        lead_source: "event",
        start_date: new Date(Date.now() - 86400000 * 21).toISOString(),
        targeted_end_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        spoc: "Frank Miller",
        billing_currency: "USD",
        round_description:
          "Series B extension round that did not proceed due to market conditions.",
        potential_lead_investor: false,
        minimum_size: 10000000,
        maximum_size: 25000000,
        minimum_arr_requirement: 5000000,
        created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
      },
    };
    return mockVCs[vcId as keyof typeof mockVCs] || null;
  };

  const getMockVCSteps = (vcId: string) => {
    const stepsByVC = {
      "1": [
        {
          id: 1,
          name: "Initial Pitch Deck Review",
          description: "Review and refine pitch deck",
          status: "completed",
          progress: 100,
          created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        },
        {
          id: 2,
          name: "Management Presentation",
          description: "Present to investment committee",
          status: "completed",
          progress: 100,
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
        {
          id: 3,
          name: "Due Diligence Initiation",
          description: "Begin comprehensive due diligence",
          status: "in-progress",
          progress: 65,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 4,
          name: "Term Sheet Negotiation",
          description: "Negotiate terms and valuation",
          status: "pending",
          progress: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 5,
          name: "Legal Documentation",
          description: "Draft and finalize legal agreements",
          status: "pending",
          progress: 0,
          created_at: new Date().toISOString(),
        },
      ],
      "2": [
        {
          id: 4,
          name: "Product Demo",
          description: "Demonstrate product capabilities",
          status: "completed",
          progress: 100,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 5,
          name: "Market Analysis",
          description: "Present market opportunity",
          status: "in-progress",
          progress: 40,
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          id: 6,
          name: "Financial Review",
          description: "Review projections",
          status: "pending",
          progress: 0,
          created_at: new Date().toISOString(),
        },
      ],
      "3": [
        {
          id: 6,
          name: "Term Sheet",
          description: "Finalize terms and close",
          status: "completed",
          progress: 100,
          created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        },
        {
          id: 7,
          name: "Legal Documentation",
          description: "Complete legal agreements",
          status: "completed",
          progress: 100,
          created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
        },
      ],
      "4": [
        {
          id: 8,
          name: "First Introduction Call",
          description: "Initial investor meeting and introduction",
          status: "completed",
          progress: 100,
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          id: 9,
          name: "Product Demo",
          description: "Demonstrate platform capabilities",
          status: "in-progress",
          progress: 90,
          created_at: new Date().toISOString(),
        },
        {
          id: 10,
          name: "Proposal Preparation",
          description: "Prepare detailed funding proposal",
          status: "in-progress",
          progress: 30,
          created_at: new Date().toISOString(),
        },
        {
          id: 11,
          name: "Proposal Review & Negotiation",
          description: "Review terms and negotiate",
          status: "pending",
          progress: 15,
          created_at: new Date().toISOString(),
        },
        {
          id: 12,
          name: "Contract Finalization",
          description: "Finalize legal contracts",
          status: "pending",
          progress: 10,
          created_at: new Date().toISOString(),
        },
        {
          id: 13,
          name: "Onboarding Preparation",
          description: "Prepare for investor onboarding",
          status: "pending",
          progress: 10,
          created_at: new Date().toISOString(),
        },
        {
          id: 14,
          name: "Implementation Planning",
          description: "Plan fund utilization",
          status: "pending",
          progress: 10,
          created_at: new Date().toISOString(),
        },
        {
          id: 15,
          name: "System Integration",
          description: "Integrate investor systems",
          status: "pending",
          progress: 10,
          created_at: new Date().toISOString(),
        },
        {
          id: 16,
          name: "Go-Live & Support",
          description: "Launch with ongoing support",
          status: "pending",
          progress: 10,
          created_at: new Date().toISOString(),
        },
        {
          id: 17,
          name: "Project Closure",
          description: "Close funding round",
          status: "pending",
          progress: 10,
          created_at: new Date().toISOString(),
        },
      ],
      "5": [
        {
          id: 11,
          name: "Initial Contact",
          description: "First investor meeting",
          status: "completed",
          progress: 100,
          created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        },
      ],
    };
    return stepsByVC[vcId as keyof typeof stepsByVC] || [];
  };

  const getMockVCComments = (vcId: string) => {
    const commentsByVC = {
      "1": [
        {
          id: 1,
          message: "Initial pitch went well, moving to due diligence phase.",
          created_by: 1,
          created_by_name: "Alice Johnson",
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 2,
          message: "Need to prepare financial projections for next week.",
          created_by: 2,
          created_by_name: "Bob Smith",
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ],
      "2": [
        {
          id: 3,
          message: "Great product demo, investors are interested.",
          created_by: 1,
          created_by_name: "Carol Davis",
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ],
      "3": [
        {
          id: 4,
          message: "Successfully closed the bridge round!",
          created_by: 1,
          created_by_name: "David Wilson",
          created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        },
      ],
      "4": [
        {
          id: 5,
          message: "Scheduling follow-up meeting with Emily from Lightspeed.",
          created_by: 1,
          created_by_name: "Team Lead",
          created_at: new Date().toISOString(),
        },
        {
          id: 6,
          message:
            "They're interested in our growth metrics and want to see Q4 numbers.",
          created_by: 2,
          created_by_name: "Sales Director",
          created_at: new Date().toISOString(),
        },
      ],
      "5": [
        {
          id: 7,
          message: "Round did not proceed due to market conditions.",
          created_by: 1,
          created_by_name: "Frank Miller",
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
      ],
    };
    return commentsByVC[vcId as keyof typeof commentsByVC] || [];
  };

  // Fetch VC details from API
  const {
    data: vc,
    isLoading,
    error,
    refetch: refetchVC,
  } = useQuery({
    queryKey: ["vc", id],
    queryFn: async () => {
      if (!id) throw new Error("VC ID is required");
      try {
        return await apiClient.request(`/vc/${id}`);
      } catch (error) {
        // For 404 errors, handle silently
        if (error?.message?.includes("404")) {
          const mockData = getMockVC(id);
          if (!mockData) {
            // If mock data doesn't exist either, throw the original 404 error
            throw error;
          }
          return mockData;
        }

        console.error("Failed to fetch VC details:", error);

        // For other errors, try mock data as fallback
        const mockData = getMockVC(id);
        if (!mockData) {
          throw error;
        }
        return mockData;
      }
    },
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch VC steps from API
  const {
    data: vcStepsData,
    isLoading: stepsLoading,
    error: stepsError,
    refetch: refetchSteps,
  } = useQuery({
    queryKey: ["vc-steps", id],
    queryFn: async () => {
      if (!id) throw new Error("VC ID is required");
      try {
        return await apiClient.request(`/vc/${id}/steps`);
      } catch (error) {
        console.error("Failed to fetch VC steps:", error);
        // Fallback to mock data if API fails
        return getMockVCSteps(id);
      }
    },
    enabled: !!id,
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch VC comments from API
  const { data: vcCommentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["vc-comments", id],
    queryFn: async () => {
      if (!id) throw new Error("VC ID is required");
      try {
        return await apiClient.request(`/vc/${id}/comments`);
      } catch (error) {
        console.error("Failed to fetch VC comments:", error);
        // Fallback to mock data if API fails
        return getMockVCComments(id);
      }
    },
    enabled: !!id,
    retry: 2,
    staleTime: 1 * 60 * 1000,
  });

  // Fetch template data if VC has a template_id
  const templateId = (vc as any)?.template_id;
  const { data: templateData, isLoading: templateLoading } = useTemplate(
    templateId || 0,
  );

  // Fetch available VCs to suggest alternatives on 404 errors
  const { data: availableVCs = [] } = useQuery({
    queryKey: ["available-vcs"],
    queryFn: async () => {
      try {
        return await apiClient.request("/vc");
      } catch (error) {
        return [];
      }
    },
    enabled: !!error && error?.message?.includes("404"), // Only fetch when there's a 404 error
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Ensure data is always arrays/objects to prevent undefined errors
  const vcSteps = Array.isArray(vcStepsData) ? vcStepsData : [];
  const vcComments = Array.isArray(vcCommentsData) ? vcCommentsData : [];
  const refetchComments = () => {};

  // VC-specific mutations
  const deleteVCStepMutation = useDeleteVCStep();

  const createStepMutation = useMutation({
    mutationFn: (stepData: any) =>
      apiClient.request(`/vc/${id}/steps`, {
        method: "POST",
        body: JSON.stringify(stepData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc-steps", id] });
      setIsAddStepOpen(false);
      resetNewStepForm();
    },
  });

  const updateVCStatusMutation = useMutation({
    mutationFn: (status: string) =>
      apiClient.request(`/vc/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc", id] });
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment: string) =>
      apiClient.request(`/vc/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          message: comment,
          created_by: parseInt(user?.id || "1"),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc-comments", id] });
      setNewComment("");
    },
  });

  const reorderStepsMutation = useMutation({
    mutationFn: (stepOrders: Array<{ id: number; order_index: number }>) =>
      apiClient.request(`/vc/${id}/steps/reorder`, {
        method: "PUT",
        body: JSON.stringify({ stepOrders }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc-steps", id] });
    },
  });

  const [newStepForm, setNewStepForm] = useState({
    name: "",
    description: "",
    priority: "medium" as const,
    assigned_to: "",
    due_date: "",
  });

  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [newComment, setNewComment] = useState("");

  const resetNewStepForm = () => {
    setNewStepForm({
      name: "",
      description: "",
      priority: "medium",
      assigned_to: "",
      due_date: "",
    });
  };

  const handleBack = () => {
    navigate("/vc");
  };

  const handleToggleExpansion = (stepId: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      await deleteVCStepMutation.mutateAsync(stepId);
    } catch (error) {
      console.error("Failed to delete VC step:", error);
    }
  };

  const handleReorderSteps = (newSteps: any[]) => {
    const stepOrders = newSteps.map((step, index) => ({
      id: step.id,
      order_index: index,
    }));
    reorderStepsMutation.mutate(stepOrders);
  };

  const handleAddStep = () => {
    if (!newStepForm.name.trim()) return;

    createStepMutation.mutate({
      ...newStepForm,
      created_by: parseInt(user?.id || "1"),
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateVCStatusMutation.mutate(newStatus);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
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

  const formatCurrency = (amount: string, currency: string = "INR") => {
    if (!amount) return "N/A";

    // If amount already includes a currency symbol, return as is
    if (
      amount.includes("$") ||
      amount.includes("₹") ||
      amount.includes("د.إ")
    ) {
      return amount;
    }

    const symbol = currency === "USD" ? "$" : currency === "AED" ? "د.إ" : "₹";
    return `${symbol}${amount}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // Enhanced error handling with better 404 detection
  if (error || (!isLoading && !vc)) {
    const is404Error =
      error?.message?.includes("404") || error?.message?.includes("Not Found");

    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              VC Opportunity Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              {is404Error
                ? `VC with ID ${id} was not found in the database. It may have been deleted or doesn't exist.`
                : "The VC opportunity you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            {is404Error && availableVCs.length > 0 && (
              <div className="text-sm text-gray-500 mb-4">
                <p className="mb-2">Available VCs:</p>
                <div className="flex flex-wrap gap-2">
                  {availableVCs.slice(0, 5).map((vc: any) => (
                    <Button
                      key={vc.id}
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/vc/${vc.id}`)}
                    >
                      VC #{vc.id}:{" "}
                      {vc.round_title || vc.investor_name || "Untitled"}
                    </Button>
                  ))}
                </div>
                {availableVCs.length > 5 && (
                  <p className="mt-2 text-xs">
                    ...and {availableVCs.length - 5} more available in the VC
                    Dashboard
                  </p>
                )}
              </div>
            )}
            {is404Error && availableVCs.length === 0 && (
              <p className="text-sm text-gray-500 mb-4">
                No VCs found in the database. Try creating a new VC opportunity.
              </p>
            )}
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to VC Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Parse contacts if they're stored as JSON string
  let contacts = [];
  try {
    contacts = vc.contacts ? JSON.parse(vc.contacts) : [];
  } catch (e) {
    contacts = [];
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to VC Dashboard
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {vc.round_title || "Untitled Round"}
              </h1>
              {vc.vc_id && <Badge variant="secondary">{vc.vc_id}</Badge>}
            </div>
            <p className="text-gray-600 mt-1">
              {vc.investor_name} •{" "}
              {vc.investor_category?.replace("_", " ").toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={vc.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate(`/vc/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Round Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(vc.status)}
                    <Badge
                      className={`${statusColors[vc.status as keyof typeof statusColors]} border-0`}
                    >
                      {vc.status?.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Round Stage</Label>
                    <p className="font-medium">
                      {vc.round_stage
                        ? vc.round_stage.replace("_", " ").toUpperCase()
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Round Size</Label>
                    <p className="font-medium">
                      {formatCurrency(vc.round_size, vc.billing_currency)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Valuation</Label>
                    <p className="font-medium">
                      {formatCurrency(vc.valuation, vc.billing_currency)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Priority</Label>
                    <Badge variant="outline" className="ml-2">
                      {vc.priority_level?.toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Start Date</Label>
                    <p className="font-medium">
                      {vc.start_date
                        ? formatToISTDateTime(vc.start_date)
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">
                      Target Close
                    </Label>
                    <p className="font-medium">
                      {vc.targeted_end_date
                        ? formatToISTDateTime(vc.targeted_end_date)
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">SPOC</Label>
                    <p className="font-medium">{vc.spoc || "N/A"}</p>
                  </div>
                </div>
              </div>

              {vc.round_description && (
                <div>
                  <Label className="text-sm text-gray-600">Description</Label>
                  <p className="mt-1 text-gray-900">{vc.round_description}</p>
                </div>
              )}

              {/* Progress Bar Section - Similar to LeadDetails */}
              {vcSteps &&
                vcSteps.length > 0 &&
                (() => {
                  const completedSteps = vcSteps.filter(
                    (step) => step?.status === "completed",
                  ).length;
                  const inProgressSteps = vcSteps.filter(
                    (step) => step?.status === "in-progress",
                  ).length;
                  const totalSteps = vcSteps.length;

                  // Calculate completion percentage based on status
                  const completionPercentage =
                    totalSteps > 0
                      ? Math.round(
                          ((completedSteps + inProgressSteps * 0.5) /
                            totalSteps) *
                            100,
                        )
                      : 0;

                  return (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">
                          Progress:
                        </span>
                        <div className="flex-1 max-w-sm">
                          <div className="w-full bg-gray-200 rounded-full h-3 relative">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                completionPercentage === 100
                                  ? "bg-green-500"
                                  : completionPercentage >= 75
                                    ? "bg-blue-500"
                                    : completionPercentage >= 50
                                      ? "bg-yellow-500"
                                      : completionPercentage >= 25
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                              }`}
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                            {completionPercentage > 0 && (
                              <div
                                className="absolute top-0 h-3 w-1 bg-white opacity-75 rounded-full"
                                style={{ left: `${completionPercentage}%` }}
                              ></div>
                            )}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600">
                            {completionPercentage}% Complete
                          </div>
                          <div className="text-xs text-gray-500">
                            {completedSteps} of {totalSteps} steps
                          </div>
                        </div>
                      </div>

                      {/* Step-by-step breakdown */}
                      <div className="mt-2 text-xs text-gray-600">
                        <details className="cursor-pointer">
                          <summary className="hover:text-gray-800 select-none">
                            📊 View detailed progress breakdown
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded border space-y-1">
                            {vcSteps.map((step) => (
                              <div
                                key={step.id}
                                className="flex justify-between items-center"
                              >
                                <span className="flex items-center space-x-2">
                                  {step.status === "completed" ? (
                                    <span className="text-green-600">✓</span>
                                  ) : step.status === "in-progress" ? (
                                    <span className="text-blue-600">⋯</span>
                                  ) : (
                                    <span className="text-gray-400">○</span>
                                  )}
                                  <span
                                    className={
                                      step.status === "completed"
                                        ? "line-through text-gray-500"
                                        : ""
                                    }
                                  >
                                    {step.name}
                                  </span>
                                </span>
                                <span className="font-medium">
                                  {step.progress || 0}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })()}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Investor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Investor</Label>
                <p className="font-medium">{vc.investor_name}</p>
                {vc.investor_category && (
                  <Badge
                    className={`${investorCategoryColors[vc.investor_category as keyof typeof investorCategoryColors]} border-0 text-xs mt-1`}
                  >
                    {vc.investor_category.replace("_", " ").toUpperCase()}
                  </Badge>
                )}
              </div>

              <div>
                <Label className="text-sm text-gray-600">Primary Contact</Label>
                <p className="font-medium">{vc.contact_person || "N/A"}</p>
              </div>

              <div className="space-y-2">
                {vc.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${vc.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {vc.email}
                    </a>
                  </div>
                )}
                {vc.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a
                      href={`tel:${vc.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {vc.phone}
                    </a>
                  </div>
                )}
                {vc.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a
                      href={vc.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {vc.website}
                    </a>
                  </div>
                )}
              </div>

              {(vc.address || vc.city || vc.state || vc.country) && (
                <div>
                  <Label className="text-sm text-gray-600">Address</Label>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm">
                      {vc.address && <p>{vc.address}</p>}
                      <p>
                        {[vc.city, vc.state, vc.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Investment Details */}
              <Separator />
              <div>
                <Label className="text-sm text-gray-600">
                  Investment Range
                </Label>
                <div className="mt-1">
                  {vc.minimum_size && (
                    <p className="text-sm">
                      Min:{" "}
                      {formatCurrency(
                        vc.minimum_size.toString(),
                        vc.billing_currency,
                      )}
                    </p>
                  )}
                  {vc.maximum_size && (
                    <p className="text-sm">
                      Max:{" "}
                      {formatCurrency(
                        vc.maximum_size.toString(),
                        vc.billing_currency,
                      )}
                    </p>
                  )}
                  {vc.minimum_arr_requirement && (
                    <p className="text-sm">
                      Min ARR:{" "}
                      {formatCurrency(
                        vc.minimum_arr_requirement.toString(),
                        vc.billing_currency,
                      )}
                    </p>
                  )}
                </div>
              </div>

              {vc.potential_lead_investor && (
                <div>
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Potential Lead Investor
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Steps Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {templateLoading
                  ? "Loading..."
                  : templateData?.name
                    ? `${templateData.name} Pipeline`
                    : "Round Steps"}
              </CardTitle>
              <CardDescription>
                {templateLoading
                  ? "Loading template details..."
                  : templateData?.description ||
                    "Track the progress of this funding round"}
              </CardDescription>
            </div>
            <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Step</DialogTitle>
                  <DialogDescription>
                    Create a new step for this VC round.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="step-name">Step Name *</Label>
                    <Input
                      id="step-name"
                      value={newStepForm.name}
                      onChange={(e) =>
                        setNewStepForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Due Diligence Review"
                    />
                  </div>
                  <div>
                    <Label htmlFor="step-description">Description</Label>
                    <Textarea
                      id="step-description"
                      value={newStepForm.description}
                      onChange={(e) =>
                        setNewStepForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe what needs to be done..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="step-priority">Priority</Label>
                      <Select
                        value={newStepForm.priority}
                        onValueChange={(value) =>
                          setNewStepForm((prev) => ({
                            ...prev,
                            priority: value as any,
                          }))
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
                      <Label htmlFor="step-due-date">Due Date</Label>
                      <Input
                        id="step-due-date"
                        type="date"
                        value={newStepForm.due_date}
                        onChange={(e) =>
                          setNewStepForm((prev) => ({
                            ...prev,
                            due_date: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddStepOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddStep}
                    disabled={
                      !newStepForm.name.trim() || createStepMutation.isPending
                    }
                  >
                    {createStepMutation.isPending ? "Adding..." : "Add Step"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Template Steps Section - Always show when template exists */}
          {templateData?.steps && templateData.steps.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-blue-700">
                  📋 Template Steps Reference ({templateData.steps.length} steps)
                </div>
                {vcSteps.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      if (confirm("This will replace all existing steps with template steps. Are you sure?")) {
                        alert("Template step population not implemented yet - please create steps manually based on the template.");
                      }
                    }}
                  >
                    Use Template
                  </Button>
                )}
              </div>
              <div className="text-xs text-blue-600 mb-3">
                {vcSteps.length > 0
                  ? `${templateData.name} template provides ${templateData.steps.length} specialized VC steps. Your current ${vcSteps.length} steps are generic.`
                  : `Create steps based on the ${templateData.name} template for better VC tracking.`
                }
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {templateData.steps.map((step: any, index: number) => (
                  <div
                    key={step.id}
                    className="p-3 bg-white border border-blue-300 rounded-lg"
                  >
                    <div className="font-medium text-blue-800 text-sm mb-1">
                      {index + 1}. {step.name}
                    </div>
                    {step.description && (
                      <div className="text-blue-600 text-xs mb-2">
                        {step.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-500">
                        ~{step.estimated_days || step.default_eta_days || 1} days
                      </span>
                      <span className="text-blue-500">
                        {step.probability_percent || 20}% prob
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actual Steps Section */}
          {stepsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading steps...</p>
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
            <div className="space-y-4">
              {/* Show template steps when VC has a template */}
              {templateData?.steps && templateData.steps.length > 0 ? (
                <>
                  <div className="text-sm font-medium text-blue-700 mb-2">
                    📋 Template Steps Reference ({templateData.steps.length}{" "}
                    steps)
                  </div>
                  <div className="text-xs text-blue-600 mb-2">
                    These are template steps from "{templateData.name}".{" "}
                    {vcSteps.length > 0
                      ? "You have existing steps, but you can replace them with template steps."
                      : "Create VC-specific steps to start tracking progress."}
                  </div>
                  {vcSteps.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800 mb-2">
                        ⚠️ Current Steps vs Template Steps
                      </div>
                      <div className="text-xs text-yellow-700 mb-2">
                        You have {vcSteps.length} existing steps, but this VC
                        uses the "{templateData.name}" template with{" "}
                        {templateData.steps.length} specialized steps. Consider
                        replacing your current steps with template steps for
                        better tracking.
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          if (
                            confirm(
                              "This will replace all existing steps with template steps. Are you sure?",
                            )
                          ) {
                            // TODO: Implement template step population
                            alert(
                              "Template step population not implemented yet - please create steps manually based on the template.",
                            );
                          }
                        }}
                      >
                        Replace with Template Steps
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {templateData.steps
                      .slice(0, 6)
                      .map((step: any, index: number) => (
                        <div
                          key={index}
                          className="p-2 bg-blue-50 border border-blue-200 rounded text-xs"
                        >
                          <div className="font-medium text-blue-800">
                            {index + 1}. {step.name}
                          </div>
                          {step.description && (
                            <div className="text-blue-600 mt-1">
                              {step.description}
                            </div>
                          )}
                          <div className="text-blue-500 mt-1">
                            ~{step.estimated_days || step.default_eta_days || 1}{" "}
                            days
                          </div>
                        </div>
                      ))}
                    {templateData.steps.length > 6 && (
                      <div className="flex items-center justify-center p-2 bg-blue-100 rounded text-xs text-blue-600">
                        +{templateData.steps.length - 6} more template steps
                      </div>
                    )}
                  </div>
                </>
              ) : templateData?.steps && templateData.steps.length > 0 ? (
                <div className="text-center py-8">
                  <div className="text-blue-600 mb-4">
                    <Target className="w-12 h-12 mx-auto opacity-50 mb-2" />
                    <p className="text-lg font-medium">Template Available</p>
                    <p className="text-gray-600 mb-4">
                      This VC uses the "{templateData.name}" template with{" "}
                      {templateData.steps.length} specialized steps. View the
                      template steps above and create your VC-specific tracking
                      steps.
                    </p>
                  </div>
                  <div className="text-xs text-blue-600 mb-4">
                    ���� Tip: Use the template steps as a guide to create
                    VC-specific tracking steps.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <Target className="w-12 h-12 mx-auto opacity-50 mb-2" />
                    <p className="text-lg font-medium">No steps yet</p>
                    <p className="text-gray-600 mb-4">
                      Create custom steps to track your funding process for this
                      VC.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Contacts */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {contact.contact_name || "Unnamed Contact"}
                    </span>
                  </div>
                  {contact.designation && (
                    <p className="text-sm text-gray-600 mb-2">
                      {contact.designation}
                    </p>
                  )}
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.linkedin && (
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <a
                          href={contact.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
