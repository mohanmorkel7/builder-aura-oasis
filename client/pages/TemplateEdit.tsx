import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTemplates } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  FileText, 
  Settings, 
  Users, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';

const mockTemplate = {
  id: 1,
  name: 'Enterprise Onboarding Template',
  description: 'Comprehensive onboarding process for enterprise clients',
  category: 'enterprise',
  is_active: true,
  estimated_duration: 30,
  steps: [
    {
      id: 1,
      name: 'Initial Contact & Requirements Gathering',
      description: 'Conduct initial client meeting to understand requirements and expectations',
      order: 1,
      is_required: true,
      estimated_days: 3,
      assigned_role: 'sales',
      dependencies: []
    },
    {
      id: 2,
      name: 'Proposal & Contract Preparation',
      description: 'Prepare detailed proposal and contract documentation',
      order: 2,
      is_required: true,
      estimated_days: 5,
      assigned_role: 'sales',
      dependencies: [1]
    },
    {
      id: 3,
      name: 'Technical Assessment',
      description: 'Conduct technical assessment and system requirements analysis',
      order: 3,
      is_required: true,
      estimated_days: 7,
      assigned_role: 'product',
      dependencies: [2]
    },
    {
      id: 4,
      name: 'Contract Signing & Legal Review',
      description: 'Complete contract signing and legal review process',
      order: 4,
      is_required: true,
      estimated_days: 5,
      assigned_role: 'admin',
      dependencies: [2]
    },
    {
      id: 5,
      name: 'Project Setup & Configuration',
      description: 'Set up project environment and initial configuration',
      order: 5,
      is_required: true,
      estimated_days: 3,
      assigned_role: 'product',
      dependencies: [3, 4]
    },
    {
      id: 6,
      name: 'Onboarding Call & Training',
      description: 'Conduct comprehensive onboarding call and user training',
      order: 6,
      is_required: true,
      estimated_days: 2,
      assigned_role: 'sales',
      dependencies: [5]
    },
    {
      id: 7,
      name: 'Final Deployment & Go-Live',
      description: 'Complete final deployment and go-live process',
      order: 7,
      is_required: true,
      estimated_days: 5,
      assigned_role: 'product',
      dependencies: [6]
    }
  ],
  settings: {
    auto_assign: true,
    send_notifications: true,
    require_approval: true,
    allow_parallel_steps: false,
    default_priority: 'medium'
  },
  created_at: '2024-01-15T09:00:00Z',
  updated_at: '2024-01-20T14:30:00Z'
};

