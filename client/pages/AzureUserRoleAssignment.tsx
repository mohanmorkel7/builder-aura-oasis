import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
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

// Pagination component
const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        {getPageNumbers().map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="w-8 h-8 p-0"
          >
            {pageNum}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// User assignment row component for better performance
const UserAssignmentRow = React.memo(({ 
  user, 
  roleAssignments, 
  departmentAssignments, 
  validRoles,
  validDepartments,
  onRoleUpdate,
  onDepartmentUpdate,
  getDepartmentRole 
}) => {
  const assignedRole = roleAssignments.find((a) => a.userId === user.id)?.role || "";
  const assignedDepartment = departmentAssignments.find((a) => a.userId === user.id)?.department || "";
  
  const roleInfo = validRoles.find((r) => r.value === assignedRole);
  const departmentInfo = validDepartments.find((d) => d.value === assignedDepartment);

  const needsRole = user.role === "unknown";
  const needsDepartment = !user.department;
  const isReady = (!needsRole || assignedRole) && (!needsDepartment || assignedDepartment);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <TableRow>
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
        <div className="flex items-center text-sm">
          <Shield className="w-3 h-3 mr-1" />
          <Badge
            variant={
              user.role === "unknown"
                ? "destructive"
                : "secondary"
            }
          >
            {user.role || "N/A"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        {needsDepartment ? (
          <Select
            value={assignedDepartment}
            onValueChange={(department) =>
              onDepartmentUpdate(user.id, department)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select department..." />
            </SelectTrigger>
            <SelectContent>
              {validDepartments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-3 h-3 mr-1" />
            {user.department}
          </div>
        )}
      </TableCell>
      <TableCell>
        {needsRole ? (
          <div className="flex items-center space-x-2">
            <Select
              value={assignedRole}
              onValueChange={(role) =>
                onRoleUpdate(user.id, role)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {validRoles.map((role) => (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                  >
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedRole && assignedDepartment && (
              <Badge
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-200"
                title="Role automatically assigned based on department"
              >
                Auto
              </Badge>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Role assigned
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-600">
          {user.job_title || "N/A"}
        </div>
      </TableCell>
      <TableCell>
        {isReady ? (
          <Badge className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-200"
          >
            <X className="w-3 h-3 mr-1" />
            {needsRole && needsDepartment
              ? "Need Role & Dept"
              : needsRole
                ? "Need Role"
                : "Need Department"}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
});

UserAssignmentRow.displayName = "UserAssignmentRow";

export default function AzureUserRoleAssignment() {
  const navigate = useNavigate();
  const [unknownUsers, setUnknownUsers] = useState<UnknownUser[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<UserRoleAssignment[]>([]);
  const [departmentAssignments, setDepartmentAssignments] = useState<UserDepartmentAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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
      color: "bg-blue-100 text-blue-800",
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
      value: "database",
      label: "Database",
      color: "bg-orange-100 text-orange-800",
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
    {
      value: "switch_team",
      label: "Switch Team",
      color: "bg-teal-100 text-teal-800",
    },
  ];

  // Department to role mapping function
  const getDepartmentRole = useCallback((department: string): string => {
    const departmentRoleMap: { [key: string]: string } = {
      admin: "admin",
      administration: "admin",
      sales: "sales",
      product: "product",
      development: "development",
      finops: "finops",
      finance: "finance",
      hr: "hr_management",
      infrastructure: "infra",
      support: "development", // Map support to development
      marketing: "sales", // Map marketing to sales
      switch_team: "switch_team",
      backend: "development", // Map backend to development
      frontend: "development", // Map frontend to development
      database: "db", // Map database to db
    };

    return departmentRoleMap[department] || "unknown";
  }, []);

  useEffect(() => {
    fetchUnknownUsers();
  }, []);

  // Memoized filtered users for better performance
  const filteredUsers = useMemo(() => {
    return unknownUsers.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.department?.toLowerCase().includes(searchLower)
      );
    });
  }, [unknownUsers, searchTerm]);

  // Memoized pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchUnknownUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[Azure Role Assignment] Fetching unknown users...");

      let response;
      try {
        // Create an abort controller for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        response = await fetch("/api/azure-sync/unknown-users", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (fetchError) {
        console.error("Network fetch error:", fetchError);

        if (fetchError.name === "AbortError") {
          throw new Error(
            "Request timeout - server may be unresponsive. Check if the server is running.",
          );
        } else if (
          fetchError.name === "TypeError" &&
          fetchError.message.includes("Failed to fetch")
        ) {
          throw new Error(
            "Network connection failed. The server may be down or unreachable. Check your connection.",
          );
        } else {
          throw new Error(`Network error: ${fetchError.message}`);
        }
      }

      // Check if response is ok before trying to read JSON
      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 503) {
          // Service unavailable - likely database connection issue
          setError(
            "Database connection failed. Please start PostgreSQL database or check your database configuration.",
          );
          return;
        }

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

  const updateRole = useCallback((userId: number, role: string) => {
    setRoleAssignments((prev) =>
      prev.map((assignment) =>
        assignment.userId === userId ? { ...assignment, role } : assignment,
      ),
    );
  }, []);

  const updateDepartment = useCallback((userId: number, department: string) => {
    // Update department assignment
    setDepartmentAssignments((prev) =>
      prev.map((assignment) =>
        assignment.userId === userId
          ? { ...assignment, department }
          : assignment,
      ),
    );

    // Automatically assign role based on department
    const autoRole = getDepartmentRole(department);
    if (autoRole !== "unknown") {
      setRoleAssignments((prev) => {
        const existingAssignment = prev.find(
          (assignment) => assignment.userId === userId,
        );
        if (existingAssignment) {
          // Update existing role assignment
          return prev.map((assignment) =>
            assignment.userId === userId
              ? { ...assignment, role: autoRole }
              : assignment,
          );
        } else {
          // Add new role assignment
          return [...prev, { userId, role: autoRole }];
        }
      });
    }
  }, [getDepartmentRole]);

  const assignRoles = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Filter out assignments without roles (only for users with unknown role)
      const validRoleAssignments = roleAssignments.filter((assignment) => {
        const user = unknownUsers.find((u) => u.id === assignment.userId);
        return (
          user?.role === "unknown" && assignment.role && assignment.role !== ""
        );
      });

      // Filter out assignments without departments (for users with null department)
      const validDepartmentAssignments = departmentAssignments.filter(
        (assignment) => {
          const user = unknownUsers.find((u) => u.id === assignment.userId);
          return (
            !user?.department &&
            assignment.department &&
            assignment.department !== ""
          );
        },
      );

      if (
        validRoleAssignments.length === 0 &&
        validDepartmentAssignments.length === 0
      ) {
        setError("Please assign at least one role or department before saving");
        return;
      }

      let roleResult = null;
      let departmentResult = null;

      // Assign roles if any
      if (validRoleAssignments.length > 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const roleResponse = await fetch("/api/azure-sync/assign-roles", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ userRoles: validRoleAssignments }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!roleResponse.ok) {
            if (roleResponse.status === 503) {
              throw new Error(
                "Database connection failed during role assignment",
              );
            }
            throw new Error(
              `Role assignment failed: ${roleResponse.statusText}`,
            );
          }
          roleResult = await roleResponse.json();
        } catch (fetchError) {
          if (fetchError.name === "AbortError") {
            throw new Error(
              "Role assignment timeout - operation took too long",
            );
          }
          throw fetchError; // Re-throw other errors
        }
      }

      // Assign departments if any
      if (validDepartmentAssignments.length > 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const departmentResponse = await fetch(
            "/api/azure-sync/assign-departments",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                userDepartments: validDepartmentAssignments,
              }),
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);

          if (!departmentResponse.ok) {
            if (departmentResponse.status === 503) {
              throw new Error(
                "Database connection failed during department assignment",
              );
            }
            throw new Error(
              `Department assignment failed: ${departmentResponse.statusText}`,
            );
          }
          departmentResult = await departmentResponse.json();
        } catch (fetchError) {
          if (fetchError.name === "AbortError") {
            throw new Error(
              "Department assignment timeout - operation took too long",
            );
          }
          throw fetchError; // Re-throw other errors
        }
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
        error instanceof Error
          ? error.message
          : "Failed to assign roles/departments",
      );
    } finally {
      setSaving(false);
    }
  };

  const getAssignedCount = useCallback(() => {
    const roleCount = roleAssignments.filter((a) => {
      const user = unknownUsers.find((u) => u.id === a.userId);
      return user?.role === "unknown" && a.role && a.role !== "";
    }).length;

    const departmentCount = departmentAssignments.filter((a) => {
      const user = unknownUsers.find((u) => u.id === a.userId);
      return !user?.department && a.department && a.department !== "";
    }).length;

    return roleCount + departmentCount;
  }, [roleAssignments, departmentAssignments, unknownUsers]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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
                Save Assignments ({getAssignedCount()})
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

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes("Database") && (
              <div className="mt-2 text-sm">
                <strong>Possible solutions:</strong>
                <ul className="list-disc list-inside mt-1">
                  <li>Start PostgreSQL database service</li>
                  <li>Check database connection settings</li>
                  <li>Verify database is running on port 5432</li>
                </ul>
              </div>
            )}
          </AlertDescription>
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

      {/* Auto-assignment Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Smart Assignment:</strong> When you select a department, the
          appropriate role will be automatically assigned. Look for the{" "}
          <Badge
            variant="outline"
            className="text-xs bg-green-50 text-green-700 border-green-200 mx-1"
          >
            Auto
          </Badge>{" "}
          badge to see auto-assigned roles.
        </AlertDescription>
      </Alert>

      {/* Search and Pagination Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <>
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
                  {paginatedUsers.map((user) => (
                    <UserAssignmentRow
                      key={user.id}
                      user={user}
                      roleAssignments={roleAssignments}
                      departmentAssignments={departmentAssignments}
                      validRoles={validRoles}
                      validDepartments={validDepartments}
                      onRoleUpdate={updateRole}
                      onDepartmentUpdate={updateDepartment}
                      getDepartmentRole={getDepartmentRole}
                    />
                  ))}
                </TableBody>
              </Table>
              
              {filteredUsers.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredUsers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
