import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useMyPartialSaves } from "@/hooks/useApi";
import { formatToIST } from "@/lib/dateUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  FileText,
  Play,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface PartialSavesProps {
  onResumePartialSave: (partialData: any) => void;
}

export default function PartialSaves({ onResumePartialSave }: PartialSavesProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ? parseInt(user.id) : undefined;
  
  const { data: partialSaves = [], isLoading, refetch } = useMyPartialSaves(userId);

  const handleResume = (partialSave: any) => {
    try {
      const notes = JSON.parse(partialSave.notes || '{}');
      const originalData = notes.originalData || {};
      
      // Merge the original data with the lead data
      const resumeData = {
        ...originalData,
        // Override with any database saved values
        lead_source: partialSave.lead_source,
        client_name: partialSave.client_name === 'PARTIAL_SAVE_IN_PROGRESS' ? '' : partialSave.client_name,
        project_title: partialSave.project_title === 'Partial Save - In Progress' ? '' : partialSave.project_title,
        project_description: partialSave.project_description,
        // Include the partial save metadata
        id: partialSave.id, // This is the key field that CreateLead looks for
        _resumeFromId: partialSave.id,
        _lastSaved: notes.lastSaved,
        _completedTabs: notes.completedTabs,
      };
      
      onResumePartialSave(resumeData);
    } catch (error) {
      console.error('Error resuming partial save:', error);
      alert('Error loading saved data. Please try again.');
    }
  };

  const handleDelete = async (partialSave: any) => {
    if (confirm('Are you sure you want to delete this saved draft?')) {
      try {
        // TODO: Implement delete API
        console.log('Delete partial save:', partialSave.id);
        refetch();
      } catch (error) {
        console.error('Error deleting partial save:', error);
        alert('Error deleting saved draft. Please try again.');
      }
    }
  };

  const getPartialSaveInfo = (partialSave: any) => {
    try {
      const notes = JSON.parse(partialSave.notes || '{}');
      return {
        lastSaved: notes.lastSaved,
        completedTabs: notes.completedTabs || [],
        originalData: notes.originalData || {}
      };
    } catch {
      return {
        lastSaved: partialSave.created_at,
        completedTabs: [],
        originalData: {}
      };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading saved drafts...</div>
        </CardContent>
      </Card>
    );
  }

  if (partialSaves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Saved Drafts
          </CardTitle>
          <CardDescription>
            Your partially completed lead forms will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No saved drafts</h3>
            <p className="text-sm">
              Start creating a lead and use "Save Progress" to save your work.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Saved Drafts ({partialSaves.length})
        </CardTitle>
        <CardDescription>
          Resume your partially completed lead forms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {partialSaves.map((partialSave: any) => {
            const info = getPartialSaveInfo(partialSave);
            const lastSaved = new Date(info.lastSaved);
            const timeSince = Math.floor((Date.now() - lastSaved.getTime()) / (1000 * 60 * 60)); // hours
            
            return (
              <div key={partialSave.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {partialSave.client_name === 'PARTIAL_SAVE_IN_PROGRESS' 
                          ? 'Unsaved Lead Draft' 
                          : partialSave.client_name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {info.completedTabs.length > 0 ? `${info.completedTabs[0]} tab` : 'Draft'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {timeSince < 1 
                          ? 'Saved less than 1 hour ago'
                          : timeSince < 24 
                          ? `Saved ${timeSince} hours ago`
                          : `Saved ${Math.floor(timeSince / 24)} days ago`
                        }
                      </div>
                      
                      {partialSave.project_title && partialSave.project_title !== 'Partial Save - In Progress' && (
                        <div className="text-blue-600">
                          {partialSave.project_title}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResume(partialSave)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Saved Draft</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this saved draft? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogTrigger>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleDelete(partialSave)}
                          >
                            Delete Draft
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {partialSaves.length > 3 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Drafts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