export default function TemplateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: templates = [] } = useTemplates();
  
  // Find template by ID or use mock data
  const originalTemplate = templates.find((t: any) => t.id === parseInt(id || '0')) || mockTemplate;
  
  const [template, setTemplate] = useState({
    ...originalTemplate,
    steps: originalTemplate.steps || [],
    settings: originalTemplate.settings || {
      auto_assign: true,
      send_notifications: true,
      require_approval: true,
      allow_parallel_steps: false,
      default_priority: 'medium'
    }
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: any) => {
    setTemplate((prev: any) => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const updateStep = (stepId: number, field: string, value: any) => {
    setTemplate((prev: any) => ({
      ...prev,
      steps: prev.steps.map((step: any) => 
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }));
    setHasChanges(true);
  };

  const addStep = () => {
    const newStep = {
      id: Math.max(...template.steps.map((s: any) => s.id)) + 1,
      name: 'New Step',
      description: '',
      order: template.steps.length + 1,
      is_required: true,
      estimated_days: 1,
      assigned_role: 'sales',
      dependencies: []
    };
    
    setTemplate((prev: any) => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    setHasChanges(true);
  };

  const removeStep = (stepId: number) => {
    setTemplate((prev: any) => ({
      ...prev,
      steps: prev.steps.filter((step: any) => step.id !== stepId)
        .map((step: any, index: number) => ({ ...step, order: index + 1 }))
    }));
    setHasChanges(true);
  };

  const moveStep = (stepId: number, direction: 'up' | 'down') => {
    const currentIndex = template.steps.findIndex((s: any) => s.id === stepId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === template.steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...template.steps];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newSteps[currentIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[currentIndex]];
    
    // Update order numbers
    newSteps.forEach((step, index) => {
      step.order = index + 1;
    });

    setTemplate((prev: any) => ({
      ...prev,
      steps: newSteps
    }));
    setHasChanges(true);
  };

  const updateSettings = (field: string, value: any) => {
    setTemplate((prev: any) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would make an API call to update the template
      console.log('Saving template:', template);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setHasChanges(false);
      navigate('/admin');
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      sales: 'bg-blue-100 text-blue-700',
      product: 'bg-green-100 text-green-700'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const totalEstimatedDays = template.steps.reduce((total: number, step: any) => total + step.estimated_days, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
            <p className="text-gray-600">{template.name}</p>
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

      {/* Status Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This template is currently <strong>{template.is_active ? 'active' : 'inactive'}</strong> and has <strong>{template.steps.length}</strong> steps with an estimated duration of <strong>{totalEstimatedDays} days</strong>.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="steps">Steps ({template.steps.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>
                Basic template details and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={template.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={template.category} onValueChange={(value) => updateField('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="small_business">Small Business</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={template.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Estimated Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={template.estimated_duration}
                    onChange={(e) => updateField('estimated_duration', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={(checked) => updateField('is_active', checked)}
                  />
                  <Label>Active Template</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Template Steps</CardTitle>
                  <CardDescription>
                    Define the workflow steps for this onboarding template
                  </CardDescription>
                </div>
                <Button onClick={addStep}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.steps.map((step: any, index: number) => (
                  <Card key={step.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                            {step.order}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{step.name}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(step.id, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(step.id, 'down')}
                            disabled={index === template.steps.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeStep(step.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Step Name</Label>
                          <Input
                            value={step.name}
                            onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Assigned Role</Label>
                          <Select 
                            value={step.assigned_role} 
                            onValueChange={(value) => updateStep(step.id, 'assigned_role', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label>Description</Label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Estimated Days</Label>
                          <Input
                            type="number"
                            min="1"
                            value={step.estimated_days}
                            onChange={(e) => updateStep(step.id, 'estimated_days', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            checked={step.is_required}
                            onCheckedChange={(checked) => updateStep(step.id, 'is_required', checked)}
                          />
                          <Label>Required</Label>
                        </div>
                        <div className="pt-6">
                          <Badge className={getRoleColor(step.assigned_role)}>
                            {step.assigned_role}
                          </Badge>
                        </div>
                      </div>

                      {step.dependencies && step.dependencies.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-600">Dependencies</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {step.dependencies.map((depId: number) => {
                              const depStep = template.steps.find((s: any) => s.id === depId);
                              return depStep ? (
                                <Badge key={depId} variant="outline" className="text-xs">
                                  Step {depStep.order}: {depStep.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>
                Configure template behavior and automation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-assign Tasks</Label>
                    <p className="text-sm text-gray-600">Automatically assign tasks based on role</p>
                  </div>
                  <Switch
                    checked={template.settings.auto_assign}
                    onCheckedChange={(checked) => updateSettings('auto_assign', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Send Notifications</Label>
                    <p className="text-sm text-gray-600">Send email notifications on status changes</p>
                  </div>
                  <Switch
                    checked={template.settings.send_notifications}
                    onCheckedChange={(checked) => updateSettings('send_notifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Approval</Label>
                    <p className="text-sm text-gray-600">Require approval before moving to next step</p>
                  </div>
                  <Switch
                    checked={template.settings.require_approval}
                    onCheckedChange={(checked) => updateSettings('require_approval', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Parallel Steps</Label>
                    <p className="text-sm text-gray-600">Allow multiple steps to run in parallel</p>
                  </div>
                  <Switch
                    checked={template.settings.allow_parallel_steps}
                    onCheckedChange={(checked) => updateSettings('allow_parallel_steps', checked)}
                  />
                </div>

                <Separator />

                <div>
                  <Label>Default Priority</Label>
                  <p className="text-sm text-gray-600 mb-2">Default priority for tasks created from this template</p>
                  <Select 
                    value={template.settings.default_priority} 
                    onValueChange={(value) => updateSettings('default_priority', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
