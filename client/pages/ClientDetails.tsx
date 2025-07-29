import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClient } from "@/hooks/useApi";
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
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

const statusColors = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  onboarding: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

// Mock follow-up data
const mockFollowUps = [
  {
    id: 1,
    description: "Follow up on missing tax documents",
    due_date: "2024-07-15",
    status: "overdue",
    assigned_to: "Jane Smith",
  },
  {
    id: 2,
    description: "Schedule follow-up call for contract review",
    due_date: "2024-07-10",
    status: "overdue",
    assigned_to: "Jane Smith",
  },
  {
    id: 3,
    description: "Send welcome packet",
    due_date: "2024-07-20",
    status: "pending",
    assigned_to: "Jane Smith",
  },
  {
    id: 4,
    description: "Confirm initial setup requirements",
    due_date: "2024-07-25",
    status: "upcoming",
    assigned_to: "Jane Smith",
  },
];

// Mock onboarding progress
const mockOnboardingProgress = [
  {
    name: "Initial Contact",
    status: "completed",
    completed_date: "2024-06-15",
  },
  { name: "Proposal Sent", status: "completed", completed_date: "2024-06-20" },
  {
    name: "Document Collection",
    status: "in_progress",
    due_date: "2024-07-15",
  },
  { name: "Contract Signing", status: "pending", due_date: "2024-07-25" },
  { name: "Onboarding Call", status: "pending", due_date: "2024-08-01" },
  { name: "Deployment", status: "pending", due_date: "2024-08-10" },
];

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading, error } = useClient(parseInt(id || "0"));

  const handleBack = () => {
    navigate("/sales");
  };

  const handleEdit = () => {
    navigate(`/sales/client/${id}/edit`);
  };

  const handleAddFollowUp = () => {
    navigate(`/sales/client/${id}/followup/new`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading client details...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading client details
        </div>
      </div>
    );
  }

  const clientData = client as any;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {clientData.client_name}
            </h1>
            <p className="text-gray-600 mt-1">
              Client Details & Onboarding Progress
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleAddFollowUp}>
            <Calendar className="w-4 h-4 mr-2" />
            Add Follow-up
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Client Overview</CardTitle>
              <CardDescription>
                Basic client information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Client Name:
                      </span>
                      <span className="text-gray-900">
                        {clientData.client_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">Status:</span>
                      <Badge className={statusColors[clientData.status]}>
                        {clientData.status.charAt(0).toUpperCase() +
                          clientData.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Priority:
                      </span>
                      <Badge className={priorityColors[clientData.priority]}>
                        {clientData.priority.charAt(0).toUpperCase() +
                          clientData.priority.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Industry:
                      </span>
                      <span className="text-gray-900">
                        {clientData.industry || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Company Size:
                      </span>
                      <span className="text-gray-900">
                        {clientData.company_size || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Contact Person:
                      </span>
                      <span className="text-gray-900">
                        {clientData.contact_person}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Email:</span>
                      <a
                        href={`mailto:${clientData.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {clientData.email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span className="text-gray-900">
                        {clientData.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Expected Value:
                      </span>
                      <span className="text-gray-900">
                        {clientData.expected_value
                          ? `$${clientData.expected_value.toLocaleString()}`
                          : "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Start Date:
                      </span>
                      <span className="text-gray-900">
                        {clientData.start_date
                          ? new Date(clientData.start_date).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {clientData.address && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Address:
                      </span>
                    </div>
                    <div className="pl-6 text-gray-900">
                      <div>{clientData.address}</div>
                      <div>
                        {clientData.city}, {clientData.state}{" "}
                        {clientData.zip_code}
                      </div>
                      <div>{clientData.country}</div>
                    </div>
                  </div>
                </>
              )}

              {clientData.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Notes:</span>
                    </div>
                    <div className="pl-6 text-gray-900 whitespace-pre-wrap">
                      {clientData.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Onboarding Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>
                Track the client onboarding workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOnboardingProgress.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {step.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : step.status === "in_progress" ? (
                        <Clock className="w-6 h-6 text-blue-600" />
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {step.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {step.status === "completed" &&
                          step.completed_date &&
                          `Completed on ${new Date(step.completed_date).toLocaleDateString()}`}
                        {step.status !== "completed" &&
                          step.due_date &&
                          `Due: ${new Date(step.due_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Badge
                      className={
                        step.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : step.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }
                    >
                      {step.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Follow-up Tracker */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Tracker</CardTitle>
              <CardDescription>Manage client follow-up tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFollowUps.map((followUp) => (
                  <div key={followUp.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {followUp.description}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Due:{" "}
                          {new Date(followUp.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          followUp.status === "overdue"
                            ? "bg-red-100 text-red-700"
                            : followUp.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                        }
                      >
                        {followUp.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Assigned to: {followUp.assigned_to}
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Building className="w-4 h-4 mr-2" />
                View Company Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
