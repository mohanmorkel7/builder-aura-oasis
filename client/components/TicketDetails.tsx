import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import RichTextCommentEditor from "@/components/RichTextCommentEditor";
import {
  Edit,
  Save,
  X,
  MessageSquare,
  Paperclip,
  Clock,
  User,
  Calendar,
  Send,
  Upload,
  FileText,
  Download,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface TicketDetailsProps {
  ticket: any;
  onUpdate: () => void;
  metadata?: {
    priorities: any[];
    statuses: any[];
    categories: any[];
  };
  currentUser?: any;
}

export default function TicketDetails({ ticket, onUpdate, metadata, currentUser }: TicketDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: ticket.subject,
    description: ticket.description || "",
    priority_id: ticket.priority_id?.toString() || "",
    status_id: ticket.status_id?.toString() || "",
    category_id: ticket.category_id?.toString() || "",
    assigned_to: ticket.assigned_to?.toString() || "",
  });
  
  // Comment attachments are now handled in RichTextCommentEditor

  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["ticket-comments", ticket.id],
    queryFn: () => apiClient.getTicketComments(ticket.id),
  });

  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.getUsers(),
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateTicket(ticket.id, data),
    onSuccess: () => {
      onUpdate();
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (commentData: any) => apiClient.addTicketComment(ticket.id, commentData),
    onSuccess: () => {
      refetchComments();
      setNewComment("");
      setMentions([]);
    },
  });

  const handleSave = () => {
    const updateData = {
      ...editForm,
      priority_id: editForm.priority_id ? parseInt(editForm.priority_id) : undefined,
      status_id: editForm.status_id ? parseInt(editForm.status_id) : undefined,
      category_id: editForm.category_id ? parseInt(editForm.category_id) : undefined,
      assigned_to: editForm.assigned_to ? parseInt(editForm.assigned_to) : undefined,
      updated_by: currentUser?.id || "1",
    };
    
    updateTicketMutation.mutate(updateData);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const commentData = {
      content: newComment,
      is_internal: isInternal,
      mentions: mentions.length > 0 ? mentions : undefined,
      user_id: currentUser?.id || "1",
    };
    
    addCommentMutation.mutate(commentData);
  };

  const detectMentions = (text: string) => {
    const mentionPattern = /@(\w+)/g;
    const foundMentions: string[] = [];
    let match;
    
    while ((match = mentionPattern.exec(text)) !== null) {
      foundMentions.push(match[1]);
    }
    
    setMentions(foundMentions);
  };

  const handleCommentChange = (value: string) => {
    setNewComment(value);
    detectMentions(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono">
              {ticket.track_id}
            </Badge>
            {ticket.priority && (
              <Badge style={{ backgroundColor: `${ticket.priority.color}20`, color: ticket.priority.color }}>
                {ticket.priority.name}
              </Badge>
            )}
            {ticket.status && (
              <Badge variant={ticket.status.is_closed ? "secondary" : "default"}>
                {ticket.status.name}
              </Badge>
            )}
          </div>
          
          {isEditing ? (
            <Input
              value={editForm.subject}
              onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
              className="text-xl font-semibold"
            />
          ) : (
            <h2 className="text-2xl font-semibold">{ticket.subject}</h2>
          )}
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={updateTicketMutation.isPending}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateTicketMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateTicketMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="comments">
            Comments
            {comments && comments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {comments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Main Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {ticket.description || "No description provided"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.priority_id}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, priority_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {metadata?.priorities?.map((priority) => (
                          <SelectItem key={priority.id} value={priority.id.toString()}>
                            {priority.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2">{ticket.priority?.name || "Not set"}</div>
                  )}
                </div>

                <div>
                  <Label>Status</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.status_id}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, status_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {metadata?.statuses?.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2">{ticket.status?.name || "Not set"}</div>
                  )}
                </div>

                <div>
                  <Label>Category</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.category_id}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {metadata?.categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2">{ticket.category?.name || "Not set"}</div>
                  )}
                </div>

                <div>
                  <Label>Assigned To</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.assigned_to}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, assigned_to: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name} {user.last_name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2">{ticket.assignee?.name || "Unassigned"}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <Label>Created By</Label>
                  <div className="p-2">
                    {ticket.creator?.name} on {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <div className="p-2">
                    {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {/* Add Comment */}
          <Card>
            <CardHeader>
              <CardTitle>Add Comment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Type your comment here... Use @username to mention someone or @TKT-#### to reference another ticket"
                rows={3}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    <span className="text-sm">Internal comment</span>
                  </label>
                  
                  {mentions.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Mentioning: {mentions.map(mention => `@${mention}`).join(", ")}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleAddComment} 
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {comments?.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {comment.user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{comment.user?.name}</span>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.is_internal && (
                          <Badge variant="outline" className="text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                      
                      <div className="whitespace-pre-wrap text-sm">
                        {comment.content}
                      </div>
                      
                      {comment.mentions && comment.mentions.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Mentioned: {comment.mentions.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!comments || comments.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No comments yet. Be the first to comment!
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Activity log will show ticket history, status changes, assignments, etc.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
