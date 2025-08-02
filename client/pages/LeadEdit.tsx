import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useLead,
  useUpdateLead,
  useTemplates,
  useTemplate,
} from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import TemplatePreviewModal from "@/components/TemplatePreviewModal";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Plus,
  Eye,
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

const statuses = [
  { value: "in-progress", label: "In Progress" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "completed", label: "Completed" },
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
  "Orchestration",
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
  "Orchestration",
];

const priorityLevels = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const currencyOptions = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
  { value: "AED", label: "AED (Dubai)" },
];

const getCurrencyUnits = (currency: string) => {
  switch (currency) {
    case "INR":
      return [
        { value: "rupee", label: "Rupee" },
        { value: "paisa", label: "Paisa" },
      ];
    case "USD":
      return [
        { value: "dollar", label: "Dollar" },
        { value: "cents", label: "Cents" },
      ];
    case "AED":
      return [
        { value: "dirham", label: "Dirham" },
        { value: "fils", label: "Fils" },
      ];
    default:
      return [
        { value: "paisa", label: "Paisa" },
        { value: "cents", label: "Cents" },
      ];
  }
};

const clientTypes = [
  { value: "new", label: "New" },
  { value: "existing", label: "Existing" },
];

const categories = [
  { value: "aggregator", label: "Aggregator" },
  { value: "banks", label: "Banks" },
  { value: "partner", label: "Partner" },
];

const countries = [
  { value: "india", label: "India" },
  { value: "usa", label: "United States" },
  { value: "uae", label: "United Arab Emirates" },
  { value: "uk", label: "United Kingdom" },
  { value: "singapore", label: "Singapore" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "other", label: "Other" },
];

