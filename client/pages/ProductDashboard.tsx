import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeployments, useDeploymentStats } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Rocket, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const deploymentStats = [
  { label: 'Total Deployments', value: '124', color: 'text-blue-600' },
  { label: 'Successful Deployments', value: '118', color: 'text-green-600' },
  { label: 'Failed Deployments', value: '6', color: 'text-red-600' },
  { label: 'Pending Deployments', value: '2', color: 'text-yellow-600' }
];

const recentDeployments = [
  {
    id: 1,
    product: 'Core App',
    version: 'v2.1.0',
    status: 'Completed',
    deployedBy: 'Jane Doe',
    date: '2024-07-18',
    statusColor: 'bg-green-100 text-green-700',
    icon: CheckCircle
  },
  {
    id: 2,
    product: 'Analytics Module',
    version: 'v1.5.2',
    status: 'Failed',
    deployedBy: 'John Smith',
    date: '2024-07-17',
    statusColor: 'bg-red-100 text-red-700',
    icon: AlertTriangle
  },
  {
    id: 3,
    product: 'API Gateway',
    version: 'v3.0.1',
    status: 'Completed',
    deployedBy: 'Alice Brown',
    date: '2024-07-16',
    statusColor: 'bg-green-100 text-green-700',
    icon: CheckCircle
  },
  {
    id: 4,
    product: 'Mobile App',
    version: 'v1.2.3',
    status: 'Pending',
    deployedBy: 'Jane Doe',
    date: '2024-07-15',
    statusColor: 'bg-yellow-100 text-yellow-700',
    icon: Clock
  },
  {
    id: 5,
    product: 'Reporting Service',
    version: 'v0.9.0',
    status: 'Completed',
    deployedBy: 'John Smith',
    date: '2024-07-14',
    statusColor: 'bg-green-100 text-green-700',
    icon: CheckCircle
  }
];

const upcomingReleases = [
  {
    name: 'Feature X (Core App v2.2.0)',
    eta: 'ETA: 2024-07-25'
  },
  {
    name: 'Performance Improvements (API Gateway v3.0.2)',
    eta: 'ETA: 2024-08-01'
  },
  {
    name: 'New Dashboard Widgets (Analytics Module v1.6.0)',
    eta: 'ETA: 2024-08-10'
  }
];

export default function ProductDashboard() {
  const navigate = useNavigate();
  const { data: deployments = [], isLoading: deploymentsLoading } = useDeployments();
  const { data: stats, isLoading: statsLoading } = useDeploymentStats();

  const handleNewDeployment = () => {
    navigate('/product/deployment/new');
  };

  if (deploymentsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading deployments...</div>
      </div>
    );
  }

  const recentDeployments = deployments.slice(0, 5); // Show only recent 5

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Team Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor deployments and product releases</p>
        </div>
        <Button onClick={handleNewDeployment}>
          <Plus className="w-4 h-4 mr-2" />
          New Deployment
        </Button>
      </div>

      {/* Deployment Overview Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deployment Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {deploymentStats.map((stat, index) => {
            const icons = [Rocket, CheckCircle, AlertTriangle, Clock];
            const Icon = icons[index];
            
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Deployments</h2>
        <Card>
          <CardHeader>
            <CardTitle>Deployment History</CardTitle>
            <CardDescription>Latest deployment activities across all products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">PRODUCT</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">VERSION</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">STATUS</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">DEPLOYED BY</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentDeployments.map((deployment) => {
                    const StatusIcon = deployment.icon;
                    return (
                      <tr key={deployment.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{deployment.product}</div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {deployment.version}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="w-4 h-4" />
                            <Badge className={deployment.statusColor}>
                              {deployment.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {deployment.deployedBy}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {deployment.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Releases */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Releases</h2>
        <Card>
          <CardHeader>
            <CardTitle>Planned Features & Updates</CardTitle>
            <CardDescription>Scheduled releases and feature deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingReleases.map((release, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="font-medium text-gray-900">{release.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{release.eta}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
