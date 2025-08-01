import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser, useUpdateUser } from "@/hooks/useApi";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Building,
  Info,
  AlertTriangle,
} from "lucide-react";

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = parseInt(id || "0");
  const { data: originalUser, isLoading, error } = useUser(userId);
  const updateUserMutation = useUpdateUser();

  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "sales",
    status: "active",
    department: "",
    start_date: "",
    notes: "",
    two_factor_enabled: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Update state when user data is loaded
  React.useEffect(() => {
    if (originalUser) {
      setUser({
        first_name: originalUser.first_name || "",
        last_name: originalUser.last_name || "",
        email: originalUser.email || "",
        phone: originalUser.phone || "",
        role: originalUser.role || "sales",
        status: originalUser.status || "active",
        department: originalUser.department || "",
        start_date: originalUser.start_date || "",
        notes: originalUser.notes || "",
        two_factor_enabled: originalUser.two_factor_enabled || false,
      });
    }
  }, [originalUser]);

  const updateField = (field: string, value: any) => {
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        userData: user,
      });
      setHasChanges(false);
      navigate(`/admin/users/${id}`);
    } catch (error) {
      console.error("Failed to save user:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save user. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    setResetError(null);
    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      alert('Password reset email sent successfully!');
    } catch (error) {
      console.error("Failed to reset password:", error);
      setResetError(
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again."
      );
    }
  };

  const toggleTwoFactor = () => {
    updateField("two_factor_enabled", !user.two_factor_enabled);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading user details...</div>
      </div>
    );
  }

  if (error || !originalUser) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading user details
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/users/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to User Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-600">
              {user.first_name} {user.last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="min-w-20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* User Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg bg-primary text-white">
                {user.first_name[0]}
                {user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-700"
                      : user.role === "sales"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    user.status === "active"
                      ? "bg-green-100 text-green-700"
                      : user.status === "inactive"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alerts */}
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>
            {saveError}
          </AlertDescription>
        </Alert>
      )}

      {resetError && (
        <Alert variant="destructive">
          <AlertDescription>
            {resetError}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Basic user profile information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={user.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={user.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={user.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="department"
                      value={user.department}
                      onChange={(e) =>
                        updateField("department", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="start_date"
                      type="date"
                      value={user.start_date}
                      onChange={(e) =>
                        updateField("start_date", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={user.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                  placeholder="Additional notes about the user..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage user role, status, and account permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">User Role</Label>
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateField("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="sales">Sales Team</SelectItem>
                      <SelectItem value="product">Product Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    Determines what features and data the user can access
                  </p>
                </div>
                <div>
                  <Label htmlFor="status">Account Status</Label>
                  <Select
                    value={user.status}
                    onValueChange={(value) => updateField("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    Controls whether the user can log in and access the system
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Role Changes:</strong> Changing a user's role will
                  immediately affect their access permissions.
                  {user.role === "admin" &&
                    " Admin users have full system access."}
                  {user.role === "sales" &&
                    " Sales users can manage clients and follow-ups."}
                  {user.role === "product" &&
                    " Product users can manage deployments and releases."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage password and security options for this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">
                    Add an extra layer of security to this account
                  </p>
                </div>
                <Switch
                  checked={user.two_factor_enabled}
                  onCheckedChange={toggleTwoFactor}
                />
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Password Management</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Reset the user's password and send them new login instructions
                </p>
                <Button variant="outline" onClick={resetPassword}>
                  <Shield className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> Any changes to security
                  settings will be logged and may require the user to
                  re-authenticate.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
