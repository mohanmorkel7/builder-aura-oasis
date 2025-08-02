import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Settings,
  BarChart3,
  Package,
  Target,
  DollarSign,
  UserPlus,
  Headphones,
  Megaphone
} from "lucide-react";
import { format } from "date-fns";
import CreateTemplateDialog from "@/components/CreateTemplateDialogSimple";
import TemplateStatsCard from "@/components/TemplateStatsCard";
import ViewTemplateDialog from "@/components/ViewTemplateDialog";
import EditTemplateDialog from "@/components/EditTemplateDialog";

interface TemplateCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sort_order: number;
}

interface Template {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  usage_count: number;
  step_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_name: string;
  category?: TemplateCategory;
}

const iconMap = {
  Package,
  Target,
  DollarSign,
  UserPlus,
  Headphones,
  Megaphone,
  Settings,
  BarChart3,
};

export default function AdminTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewTemplateId, setViewTemplateId] = useState<number | null>(null);
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);

  // Fetch template categories
  const { data: categories = [] } = useQuery({
    queryKey: ["template-categories"],
    queryFn: () => apiClient.getTemplateCategories(),
  });

  // Fetch templates with categories
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates-admin", selectedCategory, searchTerm],
    queryFn: () => {
      if (searchTerm) {
        return apiClient.searchTemplates(searchTerm, selectedCategory === "all" ? undefined : parseInt(selectedCategory));
      }
      if (selectedCategory === "all") {
        return apiClient.getTemplatesWithCategories();
      }
      return apiClient.getTemplatesByCategory(parseInt(selectedCategory));
    },
  });

  // Fetch template stats
  const { data: stats } = useQuery({
    queryKey: ["template-stats"],
    queryFn: () => apiClient.getTemplateStats(),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: number) => apiClient.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-admin"] });
      queryClient.invalidateQueries({ queryKey: ["template-stats"] });
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: (templateId: number) => apiClient.duplicateTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-admin"] });
    },
  });

  const handleDeleteTemplate = (templateId: number) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleDuplicateTemplate = (templateId: number) => {
    if (user) {
      duplicateTemplateMutation.mutate(templateId);
    }
  };

  const handleViewTemplate = (templateId: number) => {
    setViewTemplateId(templateId);
  };

  const handleEditTemplate = (templateId: number) => {
    setEditTemplateId(templateId);
  };

  const getCategoryIcon = (iconName?: string) => {
    if (!iconName) return Settings;
    return iconMap[iconName as keyof typeof iconMap] || Settings;
  };

  const filteredTemplates = templates.filter((template) => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600 mt-1">Manage workflow templates and categories</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <CreateTemplateDialog 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["templates-admin"] });
              }}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TemplateStatsCard
            title="Total Templates"
            value={stats.total_templates}
            icon={Package}
            color="blue"
          />
          <TemplateStatsCard
            title="Active Templates"
            value={stats.active_templates}
            icon={Target}
            color="green"
          />
          <TemplateStatsCard
            title="Total Usage"
            value={stats.total_usage}
            icon={BarChart3}
            color="purple"
          />
          <TemplateStatsCard
            title="Categories"
            value={categories.length}
            icon={Settings}
            color="orange"
          />
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => {
                  const IconComponent = getCategoryIcon(category.icon);
                  return (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <IconComponent className="w-4 h-4" />
                        {category.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Tabs */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          {isLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const CategoryIcon = template.category?.icon 
                  ? getCategoryIcon(template.category.icon) 
                  : Package;
                
                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {template.category && (
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: template.category.color }}
                              />
                              <CategoryIcon className="w-4 h-4" />
                            </div>
                          )}
                          <Badge variant="secondary">
                            {template.step_count} steps
                          </Badge>
                        </div>
                        <Badge variant={template.usage_count > 0 ? "default" : "outline"}>
                          {template.usage_count} uses
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>by {template.creator_name}</span>
                        <span>{format(new Date(template.updated_at), "MMM d, yyyy")}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewTemplate(template.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditTemplate(template.id)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template.id)}
                          disabled={duplicateTemplateMutation.isPending}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={deleteTemplateMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {filteredTemplates.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No templates found
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Templates List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {template.category && (
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: template.category.color }}
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>{template.step_count} steps</span>
                          <span>{template.usage_count} uses</span>
                          <span>by {template.creator_name}</span>
                          <span>{format(new Date(template.updated_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTemplate(template.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryTemplates = filteredTemplates.filter(
                t => t.category_id === category.id
              );
              const CategoryIcon = getCategoryIcon(category.icon);
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <CategoryIcon 
                          className="w-4 h-4" 
                          style={{ color: category.color }}
                        />
                      </div>
                      <div>
                        <CardTitle>{category.name}</CardTitle>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {categoryTemplates.length} templates
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryTemplates.map((template) => (
                        <div key={template.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline">{template.usage_count} uses</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditTemplate(template.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDuplicateTemplate(template.id)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {categoryTemplates.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          No templates in this category
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Template Dialog */}
      <ViewTemplateDialog
        templateId={viewTemplateId}
        isOpen={!!viewTemplateId}
        onClose={() => setViewTemplateId(null)}
      />

      {/* Edit Template Dialog */}
      <EditTemplateDialog
        templateId={editTemplateId}
        isOpen={!!editTemplateId}
        onClose={() => setEditTemplateId(null)}
        categories={categories}
      />
    </div>
  );
}
