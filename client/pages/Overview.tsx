import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Rocket, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react';

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-template':
        navigate('/admin/templates/new');
        break;
      case 'view-reports':
        navigate('/admin/reports');
        break;
      case 'manage-users':
        navigate('/admin/users');
        break;
      case 'add-client':
        navigate('/sales/new-client');
        break;
      case 'schedule-followup':
        navigate('/sales/followup/new');
        break;
      case 'view-sales-report':
        navigate('/sales/reports');
        break;
      case 'new-deployment':
        navigate('/product/deployment/new');
        break;
      case 'view-pipeline':
        navigate('/product/pipeline');
        break;
      case 'monitor-health':
        navigate('/product/health');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { label: 'Total Users', value: '156', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
          { label: 'Active Projects', value: '24', icon: Rocket, color: 'text-green-600', bgColor: 'bg-green-100' },
          { label: 'Pending Tasks', value: '8', icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
          { label: 'System Health', value: '98%', icon: Activity, color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
        ];
      case 'sales':
        return [
          { label: 'Total Clients', value: '24', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
          { label: 'Active Deals', value: '18', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
          { label: 'Follow-ups Due', value: '6', icon: Calendar, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
          { label: 'This Month', value: '+12', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
        ];
      case 'product':
        return [
          { label: 'Deployments', value: '124', icon: Rocket, color: 'text-blue-600', bgColor: 'bg-blue-100' },
          { label: 'Success Rate', value: '95%', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
          { label: 'Failed', value: '6', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
          { label: 'Pending', value: '2', icon: Calendar, color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
        ];
      default:
        return [];
    }
  };

  const stats = getRoleSpecificStats();

  const getRecentActivity = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { action: 'New user registered', detail: 'jane.doe@example.com', time: '5 minutes ago' },
          { action: 'System backup completed', detail: 'Daily backup successful', time: '1 hour ago' },
          { action: 'Template created', detail: 'Enterprise Onboarding v2.0', time: '2 hours ago' },
          { action: 'User role updated', detail: 'mike.johnson promoted to Sales Lead', time: '3 hours ago' }
        ];
      case 'sales':
        return [
          { action: 'Client follow-up completed', detail: 'Acme Corp - Phase 2 discussion', time: '30 minutes ago' },
          { action: 'New client added', detail: 'Global Solutions Inc.', time: '2 hours ago' },
          { action: 'Deal status updated', detail: 'Initech moved to closing stage', time: '4 hours ago' },
          { action: 'Meeting scheduled', detail: 'Soylent Corp review call', time: '5 hours ago' }
        ];
      case 'product':
        return [
          { action: 'Deployment completed', detail: 'Core App v2.1.0 to production', time: '15 minutes ago' },
          { action: 'Release scheduled', detail: 'Analytics Module v1.6.0', time: '1 hour ago' },
          { action: 'Build failed', detail: 'Mobile App v1.2.4 - fixing issues', time: '3 hours ago' },
          { action: 'Feature flag enabled', detail: 'New dashboard widgets', time: '6 hours ago' }
        ];
      default:
        return [];
    }
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your {user?.role} dashboard today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes in your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.detail}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.role === 'admin' && (
                <>
                  <Button className="w-full justify-start" variant="outline" onClick={() => handleQuickAction('create-template')}>
                    <Users className="w-4 h-4 mr-2" />
                    Create Onboarding Template
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => handleQuickAction('view-reports')}>
                    <Activity className="w-4 h-4 mr-2" />
                    View System Reports
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => handleQuickAction('manage-users')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Manage User Roles
                  </Button>
                </>
              )}

              {user?.role === 'sales' && (
                <>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Add New Client
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Sales Report
                  </Button>
                </>
              )}

              {user?.role === 'product' && (
                <>
                  <Button className="w-full justify-start" variant="outline">
                    <Rocket className="w-4 h-4 mr-2" />
                    Create New Deployment
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Activity className="w-4 h-4 mr-2" />
                    View Release Pipeline
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Monitor System Health
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
