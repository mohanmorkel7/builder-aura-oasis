import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/hooks/useApi";
import { roleGroups, UserRole } from "@/lib/auth-context";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Shield,
  Building,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Cloud,
} from "lucide-react";


export default function UserManagement() {
  const navigate = useNavigate();
  const { data: localUsers = [] } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Use only database users
  const allUsers = localUsers || [];

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      (user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || user.last_name || "Unknown"
      )
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      false ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesDepartment =
      selectedDepartment === "all" || user.department === selectedDepartment;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Group users by role
  const usersByRole = Object.keys(roleGroups).reduce(
    (acc, role) => {
      acc[role as UserRole] = filteredUsers.filter(
        (user) => user.role === role,
      );
      return acc;
    },
    {} as Record<UserRole, typeof filteredUsers>,
  );

  const handleAddUser = () => {
    navigate("/admin/users/add");
  };

  const handleSyncAzure = async () => {
    // In real implementation, this would sync with Azure AD
    console.log("Syncing with Azure AD...");
    // Show toast notification, refresh data, etc.
  };

  const handleExportUsers = () => {
    // Export users to CSV
    const csv = [
      "Name,Email,Role,Department,Last Login,Status",
      ...filteredUsers.map(
        (user) =>
          `"${(user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name || "Unknown") || "N/A"}","${user.email || "N/A"}","${user.role || "N/A"}","${user.department || "N/A"}","${user.last_login || "N/A"}","${user.status || "N/A"}"`,
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    a.click();
  };

  const handleViewUser = (userId: string) => {
    // Navigate to user details page
    navigate(`/admin/users/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    // Navigate to user edit page
    navigate(`/admin/users/${userId}/edit`);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    // Show confirmation dialog
    if (
      window.confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      )
    ) {
      // In real implementation, this would call the delete API
      console.log(`Deleting user ${userId}`);
      // Show success toast
      alert(`User "${userName}" has been scheduled for deletion.`);
    }
  };

  const handleUserSettings = (userId: string) => {
    // Navigate to user settings/permissions page
    navigate(`/admin/users/${userId}/settings`);
  };

  const formatLastLogin = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return dateString;
    }
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users and roles
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleSyncAzure}>
            <Cloud className="w-4 h-4 mr-2" />
            Sync Azure AD
          </Button>
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddUser}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {allUsers.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Azure SSO Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {mockAzureUsers.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Cloud className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {allUsers.filter((u) => u.status === "active").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Departments
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(allUsers.map((u) => u.department)).size}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(roleGroups).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(allUsers.map((u) => u.department))).map(
                    (dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Views */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">All Users</TabsTrigger>
          <TabsTrigger value="roles">By Role Groups</TabsTrigger>
          <TabsTrigger value="azure">Azure SSO Users</TabsTrigger>
        </TabsList>

        {/* All Users List */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Complete list of all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.first_name && user.last_name
                                ? `${user.first_name[0]}${user.last_name[0]}`
                                : user.first_name?.[0] ||
                                  user.last_name?.[0] ||
                                  "N/A"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {(user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.first_name ||
                                  user.last_name ||
                                  "Unknown") || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={roleGroups[user.role as UserRole]?.color}
                        >
                          {roleGroups[user.role as UserRole]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || "N/A"}</TableCell>
                      <TableCell>
                        {user.last_login
                          ? formatLastLogin(user.last_login)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getUserStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.azureObjectId ? (
                          <div className="flex items-center space-x-1">
                            <Cloud className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600">
                              Azure SSO
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Local</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(user.id)}
                            title="View User"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user.id)}
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeleteUser(
                                user.id,
                                (user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.first_name ||
                                    user.last_name ||
                                    "Unknown") || "N/A",
                              )
                            }
                            title="Delete User"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Role Groups */}
        <TabsContent value="roles">
          <div className="grid gap-6">
            {Object.entries(usersByRole).map(([role, users]) => (
              <Card key={role}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={roleGroups[role as UserRole]?.color}>
                        {roleGroups[role as UserRole]?.label}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {users.length} users
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Permissions:{" "}
                      {roleGroups[role as UserRole]?.permissions.join(", ")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.first_name && user.last_name
                                ? `${user.first_name[0]}${user.last_name[0]}`
                                : user.first_name?.[0] ||
                                  user.last_name?.[0] ||
                                  "N/A"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {(user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.first_name ||
                                  user.last_name ||
                                  "Unknown") || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email || "N/A"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {user.department || "N/A"}
                            </div>
                          </div>
                          {user.azureObjectId && (
                            <Cloud className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Azure SSO Users */}
        <TabsContent value="azure">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-blue-600" />
                <span>Azure SSO Users ({mockAzureUsers.length})</span>
              </CardTitle>
              <CardDescription>
                Users authenticated through Microsoft Azure Active Directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Azure Object ID</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAzureUsers
                    .filter(
                      (user) =>
                        selectedRole === "all" || user.role === selectedRole,
                    )
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.first_name && user.last_name
                                  ? `${user.first_name[0]}${user.last_name[0]}`
                                  : user.first_name?.[0] ||
                                    user.last_name?.[0] ||
                                    "N/A"}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {(user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.first_name ||
                                    user.last_name ||
                                    "Unknown") || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email || "N/A"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={roleGroups[user.role as UserRole]?.color}
                          >
                            {roleGroups[user.role as UserRole]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department || "N/A"}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {user.azureObjectId}
                          </code>
                        </TableCell>
                        <TableCell>
                          {user.last_login
                            ? formatLastLogin(user.last_login)
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUser(user.id)}
                              title="View User"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserSettings(user.id)}
                              title="User Settings"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
