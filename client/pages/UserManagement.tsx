import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  UserCheck,
  UserX,
  Shield,
  ArrowLeft
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'product';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  joinDate: string;
}

const mockUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'admin@banani.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15',
    joinDate: '2023-01-10'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'sales@banani.com',
    role: 'sales',
    status: 'active',
    lastLogin: '2024-01-14',
    joinDate: '2023-02-15'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'product@banani.com',
    role: 'product',
    status: 'active',
    lastLogin: '2024-01-13',
    joinDate: '2023-03-20'
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah@banani.com',
    role: 'sales',
    status: 'inactive',
    lastLogin: '2023-12-20',
    joinDate: '2023-04-01'
  },
  {
    id: 5,
    name: 'Tom Brown',
    email: 'tom@banani.com',
    role: 'product',
    status: 'pending',
    lastLogin: 'Never',
    joinDate: '2024-01-10'
  }
];

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  sales: 'bg-blue-100 text-blue-700',
  product: 'bg-green-100 text-green-700'
};

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700'
};

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: users = [], isLoading, error } = useUsers();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleCreateUser = () => {
    navigate('/admin/users/new');
  };

  const handleViewUser = (userId: number) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleEditUser = (userId: number) => {
    navigate(`/admin/users/${userId}/edit`);
  };

  const handleChangeRole = (userId: number, newRole: 'admin' | 'sales' | 'product') => {
    updateUserMutation.mutate({ id: userId, userData: { role: newRole } });
  };

  const handleChangeStatus = (userId: number, newStatus: 'active' | 'inactive' | 'pending') => {
    updateUserMutation.mutate({ id: userId, userData: { status: newStatus } });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    inactive: users.filter(u => u.status === 'inactive').length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Shield className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <UserX className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="product">Product</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">USER</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">ROLE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">STATUS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">LAST LOGIN</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Select value={user.role} onValueChange={(value) => handleChangeRole(user.id, value as any)}>
                        <SelectTrigger className="w-[120px]">
                          <Badge className={roleColors[user.role]}>
                            {user.role}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-4 px-4">
                      <Select value={user.status} onValueChange={(value) => handleChangeStatus(user.id, value as any)}>
                        <SelectTrigger className="w-[120px]">
                          <Badge className={statusColors[user.status]}>
                            {user.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {user.lastLogin}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewUser(user.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
