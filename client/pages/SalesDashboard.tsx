import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Eye, Edit, Users } from 'lucide-react';

const clients = [
  {
    id: 1,
    name: 'Acme Corp',
    status: 'Active',
    lastContact: '2023-10-26',
    nextFollowUp: '2023-11-02',
    statusColor: 'bg-green-100 text-green-700'
  },
  {
    id: 2,
    name: 'Globex Inc.',
    status: 'Pending',
    lastContact: '2023-10-20',
    nextFollowUp: '2023-10-28',
    statusColor: 'bg-yellow-100 text-yellow-700'
  },
  {
    id: 3,
    name: 'Soylent Corp',
    status: 'Onboarded',
    lastContact: '2023-09-15',
    nextFollowUp: 'N/A',
    statusColor: 'bg-blue-100 text-blue-700'
  },
  {
    id: 4,
    name: 'Initech',
    status: 'Active',
    lastContact: '2023-10-25',
    nextFollowUp: '2023-11-01',
    statusColor: 'bg-green-100 text-green-700'
  }
];

export default function SalesDashboard() {
  const navigate = useNavigate();

  const handleCreateClient = () => {
    navigate('/sales/new-client');
  };

  const handleViewClient = (clientId: number) => {
    navigate(`/sales/client/${clientId}`);
  };

  const handleEditClient = (clientId: number) => {
    navigate(`/sales/client/${clientId}/edit`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client List</h1>
          <p className="text-gray-600 mt-1">Manage your client relationships and follow-ups</p>
        </div>
        <Button onClick={handleCreateClient}>
          <Plus className="w-4 h-4 mr-2" />
          Create Client
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search clients..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Client Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Overview</CardTitle>
          <CardDescription>Track and manage all your client relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">CLIENT NAME</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">STATUS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">LAST CONTACT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">NEXT FOLLOW-UP</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{client.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={client.statusColor}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {client.lastContact}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {client.nextFollowUp}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewClient(client.id)}>
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditClient(client.id)}>
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">18</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">4</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-primary">+6</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
