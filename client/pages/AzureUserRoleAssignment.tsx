import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  ArrowLeft,
  Save,
  Check,
  X,
  Search,
  Shield,
  Building,
  Mail,
  Calendar,
  Cloud,
  AlertTriangle,
} from "lucide-react";

interface UnknownUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  azure_object_id?: string;
  created_at: string;
  role?: string;
  job_title?: string;
}

interface UserRoleAssignment {
  userId: number;
  role: string;
}

interface UserDepartmentAssignment {
  userId: number;
  department: string;
}

export default function AzureUserRoleAssignment() {
  const navigate = useNavigate();
  const [unknownUsers, setUnknownUsers] = useState<UnknownUser[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<UserRoleAssignment[]>(
    [],
  );
  const [departmentAssignments, setDepartmentAssignments] = useState<UserDepartmentAssignment[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validRoles = [
    {
      value: "admin",
      label: "Administrator",
      color: "bg-red-100 text-red-800",
    },
    { value: "sales", label: "Sales Team", color: "bg-blue-100 text-blue-800" },
    {
      value: "product",
      label: "Product Team",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "development",
      label: "Development Team",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "db",
      label: "Database Administrator",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "finops",
      label: "FinOps Team",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "finance",
      label: "Finance Team",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "hr_management",
      label: "HR Management",
      color: "bg-pink-100 text-pink-800",
    },
    {
      value: "infra",
      label: "Infrastructure Team",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "switch_team",
      label: "Switch Team",
      color: "bg-teal-100 text-teal-800",
    },
  ];

  const validDepartments = [
    {
      value: "admin",
      label: "Administration",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "administration",
      label: "Administration (Alt)",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "sales",
      label: "Sales",
      color: "bg-blue-100 text-blue-800"
    },
    {
      value: "product",
      label: "Product",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "development",
      label: "Development",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "finops",
      label: "FinOps",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "finance",
      label: "Finance",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "hr",
      label: "Human Resources",
      color: "bg-pink-100 text-pink-800",
    },
    {
      value: "infrastructure",
      label: "Infrastructure",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "support",
      label: "Support",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "marketing",
      label: "Marketing",
      color: "bg-cyan-100 text-cyan-800",
    },
  ];

  useEffect(() => {
    fetchUnknownUsers();
  }, []);

  const fetchUnknownUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[Azure Role Assignment] Fetching unknown users...");
      const response = await fetch("/api/azure-sync/unknown-users");

      // Check if response is ok before trying to read JSON
      if (!response.ok) {
        // Try to read error text, but handle if body is already read
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage =
                errorJson.message || errorJson.error || errorMessage;
            } catch {
              errorMessage = errorText;
            }
          }
        } catch (readError) {
          console.warn("Could not read error response:", readError);
        }
        throw new Error(errorMessage);
      }

      // Read JSON response
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("Invalid JSON response:", jsonError);
        throw new Error("Invalid response from server");
      }

      console.log("[Azure Role Assignment] API Response:", result);

      if (result.success !== false) {
        const users = result.users || [];
        console.log("[Azure Role Assignment] Found users:", users);
        setUnknownUsers(users);
        // Initialize role assignments
        setRoleAssignments(
          users.map((user: UnknownUser) => ({
            userId: user.id,
            role: user.role === "unknown" ? "" : user.role, // Keep existing role if not unknown
          })),
        );
        // Initialize department assignments
        setDepartmentAssignments(
          users.map((user: UnknownUser) => ({
            userId: user.id,
            department: user.department || "", // Keep existing department if set
          })),
        );
      } else {
        throw new Error(result.message || "Failed to fetch unknown users");
      }
    } catch (error) {
      console.error("Error fetching unknown users:", error);

      // Handle specific error types
      if (
        error instanceof TypeError &&
        error.message.includes("body stream already read")
      ) {
        setError(
          "Server communication error. Please refresh the page and try again.",
        );
      } else if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("connect")
      ) {
        setError(
          "Database is not available. Please ensure the database is running.",
        );
      } else {
        setError(
          error instanceof Error ? error.message : "Failed to fetch users",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = unknownUsers.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower)
    );
  });

  const updateRole = (userId: number, role: string) => {
    setRoleAssignments((prev) =>
      prev.map((assignment) =>
        assignment.userId === userId ? { ...assignment, role } : assignment,
      ),
    );
  };

  const updateDepartment = (userId: number, department: string) => {
    setDepartmentAssignments((prev) =>
      prev.map((assignment) =>
        assignment.userId === userId ? { ...assignment, department } : assignment,
      ),
    );
  };

  const assignRoles = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Filter out assignments without roles (only for users with unknown role)
      const validRoleAssignments = roleAssignments.filter(
        (assignment) => {
          const user = unknownUsers.find(u => u.id === assignment.userId);
          return user?.role === "unknown" && assignment.role && assignment.role !== "";
        }
      );

      // Filter out assignments without departments (for users with null department)
      const validDepartmentAssignments = departmentAssignments.filter(
        (assignment) => {
          const user = unknownUsers.find(u => u.id === assignment.userId);
          return !user?.department && assignment.department && assignment.department !== "";
        }
      );

      if (validRoleAssignments.length === 0 && validDepartmentAssignments.length === 0) {
        setError("Please assign at least one role or department before saving");
        return;
      }

      let roleResult = null;
      let departmentResult = null;

      // Assign roles if any
      if (validRoleAssignments.length > 0) {
        const roleResponse = await fetch("/api/azure-sync/assign-roles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userRoles: validRoleAssignments }),
        });

        if (!roleResponse.ok) {
          throw new Error(`Role assignment failed: ${roleResponse.statusText}`);
        }
        roleResult = await roleResponse.json();
      }

      // Assign departments if any
      if (validDepartmentAssignments.length > 0) {
        const departmentResponse = await fetch("/api/azure-sync/assign-departments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userDepartments: validDepartmentAssignments }),
        });

        if (!departmentResponse.ok) {
          throw new Error(`Department assignment failed: ${departmentResponse.statusText}`);
        }
        departmentResult = await departmentResponse.json();
      }

      const roleCount = roleResult?.updatedUsers?.length || 0;
      const departmentCount = departmentResult?.updatedUsers?.length || 0;

      setSuccess(
        `Successfully updated ${roleCount} user roles and ${departmentCount} user departments`,
      );

      // Refresh the list
      await fetchUnknownUsers();
    } catch (error) {
      console.error("Error assigning roles/departments:", error);
      setError(
        error instanceof Error ? error.message : "Failed to assign roles/departments",
      );
    } finally {
      setSaving(false);
    }
  };

  const getRoleForUser = (userId: number) => {
    const assignment = roleAssignments.find((a) => a.userId === userId);
    return assignment?.role || "";
  };

  const getDepartmentForUser = (userId: number) => {
    const assignment = departmentAssignments.find((a) => a.userId === userId);
    return assignment?.department || "";
  };

  const getAssignedCount = () => {
    const roleCount = roleAssignments.filter((a) => {
      const user = unknownUsers.find(u => u.id === a.userId);
      return user?.role === "unknown" && a.role && a.role !== "";
    }).length;

    const departmentCount = departmentAssignments.filter((a) => {
      const user = unknownUsers.find(u => u.id === a.userId);
      return !user?.department && a.department && a.department !== "";
    }).length;

    return roleCount + departmentCount;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading unknown users...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to User Management
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Azure User Role & Department Assignment
            </h1>
            <p className="text-gray-600 mt-1">
              Assign roles and departments to users imported from Azure AD
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={fetchUnknownUsers}
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
          <Button
            onClick={assignRoles}
            disabled={saving || getAssignedCount() === 0}
            className="min-w-32"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Assign Roles ({getAssignedCount()})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {unknownUsers.length}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  Azure AD Users Need Assignment
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-green-600">
                {getAssignedCount()} / {filteredUsers.length}
              </p>
              <p className="text-sm text-gray-500">Assignments Made</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Debug Info:</strong>
            <br />API returned {unknownUsers.length} users
            <br />Filtered users: {filteredUsers.length}
            <br />Role assignments: {roleAssignments.length}
            <br />Last fetch: {new Date().toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Azure AD Users ({filteredUsers.length})</span>
          </CardTitle>
          <CardDescription>
            Azure AD users needing role or department assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {unknownUsers.length === 0
                  ? "No users need role assignment"
                  : "No users match your search"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Assign Department</TableHead>
                  <TableHead>Assign Role</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const assignedRole = getRoleForUser(user.id);
                  const roleInfo = validRoles.find(
                    (r) => r.value === assignedRole,
                  );

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="w-3 h-3 mr-1" />
                          {user.department || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-xs text-gray-500">
                          <Cloud className="w-3 h-3 mr-1" />
                          {user.azure_object_id
                            ? user.azure_object_id.substring(0, 8) + "..."
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assignedRole}
                          onValueChange={(role) => updateRole(user.id, role)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select role..." />
                          </SelectTrigger>
                          <SelectContent>
                            {validRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {assignedRole ? (
                          <Badge className={roleInfo?.color}>
                            <Check className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-orange-600 border-orange-200"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
