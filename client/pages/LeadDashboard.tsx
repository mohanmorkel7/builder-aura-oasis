import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeads, useLeadStats } from "@/hooks/useApi";
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
} from "lucide-react";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const handleCreateLead = () => {
    navigate("/leads/new");
  };

  const handleLeadClick = (leadId: number) => {
    navigate(`/leads/${leadId}`);
  };

  // Filter leads based on search and filters
  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch =
      lead.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lead_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.contacts && lead.contacts.some((contact: any) =>
        contact.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
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
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="grid gap-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No leads found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || sourceFilter !== "all"
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
              sourceIcons[lead.lead_source as keyof typeof sourceIcons] || Zap;

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
                          <span className="capitalize">
                            {lead.lead_source.replace("-", " ")}
                          </span>
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

                    <div className="text-right">
                      {lead.project_budget && (
                        <div className="text-lg font-semibold text-green-600 mb-1">
                          ${lead.project_budget?.toLocaleString()}
                        </div>
                      )}
                      {lead.expected_close_date && (
                        <div className="text-sm text-gray-500">
                          Expected:{" "}
                          {new Date(
                            lead.expected_close_date,
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      {lead.company && <span>Company: {lead.company}</span>}
                      {lead.industry && <span>Industry: {lead.industry}</span>}
                      {lead.sales_rep_name && (
                        <span>Rep: {lead.sales_rep_name}</span>
                      )}
                    </div>
                    <div>
                      Created: {new Date(lead.created_at).toLocaleDateString()}
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
