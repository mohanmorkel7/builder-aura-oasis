import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateLead } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  ArrowLeft,
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Info,
  Briefcase,
  Target,
  Users,
  Globe,
  Award,
  Zap,
} from "lucide-react";

const leadSources = [
  { value: "email", label: "Email", icon: Mail },
  { value: "social-media", label: "Social Media", icon: Users },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "website", label: "Website", icon: Globe },
  { value: "referral", label: "Referral", icon: Award },
  { value: "cold-call", label: "Cold Call", icon: Phone },
  { value: "event", label: "Event", icon: Briefcase },
  { value: "other", label: "Other", icon: Zap },
];

const priorities = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

const solutionsOptions = [
  "CardToken",
  "MylapaySecure",
  "FRM",
  "Switch-Cards",
  "Clearing-Base II",
  "Optimizer-Cards",
  "Switch-UPI",
  "Optimizer-UPI",
  "Chargeback",
  "NetworkConnectivity",
  "Orchestration"
];

const commercialsOptions = [
  "CardToken",
  "MylapaySecure",
  "FRM",
  "Switch-Cards",
  "Clearing-Base II",
  "Optimizer-Cards",
  "Switch-UPI",
  "Optimizer-UPI",
  "Chargeback",
  "NetworkConnectivity",
  "Orchestration"
];

const priorityLevels = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function CreateLead() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createLeadMutation = useCreateLead();

  const [leadData, setLeadData] = useState({
    // Lead Source
    lead_source: "",
    
    // Project Information
    project_title: "",
    project_description: "",
    project_budget: "",
    project_timeline: "",
    project_requirements: "",

    // Enhanced Project Info
    solutions: [] as string[],
    priority_level: "medium",
    start_date: new Date().toISOString().split('T')[0], // Current date
    targeted_end_date: "",
    expected_daily_txn_volume: "",
    project_value: "",
    spoc: "",

    // Commercials
    commercials: [] as string[],

    // Client Information
    client_name: "",
    contact_person: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    company_size: "",
    
    // Additional Information
    priority: "medium",
    expected_close_date: "",
    probability: "50",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const updateField = (field: string, value: any) => {
    setLeadData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!leadData.client_name.trim()) {
      newErrors.push("Client name is required");
    }
    if (!leadData.contact_person.trim()) {
      newErrors.push("Contact person is required");
    }
    if (!leadData.email.trim()) {
      newErrors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(leadData.email)) {
      newErrors.push("Email format is invalid");
    }
    if (!leadData.lead_source) {
      newErrors.push("Lead source is required");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...leadData,
        project_budget: leadData.project_budget ? parseFloat(leadData.project_budget) : undefined,
        probability: parseInt(leadData.probability),
        created_by: parseInt(user?.id || "1"),
      };

      await createLeadMutation.mutateAsync(submitData);
      navigate("/sales/leads");
    } catch (error) {
      console.error("Failed to create lead:", error);
      setErrors(["Failed to create lead. Please try again."]);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/sales/leads");
  };

  const isFormValid = leadData.client_name.trim() && leadData.contact_person.trim() && 
                     leadData.email.trim() && leadData.lead_source;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Lead</h1>
            <p className="text-gray-600">Add a new lead to your sales pipeline</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className="min-w-20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Lead
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="project">Project Details</TabsTrigger>
          <TabsTrigger value="client">Client Info</TabsTrigger>
          <TabsTrigger value="additional">Additional</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Lead Information</CardTitle>
              <CardDescription>
                Essential information about the lead source and initial contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lead Source */}
              <div>
                <Label htmlFor="lead_source">Lead Source *</Label>
                <Select
                  value={leadData.lead_source}
                  onValueChange={(value) => updateField("lead_source", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select how you found this lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => {
                      const Icon = source.icon;
                      return (
                        <SelectItem key={source.value} value={source.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{source.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Client/Company Name *</Label>
                  <div className="relative mt-1">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="client_name"
                      value={leadData.client_name}
                      onChange={(e) => updateField("client_name", e.target.value)}
                      className="pl-10"
                      placeholder="Enter client or company name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact_person"
                      value={leadData.contact_person}
                      onChange={(e) => updateField("contact_person", e.target.value)}
                      className="pl-10"
                      placeholder="Primary contact name"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={leadData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="pl-10"
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={leadData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="pl-10"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Information Tab */}
        <TabsContent value="project" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Details about the project or service they're interested in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="project_title">Project Title</Label>
                <div className="relative mt-1">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="project_title"
                    value={leadData.project_title}
                    onChange={(e) => updateField("project_title", e.target.value)}
                    className="pl-10"
                    placeholder="e.g., E-commerce Platform Development"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="project_description">Project Description</Label>
                <Textarea
                  id="project_description"
                  value={leadData.project_description}
                  onChange={(e) => updateField("project_description", e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="Describe what the client wants to achieve..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project_budget">Project Budget</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="project_budget"
                      type="number"
                      value={leadData.project_budget}
                      onChange={(e) => updateField("project_budget", e.target.value)}
                      className="pl-10"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="project_timeline">Project Timeline</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="project_timeline"
                      value={leadData.project_timeline}
                      onChange={(e) => updateField("project_timeline", e.target.value)}
                      className="pl-10"
                      placeholder="e.g., 3-6 months"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="project_requirements">Technical Requirements</Label>
                <Textarea
                  id="project_requirements"
                  value={leadData.project_requirements}
                  onChange={(e) => updateField("project_requirements", e.target.value)}
                  className="mt-1"
                  rows={3}
                  placeholder="List any specific technologies, integrations, or requirements..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Information Tab */}
        <TabsContent value="client" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Additional details about the client's company and background
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <div className="relative mt-1">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="company"
                      value={leadData.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      className="pl-10"
                      placeholder="Company name if different from client name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={leadData.industry}
                    onChange={(e) => updateField("industry", e.target.value)}
                    className="mt-1"
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company_size">Company Size</Label>
                <Select
                  value={leadData.company_size}
                  onValueChange={(value) => updateField("company_size", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Information Tab */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Priority, timeline, and additional notes about this lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={leadData.priority}
                    onValueChange={(value) => updateField("priority", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${priority.color.split(' ')[0]}`} />
                            <span>{priority.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expected_close_date">Expected Close Date</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="expected_close_date"
                      type="date"
                      value={leadData.expected_close_date}
                      onChange={(e) => updateField("expected_close_date", e.target.value)}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={leadData.probability}
                    onChange={(e) => updateField("probability", e.target.value)}
                    className="mt-1"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={leadData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="Any additional notes about this lead..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
