import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useLeads,
  useLeadStats,
  useDeleteLead,
  useMyPartialSaves,
  useLeadProgressDashboard,
  useTemplateStepDashboard,
  useFollowUps,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Target,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from "lucide-react";

export default function VCDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteLeadId, setDeleteLeadId] = useState<number | null>(null);

  // For now, use the same hooks as leads - we'll update these later for VC-specific endpoints
  const {
    data: vcList = [],
    isLoading: vcLoading,
    error: vcError,
    refetch: refetchVCs,
  } = useLeads();

  const {
    data: vcStats,
    isLoading: statsLoading,
    error: statsError,
  } = useLeadStats();

  const {
    data: partialSaves = [],
    isLoading: partialSavesLoading,
    error: partialSavesError,
  } = useMyPartialSaves();

  const deleteVCMutation = useDeleteLead();

  // Filter and sort VCs
  const filteredVCs = vcList
    .filter((vc: any) => {
      const matchesSearch =
        vc.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.lead_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.client_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || vc.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      const aValue = a[sortBy] || "";
      const bValue = b[sortBy] || "";

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const handleCreateVC = () => {
    navigate("/vc/create");
  };

  const handleViewVC = (vcId: number) => {
    navigate(`/vc/${vcId}`);
  };

  const handleEditVC = (vcId: number) => {
    navigate(`/vc/${vcId}/edit`);
  };

  const handleDeleteVC = async () => {
    if (!deleteLeadId) return;

    try {
      await deleteVCMutation.mutateAsync(deleteLeadId);
      refetchVCs();
      setDeleteLeadId(null);
    } catch (error) {
      console.error("Failed to delete VC:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "won":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Won
          </Badge>
        );
      case "lost":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Lost
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (vcLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading VC dashboard...</div>
      </div>
    );
  }

  if (vcError || statsError) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-600">
          Error loading VC data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">VC Dashboard</h1>
          <p className="text-gray-600">
            Manage your venture capital opportunities and investor relationships
          </p>
        </div>
        <Button onClick={handleCreateVC} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create VC</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total VCs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vcStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vcStats?.in_progress || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vcStats?.won || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vcStats?.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search VCs by round title, VC ID, or investor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="project_title">Round Title</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="client_name">Investor Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* VCs Table */}
      <Card>
        <CardHeader>
          <CardTitle>VC Opportunities</CardTitle>
          <CardDescription>
            Overview of all your venture capital opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VC ID</TableHead>
                <TableHead>Round Title</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVCs.map((vc: any) => (
                <TableRow key={vc.id}>
                  <TableCell className="font-medium">{vc.lead_id}</TableCell>
                  <TableCell>{vc.project_title || "Untitled Round"}</TableCell>
                  <TableCell>{vc.client_name || "Unknown Investor"}</TableCell>
                  <TableCell>{getStatusBadge(vc.status)}</TableCell>
                  <TableCell>
                    {new Date(vc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVC(vc.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditVC(vc.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteLeadId(vc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredVCs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No VCs found. {searchTerm && "Try adjusting your search terms."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteLeadId} onOpenChange={() => setDeleteLeadId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete VC</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this VC opportunity? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLeadId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVC}
              disabled={deleteVCMutation.isPending}
            >
              {deleteVCMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
