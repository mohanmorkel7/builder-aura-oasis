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

// Mock Azure SSO users data with realistic information
const mockAzureUsers = [
  { id: "1", name: "John Doe", email: "john.doe@company.com", role: "admin", department: "Administration", lastLogin: "2024-01-15T09:30:00Z", status: "active", azureObjectId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
  { id: "2", name: "Jane Smith", email: "jane.smith@company.com", role: "sales", department: "Sales", lastLogin: "2024-01-14T14:22:00Z", status: "active", azureObjectId: "b2c3d4e5-f6g7-8901-bcde-f23456789012" },
  { id: "3", name: "Mike Johnson", email: "mike.johnson@company.com", role: "product", department: "Product", lastLogin: "2024-01-13T11:15:00Z", status: "active", azureObjectId: "c3d4e5f6-g7h8-9012-cdef-345678901234" },
  { id: "4", name: "Alex Chen", email: "alex.chen@company.com", role: "development", department: "Development", lastLogin: "2024-01-12T16:45:00Z", status: "active", azureObjectId: "d4e5f6g7-h8i9-0123-def0-456789012345" },
  { id: "5", name: "Sarah Wilson", email: "sarah.wilson@company.com", role: "db", department: "Database", lastLogin: "2024-01-11T10:30:00Z", status: "active", azureObjectId: "e5f6g7h8-i9j0-1234-ef01-567890123456" },
  { id: "6", name: "David Brown", email: "david.brown@company.com", role: "finops", department: "FinOps", lastLogin: "2024-01-10T13:20:00Z", status: "active", azureObjectId: "f6g7h8i9-j0k1-2345-f012-678901234567" },
  { id: "7", name: "Lisa Garcia", email: "lisa.garcia@company.com", role: "hr_management", department: "HR", lastLogin: "2024-01-09T15:10:00Z", status: "active", azureObjectId: "g7h8i9j0-k1l2-3456-0123-789012345678" },
  { id: "8", name: "Tom Martinez", email: "tom.martinez@company.com", role: "infra", department: "Infrastructure", lastLogin: "2024-01-08T08:55:00Z", status: "active", azureObjectId: "h8i9j0k1-l2m3-4567-1234-890123456789" },
  { id: "9", name: "Emma Davis", email: "emma.davis@company.com", role: "switch_team", department: "Switch Team", lastLogin: "2024-01-07T12:40:00Z", status: "active", azureObjectId: "i9j0k1l2-m3n4-5678-2345-901234567890" },
];

export default function UserManagement() {
  const navigate = useNavigate();
  const { data: localUsers = [] } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Combine local and Azure users (in real app, these would come from API)
  // Add prefix to Azure user IDs to avoid key conflicts
  const azureUsersWithUniqueIds = mockAzureUsers.map(user => ({
    ...user,
    id: `azure-${user.id}`
  }));
  const allUsers = [...localUsers, ...azureUsersWithUniqueIds];

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesDepartment = selectedDepartment === "all" || user.department === selectedDepartment;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Group users by role
  const usersByRole = Object.keys(roleGroups).reduce((acc, role) => {
    acc[role as UserRole] = filteredUsers.filter(user => user.role === role);
    return acc;
  }, {} as Record<UserRole, typeof filteredUsers>);

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
      ...filteredUsers.map(user =>
        `"${user.name || 'N/A'}","${user.email || 'N/A'}","${user.role || 'N/A'}","${user.department || 'N/A'}","${user.lastLogin || 'N/A'}","${user.status || 'N/A'}"`
      )
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
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
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
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "suspended": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users, roles, and Azure SSO integration
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
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{allUsers.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Azure SSO Users</p>
                <p className="text-2xl font-bold text-green-600">{mockAzureUsers.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {allUsers.filter(u => u.status === "active").length}
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
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(allUsers.map(u => u.department)).size}
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

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(allUsers.map(u => u.department))).map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
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
                              {user.name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleGroups[user.role as UserRole]?.color}>
                          {roleGroups[user.role as UserRole]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || 'N/A'}</TableCell>
                      <TableCell>{user.lastLogin || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getUserStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.azureObjectId ? (
                          <div className="flex items-center space-x-1">
                            <Cloud className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600">Azure SSO</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Local</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
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
                      Permissions: {roleGroups[role as UserRole]?.permissions.join(", ")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{user.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                            <div className="text-xs text-gray-400">{user.department || 'N/A'}</div>
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
                  {mockAzureUsers.filter(user => 
                    selectedRole === "all" || user.role === selectedRole
                  ).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleGroups[user.role as UserRole]?.color}>
                          {roleGroups[user.role as UserRole]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || 'N/A'}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {user.azureObjectId}
                        </code>
                      </TableCell>
                      <TableCell>{user.lastLogin || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
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