export default function LeadEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const leadId = parseInt(id || "0");

  // Move all hooks to the top before any conditional logic
  const { data: originalLead, isLoading, error } = useLead(leadId);
  const updateLeadMutation = useUpdateLead();
  const { data: templates = [] } = useTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Get selected template data
  const selectedTemplateId =
    selectedTemplate && selectedTemplate !== "manual"
      ? parseInt(selectedTemplate)
      : null;
  const { data: templateData } = useTemplate(selectedTemplateId || 0);

  // State hooks
  const [leadData, setLeadData] = useState({
    // Lead Source & Status
    lead_source: "",
    lead_source_value: "",
    status: "",
    assigned_to: undefined as number | undefined,

    // Project Information
    project_title: "",
    project_description: "",
    project_requirements: "",

    // Enhanced Project Info
    solutions: [] as string[],
    priority_level: "",
    start_date: "",
    targeted_end_date: "",
    expected_daily_txn_volume: "",
    project_value: "",
    project_value_12m: "",
    project_value_24m: "",
    project_value_36m: "",
    spoc: "",

    // Commercials
    commercials: [] as string[],
    commercial_pricing: [] as Array<{
      solution: string;
      value: number;
      unit: "rupee" | "paisa" | "dollar" | "cents" | "dirham" | "fils";
      currency: "INR" | "USD" | "AED";
    }>,

    // Client Information
    client_name: "",
    client_type: "",
    company_location: "",
    category: "",
    country: "",

    // Contact Information
    contacts: [
      {
        contact_name: "",
        designation: "",
        phone: "",
        email: "",
        linkedin: "",
      },
    ] as Array<{
      contact_name: string;
      designation: string;
      phone: string;
      email: string;
      linkedin: string;
    }>,

    // Additional Information
    priority: "",
    expected_close_date: "",
    probability: "",
    notes: "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<"INR" | "USD" | "AED">("INR");

  // Mock exchange rates (in production, these would come from an API)
  const exchangeRates = {
    INR: { USD: 0.012, AED: 0.044, INR: 1 },
    USD: { INR: 83.5, AED: 3.67, USD: 1 },
    AED: { INR: 22.75, USD: 0.27, AED: 1 },
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    const rate = exchangeRates[fromCurrency as keyof typeof exchangeRates]?.[toCurrency as keyof typeof exchangeRates.INR];
    return rate ? amount * rate : amount;
  };

  // Early returns after all hooks have been declared
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">Loading lead data...</div>
      </div>
    );
  }

  if (error || !originalLead) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Lead Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The lead you're trying to edit could not be found.
          </p>
          <Button onClick={() => navigate("/leads")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has edit permissions
  const canEditLead =
    user?.role === "admin" ||
    user?.role === "sales" ||
    user?.role === "product";
  const canEditAssignments = user?.role === "admin" || user?.role === "sales";
  const canViewOnly = false; // All users can edit now

  // Update state when lead data is loaded
  React.useEffect(() => {
    if (originalLead) {
      const lead = originalLead;
      setLeadData({
        lead_source: lead.lead_source || "",
        lead_source_value: lead.lead_source_value || "",
        status: lead.status || "",
        project_title: lead.project_title || "",
        project_description: lead.project_description || "",
        project_requirements: lead.project_requirements || "",

        // Enhanced Project Info
        solutions: lead.solutions || [],
        priority_level: lead.priority_level || "",
        start_date: lead.start_date ? lead.start_date.split("T")[0] : "",
        targeted_end_date: lead.targeted_end_date
          ? lead.targeted_end_date.split("T")[0]
          : "",
        expected_daily_txn_volume:
          lead.expected_daily_txn_volume?.toString() || "",
        project_value: lead.project_value?.toString() || "",
        project_value_12m: lead.project_value_12m?.toString() || "",
        project_value_24m: lead.project_value_24m?.toString() || "",
        project_value_36m: lead.project_value_36m?.toString() || "",
        spoc: lead.spoc || "",

        // Commercials
        commercials: lead.commercials || [],
        commercial_pricing: lead.commercial_pricing || [],

        // Contacts
        contacts: lead.contacts || [
          {
            contact_name: "",
            designation: "",
            phone: "",
            email: "",
            linkedin: "",
          },
        ],

        client_name: lead.client_name || "",
        client_type: lead.client_type || "",
        company_location: lead.company_location || "",
        category: lead.category || "",
        country: lead.country || "",

        priority: lead.priority || "",
        expected_close_date: lead.expected_close_date
          ? lead.expected_close_date.split("T")[0]
          : "",
        probability: lead.probability?.toString() || "",
        notes: lead.notes || "",
        assigned_to: lead.assigned_to || undefined,
      });
    }
  }, [originalLead]);

  const updateField = (field: string, value: any) => {
    const newData = {
      ...leadData,
      [field]: value,
    };

    // If solutions are updated, sync with commercial_pricing
    if (field === "solutions") {
      const existingPricing = leadData.commercial_pricing || [];
      const newPricing = value.map((solution: string) => {
        // Keep existing pricing if solution was already selected
        const existing = existingPricing.find((p) => p.solution === solution);
        return (
          existing || {
            solution,
            value: 0,
            unit: "rupee" as const,
            currency: "INR" as const,
          }
        );
      });
      newData.commercial_pricing = newPricing;
    }

    setLeadData(newData);
    setHasChanges(true);
  };

  const updateCommercialPricing = (
    index: number,
    field: string,
    value: any,
  ) => {
    const newPricing = [...(leadData.commercial_pricing || [])];
    newPricing[index] = { ...newPricing[index], [field]: value };
    setLeadData((prev) => ({ ...prev, commercial_pricing: newPricing }));
    setHasChanges(true);
  };

  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...leadData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setLeadData((prev) => ({ ...prev, contacts: newContacts }));
    setHasChanges(true);
  };

  const addContact = () => {
    setLeadData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          contact_name: "",
          designation: "",
          phone: "",
          email: "",
          linkedin: "",
        },
      ],
    }));
    setHasChanges(true);
  };

  const removeContact = (index: number) => {
    if (leadData.contacts.length > 1) {
      const newContacts = leadData.contacts.filter((_, i) => i !== index);
      setLeadData((prev) => ({ ...prev, contacts: newContacts }));
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const updateData = {
        ...leadData,
        project_value: leadData.project_value
          ? parseFloat(leadData.project_value)
          : undefined,
        project_value_12m: leadData.project_value_12m
          ? parseFloat(leadData.project_value_12m)
          : undefined,
        project_value_24m: leadData.project_value_24m
          ? parseFloat(leadData.project_value_24m)
          : undefined,
        project_value_36m: leadData.project_value_36m
          ? parseFloat(leadData.project_value_36m)
          : undefined,
        expected_daily_txn_volume: leadData.expected_daily_txn_volume
          ? parseInt(leadData.expected_daily_txn_volume)
          : undefined,
        probability: leadData.probability
          ? parseInt(leadData.probability)
          : undefined,
      };

      await updateLeadMutation.mutateAsync({
        id: leadId,
        leadData: updateData,
      });
      setHasChanges(false);
      navigate(`/leads/${id}`);
    } catch (error) {
      console.error("Failed to save lead:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save lead. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/leads/${id}`);
  };

  // No redirection needed - all roles can edit

  const isFormValid = leadData.client_name.trim() && leadData.lead_source;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
            <p className="text-gray-600">{leadData.client_name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              (!canEditLead && !canEditAssignments) ||
              saving ||
              (canEditLead && !isFormValid)
            }
            className="min-w-20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {canEditLead ? "Save" : "Update"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Access Control and Form Validation Alerts */}
      {user?.role !== "admin" && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {user?.role === "sales"
              ? "As a Sales user, you have full editing access to leads."
              : user?.role === "product"
                ? "As a Product user, you have full editing access to leads."
                : "You have editing permissions for this lead."}
          </AlertDescription>
        </Alert>
      )}

      {!isFormValid && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please fill in all required fields: Client Name and Lead Source.
          </AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Form Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Lead Info</TabsTrigger>
          <TabsTrigger value="project">Project Details</TabsTrigger>
          <TabsTrigger value="commercials">Commercials</TabsTrigger>
          <TabsTrigger value="client">Client & Contact Info</TabsTrigger>
          <TabsTrigger value="additional">Additional</TabsTrigger>
        </TabsList>

        {/* Lead Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
              <CardDescription>
                Essential information about the lead source and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_source">Lead Source *</Label>
                  <Select
                    value={leadData.lead_source}
                    onValueChange={(value) => updateField("lead_source", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select lead source" />
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
                <div>
                  <Label htmlFor="status">Lead Status</Label>
                  <Select
                    value={leadData.status}
                    onValueChange={(value) => updateField("status", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Lead Source Value */}
              {leadData.lead_source && (
                <div>
                  <Label htmlFor="lead_source_value">
                    {leadData.lead_source === "email" && "Email Address"}
                    {leadData.lead_source === "phone" && "Phone Number"}
                    {leadData.lead_source === "social-media" &&
                      "Social Media Profile/Link"}
                    {leadData.lead_source === "website" && "Website URL"}
                    {leadData.lead_source === "referral" &&
                      "Referral Source/Contact"}
                    {leadData.lead_source === "cold-call" &&
                      "Phone Number Called"}
                    {leadData.lead_source === "event" && "Event Name/Details"}
                    {leadData.lead_source === "other" && "Source Details"}
                  </Label>
                  <div className="relative mt-1">
                    {leadData.lead_source === "email" && (
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    )}
                    {leadData.lead_source === "phone" && (
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    )}
                    {leadData.lead_source === "website" && (
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    )}
                    <Input
                      id="lead_source_value"
                      value={leadData.lead_source_value}
                      onChange={(e) =>
                        updateField("lead_source_value", e.target.value)
                      }
                      className="pl-10"
                      placeholder={
                        leadData.lead_source === "email"
                          ? "contact@company.com"
                          : leadData.lead_source === "phone"
                            ? "+1 (555) 000-0000"
                            : leadData.lead_source === "social-media"
                              ? "LinkedIn profile or social media link"
                              : leadData.lead_source === "website"
                                ? "https://company.com"
                                : leadData.lead_source === "referral"
                                  ? "Name of person who referred"
                                  : leadData.lead_source === "cold-call"
                                    ? "+1 (555) 000-0000"
                                    : leadData.lead_source === "event"
                                      ? "Conference name or event details"
                                      : "Describe the source"
                      }
                    />
                  </div>
                </div>
              )}
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
                    onChange={(e) =>
                      updateField("project_title", e.target.value)
                    }
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
                  onChange={(e) =>
                    updateField("project_description", e.target.value)
                  }
                  className="mt-1"
                  rows={4}
                  placeholder="Describe what the client wants to achieve..."
                />
              </div>

              <div>
                <Label htmlFor="project_requirements">
                  Technical Requirements
                </Label>
                <Textarea
                  id="project_requirements"
                  value={leadData.project_requirements}
                  onChange={(e) =>
                    updateField("project_requirements", e.target.value)
                  }
                  className="mt-1"
                  rows={3}
                  placeholder="List any specific technologies, integrations, or requirements..."
                />
              </div>

              {/* Enhanced Project Info */}
              <div className="border-t pt-6 space-y-6">
                <h4 className="text-lg font-medium text-gray-900">
                  Template Selection
                </h4>

                <div>
                  <Label htmlFor="template">Choose Template</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Select
                      value={selectedTemplate}
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a template or use manual" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">
                          Manual (Create from scratch)
                        </SelectItem>
                        {templates.map((template: any) => (
                          <SelectItem
                            key={template.id}
                            value={template.id.toString()}
                          >
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTemplate && selectedTemplate !== "manual" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplatePreview(true)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Enhanced Project Information
                  </h4>
                </div>

                <div>
                  <Label htmlFor="solutions">Solutions (Multiselect)</Label>
                  <MultiSelect
                    options={solutionsOptions}
                    value={leadData.solutions}
                    onChange={(value) => updateField("solutions", value)}
                    placeholder="Select solutions..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority_level">Priority Level</Label>
                    <Select
                      value={leadData.priority_level}
                      onValueChange={(value) =>
                        updateField("priority_level", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="spoc">SPOC (Single Point of Contact)</Label>
                    <Input
                      id="spoc"
                      value={leadData.spoc}
                      onChange={(e) => updateField("spoc", e.target.value)}
                      className="mt-1"
                      placeholder="Main contact person for the project"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">
                      Start Date (Expected or Confirmed)
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={leadData.start_date}
                      onChange={(e) =>
                        updateField("start_date", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targeted_end_date">Targeted End Date</Label>
                    <Input
                      id="targeted_end_date"
                      type="date"
                      value={leadData.targeted_end_date}
                      onChange={(e) =>
                        updateField("targeted_end_date", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expected_daily_txn_volume">
                    Expected Daily Txn Volume
                  </Label>
                  <Input
                    id="expected_daily_txn_volume"
                    type="number"
                    value={leadData.expected_daily_txn_volume}
                    onChange={(e) =>
                      updateField("expected_daily_txn_volume", e.target.value)
                    }
                    className="mt-1"
                    placeholder="Number of daily transactions"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_value">
                      Project Current Value
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="project_value"
                        type="number"
                        value={leadData.project_value}
                        onChange={(e) =>
                          updateField("project_value", e.target.value)
                        }
                        className="pl-10"
                        placeholder="Current project value"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="project_value_12m">
                      Project Value After 12 Months
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="project_value_12m"
                        type="number"
                        value={leadData.project_value_12m || ""}
                        onChange={(e) =>
                          updateField("project_value_12m", e.target.value)
                        }
                        className="pl-10"
                        placeholder="Expected value after 12 months"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_value_24m">
                      Project Value After 24 Months
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="project_value_24m"
                        type="number"
                        value={leadData.project_value_24m || ""}
                        onChange={(e) =>
                          updateField("project_value_24m", e.target.value)
                        }
                        className="pl-10"
                        placeholder="Expected value after 24 months"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="project_value_36m">
                      Project Value After 36 Months
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="project_value_36m"
                        type="number"
                        value={leadData.project_value_36m || ""}
                        onChange={(e) =>
                          updateField("project_value_36m", e.target.value)
                        }
                        className="pl-10"
                        placeholder="Expected value after 36 months"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commercials Tab */}
        <TabsContent value="commercials" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commercials</CardTitle>
                  <CardDescription>
                    Select the commercial products and services relevant to this
                    lead
                  </CardDescription>
                </div>
                {leadData.commercial_pricing &&
                  leadData.commercial_pricing.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Total Value by Currency:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Convert to:</span>
                          <Select value={displayCurrency} onValueChange={(value: "INR" | "USD" | "AED") => setDisplayCurrency(value)}>
                            <SelectTrigger className="w-20 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INR">INR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="AED">AED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Original values by currency */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(
                            leadData.commercial_pricing.reduce(
                              (acc: Record<string, { total: number; count: number }>, pricing) => {
                                const key = `${pricing.currency}_${pricing.unit}`;
                                if (!acc[key]) {
                                  acc[key] = { total: 0, count: 0 };
                                }
                                acc[key].total += pricing.value || 0;
                                acc[key].count += 1;
                                return acc;
                              },
                              {},
                            ),
                          ).map(([key, data]) => {
                            const [currency, unit] = key.split("_");
                            return (
                              <span
                                key={key}
                                className="text-xs bg-white px-2 py-1 rounded border text-gray-700"
                              >
                                {data.total.toLocaleString()} {currency} ({unit})
                              </span>
                            );
                          })}
                        </div>

                        {/* Converted total */}
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800">
                              Total Converted to {displayCurrency}:
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {Object.entries(
                                leadData.commercial_pricing.reduce(
                                  (acc: Record<string, number>, pricing) => {
                                    const convertedValue = convertCurrency(
                                      pricing.value || 0,
                                      pricing.currency,
                                      displayCurrency
                                    );
                                    acc[displayCurrency] = (acc[displayCurrency] || 0) + convertedValue;
                                    return acc;
                                  },
                                  {},
                                ),
                              ).map(([currency, total]) =>
                                `${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`
                              ).join(", ")}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            *Exchange rates are indicative and updated daily
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Pricing for solutions selected in the Project Details tab.
                  Values will auto-populate when you select solutions in the
                  Project tab.
                </p>

                {!leadData.solutions || leadData.solutions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No solutions selected in Project Details tab.</p>
                    <p className="text-sm">
                      Go to Project Details tab and select solutions to
                      configure pricing.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Solution Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Currency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(leadData.commercial_pricing || []).map(
                        (pricing, index) => (
                          <TableRow key={pricing.solution}>
                            <TableCell className="font-medium">
                              {pricing.solution}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={pricing.value}
                                onChange={(e) =>
                                  updateCommercialPricing(
                                    index,
                                    "value",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                placeholder="0"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={pricing.unit}
                                onValueChange={(value) =>
                                  updateCommercialPricing(index, "unit", value)
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getCurrencyUnits(pricing.currency).map((unit) => (
                                    <SelectItem
                                      key={unit.value}
                                      value={unit.value}
                                    >
                                      {unit.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={pricing.currency}
                                onValueChange={(value) => {
                                  // Auto-update unit to the first unit of the selected currency
                                  const newUnits = getCurrencyUnits(value);
                                  const defaultUnit = newUnits[0]?.value || "paisa";
                                  updateCommercialPricing(index, "currency", value);
                                  updateCommercialPricing(index, "unit", defaultUnit);
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencyOptions.map((currency) => (
                                    <SelectItem
                                      key={currency.value}
                                      value={currency.value}
                                    >
                                      {currency.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                )}
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
                  <Label htmlFor="client_name_client">Name *</Label>
                  <div className="relative mt-1">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="client_name_client"
                      value={leadData.client_name}
                      onChange={(e) =>
                        updateField("client_name", e.target.value)
                      }
                      className="pl-10"
                      placeholder="Client/Company name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="client_type">Type *</Label>
                  <Select
                    value={leadData.client_type}
                    onValueChange={(value) => updateField("client_type", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="company_location">Company Location</Label>
                  <Input
                    id="company_location"
                    value={leadData.company_location}
                    onChange={(e) =>
                      updateField("company_location", e.target.value)
                    }
                    className="mt-1"
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={leadData.category}
                    onValueChange={(value) => updateField("category", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={leadData.country}
                    onValueChange={(value) => updateField("country", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Add contact details. You can add multiple contacts for this
                lead.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {leadData.contacts.map((contact, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Contact #{index + 1}
                    </h4>
                    {leadData.contacts.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeContact(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`contact_name_${index}`}>
                        Contact Name *
                      </Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id={`contact_name_${index}`}
                          value={contact.contact_name}
                          onChange={(e) =>
                            updateContact(index, "contact_name", e.target.value)
                          }
                          className="pl-10"
                          placeholder="Full name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`designation_${index}`}>
                        Designation / Role
                      </Label>
                      <Input
                        id={`designation_${index}`}
                        value={contact.designation}
                        onChange={(e) =>
                          updateContact(index, "designation", e.target.value)
                        }
                        className="mt-1"
                        placeholder="e.g., CEO, CTO, Manager"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`phone_${index}`}>Phone Number</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id={`phone_${index}`}
                          value={contact.phone}
                          onChange={(e) =>
                            updateContact(index, "phone", e.target.value)
                          }
                          className="pl-10"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`email_${index}`}>Email Address</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id={`email_${index}`}
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            updateContact(index, "email", e.target.value)
                          }
                          className="pl-10"
                          placeholder="contact@company.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`linkedin_${index}`}>
                      LinkedIn or Other Contact Links
                    </Label>
                    <Input
                      id={`linkedin_${index}`}
                      value={contact.linkedin}
                      onChange={(e) =>
                        updateContact(index, "linkedin", e.target.value)
                      }
                      className="mt-1"
                      placeholder="https://linkedin.com/in/username or other social links"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addContact}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Contact
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Information Tab */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                {canEditLead
                  ? "Priority, timeline, and additional notes about this lead"
                  : "Update lead status, assignment, and sales information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Only show probability field */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                    disabled={!canEditAssignments}
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
                  disabled={!canEditAssignments}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        template={templateData}
      />
    </div>
  );
}
