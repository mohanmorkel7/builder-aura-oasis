import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  PiggyBank,
  TrendingUp,
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
];

const statuses = [
  { value: "in-progress", label: "In Progress" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "completed", label: "Completed" },
];

const investorCategories = [
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capital" },
  { value: "private_equity", label: "Private Equity" },
  { value: "family_office", label: "Family Office" },
  { value: "merchant_banker", label: "Merchant Banker" },
];

const roundStages = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C" },
  { value: "bridge", label: "Bridge" },
  { value: "mezzanine", label: "Mezzanine" },
];

const currencies = [
  { value: "INR", label: "INR (Indian Rupee)" },
  { value: "USD", label: "USD (US Dollar)" },
  { value: "AED", label: "AED (UAE Dirham)" },
];

export default function VCEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    lead_source: "",
    lead_source_value: "",
    lead_created_by: "",
    status: "",
    round_title: "",
    round_description: "",
    round_stage: "",
    round_size: "",
    valuation: "",
    investor_category: "",
    investor_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    website: "",
    potential_lead_investor: false,
    minimum_size: "",
    maximum_size: "",
    minimum_arr_requirement: "",
    priority_level: "",
    start_date: "",
    targeted_end_date: "",
    spoc: "",
    billing_currency: "",
    template_id: "",
    notes: "",
  });

  const [contacts, setContacts] = useState([
    {
      contact_name: "",
      email: "",
      phone: "",
      designation: "",
      linkedin: "",
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch VC details
  const {
    data: vcData,
    isLoading: vcLoading,
    error: vcError,
  } = useQuery({
    queryKey: ["vc", id],
    queryFn: async () => {
      const response = await apiClient.request(`/vc/${id}`);
      return response;
    },
    enabled: !!id,
  });

  // Fetch templates
  const {
    data: templates = [],
    isLoading: templatesLoading,
  } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const response = await apiClient.request("/templates");
      return response;
    },
  });

  // Update VC mutation
  const updateVCMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.request(`/vc/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc", id] });
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
      navigate(`/vc/${id}`);
    },
    onError: (error: any) => {
      console.error("Update failed:", error);
      setErrors({ submit: "Failed to update VC. Please try again." });
    },
  });

  // Load VC data into form when available
  useEffect(() => {
    if (vcData) {
      setFormData({
        lead_source: vcData.lead_source || "",
        lead_source_value: vcData.lead_source_value || "",
        lead_created_by: vcData.lead_created_by || "",
        status: vcData.status || "",
        round_title: vcData.round_title || "",
        round_description: vcData.round_description || "",
        round_stage: vcData.round_stage || "",
        round_size: vcData.round_size || "",
        valuation: vcData.valuation || "",
        investor_category: vcData.investor_category || "",
        investor_name: vcData.investor_name || "",
        contact_person: vcData.contact_person || "",
        email: vcData.email || "",
        phone: vcData.phone || "",
        address: vcData.address || "",
        city: vcData.city || "",
        state: vcData.state || "",
        country: vcData.country || "",
        website: vcData.website || "",
        potential_lead_investor: vcData.potential_lead_investor || false,
        minimum_size: vcData.minimum_size?.toString() || "",
        maximum_size: vcData.maximum_size?.toString() || "",
        minimum_arr_requirement: vcData.minimum_arr_requirement?.toString() || "",
        priority_level: vcData.priority_level || "",
        start_date: vcData.start_date || "",
        targeted_end_date: vcData.targeted_end_date || "",
        spoc: vcData.spoc || "",
        billing_currency: vcData.billing_currency || "",
        template_id: vcData.template_id?.toString() || "",
        notes: vcData.notes || "",
      });

      if (vcData.contacts && vcData.contacts.length > 0) {
        setContacts(vcData.contacts);
      }
    }
  }, [vcData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    setContacts((prev) => {
      const newContacts = [...prev];
      newContacts[index] = {
        ...newContacts[index],
        [field]: value,
      };
      return newContacts;
    });
  };

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      {
        contact_name: "",
        email: "",
        phone: "",
        designation: "",
        linkedin: "",
      },
    ]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.investor_name.trim()) {
      newErrors.investor_name = "Investor name is required";
    }

    if (!formData.round_title.trim()) {
      newErrors.round_title = "Round title is required";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    if (!formData.lead_source) {
      newErrors.lead_source = "Lead source is required";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        minimum_size: formData.minimum_size ? parseInt(formData.minimum_size) : null,
        maximum_size: formData.maximum_size ? parseInt(formData.maximum_size) : null,
        minimum_arr_requirement: formData.minimum_arr_requirement ? parseInt(formData.minimum_arr_requirement) : null,
        template_id: formData.template_id ? parseInt(formData.template_id) : null,
        contacts: contacts.filter(contact => contact.contact_name.trim() || contact.email.trim()),
      };

      await updateVCMutation.mutateAsync(submitData);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/vc/${id}`);
  };

  if (vcLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading VC details...</div>
      </div>
    );
  }

  if (vcError || !vcData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading VC details
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to VC Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit VC</h1>
            <p className="text-gray-600">
              Update VC information and funding details
            </p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="funding">Funding Details</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential VC and investor details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investor_name">Investor Name *</Label>
                    <Input
                      id="investor_name"
                      value={formData.investor_name}
                      onChange={(e) => handleInputChange("investor_name", e.target.value)}
                      className={errors.investor_name ? "border-red-500" : ""}
                    />
                    {errors.investor_name && (
                      <p className="text-sm text-red-500 mt-1">{errors.investor_name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="round_title">Round Title *</Label>
                    <Input
                      id="round_title"
                      value={formData.round_title}
                      onChange={(e) => handleInputChange("round_title", e.target.value)}
                      className={errors.round_title ? "border-red-500" : ""}
                    />
                    {errors.round_title && (
                      <p className="text-sm text-red-500 mt-1">{errors.round_title}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger className={errors.status ? "border-red-500" : ""}>
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
                    {errors.status && (
                      <p className="text-sm text-red-500 mt-1">{errors.status}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="priority_level">Priority Level</Label>
                    <Select
                      value={formData.priority_level}
                      onValueChange={(value) => handleInputChange("priority_level", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="lead_source">Lead Source *</Label>
                    <Select
                      value={formData.lead_source}
                      onValueChange={(value) => handleInputChange("lead_source", value)}
                    >
                      <SelectTrigger className={errors.lead_source ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {leadSources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            <div className="flex items-center space-x-2">
                              <source.icon className="w-4 h-4" />
                              <span>{source.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.lead_source && (
                      <p className="text-sm text-red-500 mt-1">{errors.lead_source}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lead_source_value">Lead Source Value</Label>
                    <Input
                      id="lead_source_value"
                      value={formData.lead_source_value}
                      onChange={(e) => handleInputChange("lead_source_value", e.target.value)}
                      placeholder="e.g., referral name, website URL"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="round_description">Round Description</Label>
                  <Textarea
                    id="round_description"
                    value={formData.round_description}
                    onChange={(e) => handleInputChange("round_description", e.target.value)}
                    rows={3}
                    placeholder="Describe the funding round and objectives"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    placeholder="Additional notes about this VC opportunity"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funding Details Tab */}
          <TabsContent value="funding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Funding Details</CardTitle>
                <CardDescription>
                  Investment and funding specifics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investor_category">Investor Category</Label>
                    <Select
                      value={formData.investor_category}
                      onValueChange={(value) => handleInputChange("investor_category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {investorCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="round_stage">Round Stage</Label>
                    <Select
                      value={formData.round_stage}
                      onValueChange={(value) => handleInputChange("round_stage", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {roundStages.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="round_size">Round Size</Label>
                    <Input
                      id="round_size"
                      value={formData.round_size}
                      onChange={(e) => handleInputChange("round_size", e.target.value)}
                      placeholder="e.g., $5M, ₹50Cr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="valuation">Valuation</Label>
                    <Input
                      id="valuation"
                      value={formData.valuation}
                      onChange={(e) => handleInputChange("valuation", e.target.value)}
                      placeholder="e.g., $50M, ₹400Cr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimum_size">Minimum Investment (₹)</Label>
                    <Input
                      id="minimum_size"
                      type="number"
                      value={formData.minimum_size}
                      onChange={(e) => handleInputChange("minimum_size", e.target.value)}
                      placeholder="e.g., 10000000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maximum_size">Maximum Investment (₹)</Label>
                    <Input
                      id="maximum_size"
                      type="number"
                      value={formData.maximum_size}
                      onChange={(e) => handleInputChange("maximum_size", e.target.value)}
                      placeholder="e.g., 100000000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimum_arr_requirement">Min ARR Requirement (₹)</Label>
                    <Input
                      id="minimum_arr_requirement"
                      type="number"
                      value={formData.minimum_arr_requirement}
                      onChange={(e) => handleInputChange("minimum_arr_requirement", e.target.value)}
                      placeholder="e.g., 5000000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="billing_currency">Currency</Label>
                    <Select
                      value={formData.billing_currency}
                      onValueChange={(value) => handleInputChange("billing_currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange("start_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targeted_end_date">Target End Date</Label>
                    <Input
                      id="targeted_end_date"
                      type="date"
                      value={formData.targeted_end_date}
                      onChange={(e) => handleInputChange("targeted_end_date", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="potential_lead_investor"
                    checked={formData.potential_lead_investor}
                    onChange={(e) => handleInputChange("potential_lead_investor", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="potential_lead_investor">
                    Potential Lead Investor
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Manage contact details for this VC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_person">Primary Contact</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange("contact_person", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                    />
                  </div>
                </div>

                {/* Additional Contacts */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="additional-contacts">
                    <AccordionTrigger>
                      Additional Contacts ({contacts.length})
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {contacts.map((contact, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Contact {index + 1}</h4>
                            {contacts.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeContact(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={contact.contact_name}
                                onChange={(e) =>
                                  handleContactChange(index, "contact_name", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={contact.email}
                                onChange={(e) =>
                                  handleContactChange(index, "email", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <Input
                                value={contact.phone}
                                onChange={(e) =>
                                  handleContactChange(index, "phone", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label>Designation</Label>
                              <Input
                                value={contact.designation}
                                onChange={(e) =>
                                  handleContactChange(index, "designation", e.target.value)
                                }
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>LinkedIn</Label>
                              <Input
                                value={contact.linkedin}
                                onChange={(e) =>
                                  handleContactChange(index, "linkedin", e.target.value)
                                }
                                placeholder="https://linkedin.com/in/username"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addContact}
                        className="w-full"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Add Contact
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings & Configuration</CardTitle>
                <CardDescription>
                  Template assignment and additional settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template_id">Template</Label>
                    <Select
                      value={formData.template_id}
                      onValueChange={(value) => handleInputChange("template_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Template</SelectItem>
                        {templates.map((template: any) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="spoc">SPOC</Label>
                    <Input
                      id="spoc"
                      value={formData.spoc}
                      onChange={(e) => handleInputChange("spoc", e.target.value)}
                      placeholder="Single Point of Contact"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lead_created_by">Lead Created By</Label>
                    <Input
                      id="lead_created_by"
                      value={formData.lead_created_by}
                      onChange={(e) => handleInputChange("lead_created_by", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
