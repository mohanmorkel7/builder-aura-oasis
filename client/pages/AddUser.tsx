import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateUser } from "@/hooks/useApi";
import { roleGroups } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Save,
  Send,
} from "lucide-react";

export default function AddUser() {
  const navigate = useNavigate();
  const createUserMutation = useCreateUser();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "password123", // Default password
    role: "",
    department: "",
    manager: "",
    startDate: "",
    sendWelcomeEmail: true,
    requirePasswordChange: true,
    twoFactorAuth: false,
    notes: "",
  });

  const handleBack = () => {
    navigate("/admin/users");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role as "admin" | "sales" | "product",
        department: formData.department || undefined,
        manager_id: formData.manager ? parseInt(formData.manager) : undefined,
        start_date: formData.startDate || undefined,
        two_factor_enabled: formData.twoFactorAuth,
        notes: formData.notes || undefined,
      };

      await createUserMutation.mutateAsync(userData);
      navigate("/admin/users");
    } catch (error) {
      console.error("Error creating user:", error);
      // Handle error (show toast, etc.)
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
          <p className="text-gray-600 mt-1">
            Create a new user account and assign permissions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Basic user details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="user@banani.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Enter password"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Role & Permissions</span>
            </CardTitle>
            <CardDescription>
              Define user access level and organizational details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                    <SelectItem value="sales">
                      Sales - Client management
                    </SelectItem>
                    <SelectItem value="product">
                      Product - Development tools
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    handleInputChange("department", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administration">
                      Administration
                    </SelectItem>
                    <SelectItem value="sales">Sales & Marketing</SelectItem>
                    <SelectItem value="product">Product Development</SelectItem>
                    <SelectItem value="support">Customer Support</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manager">Reporting Manager</Label>
                <Select
                  value={formData.manager}
                  onValueChange={(value) => handleInputChange("manager", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-doe">John Doe (Admin)</SelectItem>
                    <SelectItem value="jane-smith">
                      Jane Smith (Sales Lead)
                    </SelectItem>
                    <SelectItem value="mike-johnson">
                      Mike Johnson (Product Lead)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Account Settings</span>
            </CardTitle>
            <CardDescription>
              Configure security and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) =>
                    handleInputChange("sendWelcomeEmail", checked)
                  }
                />
                <Label className="text-sm">
                  Send welcome email with login instructions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.requirePasswordChange}
                  onCheckedChange={(checked) =>
                    handleInputChange("requirePasswordChange", checked)
                  }
                />
                <Label className="text-sm">
                  Require password change on first login
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    handleInputChange("twoFactorAuth", checked)
                  }
                />
                <Label className="text-sm">
                  Enable two-factor authentication
                </Label>
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any additional information about this user..."
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button type="button" variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <div className="space-x-3">
            <Button type="button" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button type="submit">
              <Send className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
