import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates, useDeleteTemplate, useDuplicateTemplate } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus } from 'lucide-react';

const getTypeColor = (type: string) => {
  switch (type) {
    case 'enterprise':
      return 'bg-primary';
    case 'smb':
      return 'bg-green-100 text-green-700';
    default:
      return '';
  }
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: templates = [], isLoading } = useTemplates();
  const deleteTemplateMutation = useDeleteTemplate();
  const duplicateTemplateMutation = useDuplicateTemplate();

  const handleCreateTemplate = () => {
    navigate('/admin/templates/new');
  };

  const handleUseTemplate = (templateId: number) => {
    // Navigate to client creation with pre-selected template
    navigate(`/sales/new-client?template=${templateId}`);
  };

  const handleEditTemplate = (templateId: number) => {
    navigate(`/admin/templates/${templateId}/edit`);
  };

  const handleDuplicateTemplate = async (templateId: number) => {
    if (user) {
      try {
        await duplicateTemplateMutation.mutateAsync({
          id: templateId,
          createdBy: parseInt(user.id)
        });
      } catch (error) {
        console.error('Error duplicating template:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Templates</h1>
          <p className="text-gray-600 mt-1">Manage and create onboarding workflows</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6">
        {templates.map((template: any) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {template.description || 'No description provided'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleUseTemplate(template.id)}>
                  Use Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{template.step_count || 0}</span> Steps
                  </div>
                  <Badge
                    variant={template.type === 'enterprise' ? 'default' : 'secondary'}
                    className={getTypeColor(template.type)}
                  >
                    {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template.id)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicateTemplate(template.id)}>
                    Duplicate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      <div className="text-center py-12 mt-8 border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Create your first template
          </h3>
          <p className="text-gray-600 mb-4">
            Build custom onboarding workflows to streamline your client setup process.
          </p>
          <Button onClick={handleCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>
    </div>
  );
}
