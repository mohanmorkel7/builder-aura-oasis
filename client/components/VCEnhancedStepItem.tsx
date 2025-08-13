import React, { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  MessageCircle,
  Upload,
  Send,
  Trash2,
  GripVertical,
  Target,
  Calendar,
  DollarSign,
  User,
  Image,
  Eye,
  Edit,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useVCStepChats,
  useCreateVCStepChat,
  useDeleteVCStepChat,
  useCreateFollowUp,
  useUsers,
} from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import { formatToISTDateTime } from "@/lib/dateUtils";

interface VCEnhancedStepItemProps {
  step: any;
  vcId: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onStatusChange: (stepId: number, status: string) => void;
  onDelete: (stepId: number) => void;
  isDragOverlay?: boolean;
}

interface ChatMessage {
  id: number;
  user_name: string;
  user_id?: number;
  message: string;
  is_rich_text: boolean;
  message_type: "text" | "file" | "system";
  created_at: string;
  attachments?: any[];
}

export function VCEnhancedStepItem({
  step,
  vcId,
  isExpanded,
  onToggleExpansion,
  onStatusChange,
  onDelete,
  isDragOverlay = false,
}: VCEnhancedStepItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { data: users = [], isLoading: usersLoading } = useUsers();

  // Chat-related queries and mutations
  const {
    data: chatMessages = [],
    isLoading: chatLoading,
    error: chatError,
  } = useVCStepChats(step.id);
  const createChatMutation = useCreateVCStepChat();
  const deleteChatMutation = useDeleteVCStepChat();
  const createFollowUpMutation = useCreateFollowUp();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    disabled: step.isTemplate || isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sortedMessages = React.useMemo(() => {
    const sorted = [...chatMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return sorted;
  }, [chatMessages, step.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current && sortedMessages.length > 0) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [sortedMessages]);

  // Debug logging
  React.useEffect(() => {
    if (chatError) {
      console.error("Chat loading error for VC step", step.id, ":", chatError);
    }
  }, [chatError, step.id]);

  const [newMessage, setNewMessage] = useState("");
  const [stagedAttachments, setStagedAttachments] = useState<any[]>([]);

  // Follow-up related states
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpAssignTo, setFollowUpAssignTo] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageText, setEditMessageText] = useState("");

  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);

  // Function to highlight mentions and make follow-up IDs clickable
  const processMessageContent = (messageText: string) => {
    if (!user) return messageText;

    let processedText = messageText;

    // Look for mentions of current user (case insensitive)
    const mentionPattern = new RegExp(
      `@(${user.first_name}\\s*${user.last_name}|${user.first_name}|${user.last_name})`,
      "gi",
    );

    processedText = processedText.replace(mentionPattern, (match) => {
      return `<span class="bg-yellow-200 px-1 rounded font-medium">${match}</span>`;
    });

    // Look for follow-up IDs (#123) and make them clickable
    const followUpPattern = /#(\d+)/g;
    processedText = processedText.replace(followUpPattern, (match, id) => {
      return `<button class="text-blue-600 hover:text-blue-800 underline font-medium" onclick="window.open('/follow-ups/${id}', '_blank')">${match}</button>`;
    });

    return processedText;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && stagedAttachments.length === 0) return;

    try {
      console.log("Sending VC step chat message:", {
        step_id: step.id,
        vc_id: vcId,
        message: newMessage,
        attachments: stagedAttachments,
      });

      const chatData = {
        message: newMessage,
        user_name: `${user?.first_name} ${user?.last_name}` || "Unknown User",
        user_id: parseInt(user?.id || "1"),
        is_rich_text: false,
        message_type: "text" as const,
        attachments: stagedAttachments,
      };

      await createChatMutation.mutateAsync({
        stepId: step.id,
        chatData,
      });

      setNewMessage("");
      setStagedAttachments([]);
    } catch (error) {
      console.error("Failed to send VC step message:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Uploading VC step file:", file.name);
      
      // For now, just stage the file info - you might want to upload to a file service
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Temporary URL for preview
      };

      setStagedAttachments((prev) => [...prev, fileInfo]);
    } catch (error) {
      console.error("Failed to upload VC step file:", error);
    }
  };

  const removeAttachment = (index: number) => {
    setStagedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending":
        return <Target className="w-4 h-4 text-gray-400" />;
      default:
        return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCreateFollowUp = async () => {
    if (!followUpNotes.trim()) return;

    try {
      const followUpData = {
        type: "vc_step",
        related_id: step.id,
        notes: followUpNotes,
        assigned_to: followUpAssignTo ? parseInt(followUpAssignTo) : user?.id,
        due_date: followUpDueDate || null,
        status: "pending",
        priority: "medium",
        created_by: parseInt(user?.id || "1"),
      };

      await createFollowUpMutation.mutateAsync(followUpData);

      // Reset form
      setCreateFollowUp(false);
      setFollowUpNotes("");
      setFollowUpAssignTo("");
      setFollowUpDueDate("");

      // Send a system message about the follow-up
      const systemChatData = {
        message: `📅 Follow-up created: ${followUpNotes}`,
        user_name: "System",
        user_id: null,
        is_rich_text: false,
        message_type: "system" as const,
        attachments: [],
      };

      await createChatMutation.mutateAsync({
        stepId: step.id,
        chatData: systemChatData,
      });
    } catch (error) {
      console.error("Failed to create VC follow-up:", error);
    }
  };

  if (isDragOverlay) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(step.status)}
              <div>
                <CardTitle className="text-sm">{step.name}</CardTitle>
                <CardDescription className="text-xs">
                  {step.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${
        step.isTemplate
          ? "bg-blue-50 border-blue-200"
          : isExpanded
            ? "shadow-md"
            : "hover:shadow-sm"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpansion}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {!step.isTemplate && (
                  <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                {getStatusIcon(step.status)}
                <div className="flex-1">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {step.name}
                    {step.isTemplate && (
                      <Badge variant="outline" className="text-xs">
                        Template
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {step.description}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getStatusColor(step.status)}`}>
                  {step.status.replace("_", " ").toUpperCase()}
                </Badge>
                {step.priority && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${getPriorityColor(step.priority)}`}
                  >
                    {step.priority.toUpperCase()}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {!step.isTemplate && (
              <>
                {/* Status Update Section */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">
                    Update Status
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={step.status === "pending" ? "default" : "outline"}
                      onClick={() => onStatusChange(step.id, "pending")}
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        step.status === "in_progress" ? "default" : "outline"
                      }
                      onClick={() => onStatusChange(step.id, "in_progress")}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant={step.status === "completed" ? "default" : "outline"}
                      onClick={() => onStatusChange(step.id, "completed")}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Button>
                  </div>
                </div>

                {/* Step Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2 text-sm">
                    {step.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Due:</span>
                        <span>{formatToISTDateTime(step.due_date)}</span>
                      </div>
                    )}
                    {step.assigned_to && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Assigned to:</span>
                        <span>
                          {users.find((u) => u.id === step.assigned_to)?.first_name ||
                            "Unknown"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {step.estimated_days && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Estimated:</span>
                        <span>{step.estimated_days} days</span>
                      </div>
                    )}
                    {step.progress !== undefined && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Progress:</span>
                        <span>{step.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Chat Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Team Chat ({sortedMessages.length})
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCreateFollowUp(!createFollowUp)}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Follow-up
                    </Button>
                  </div>

                  {/* Follow-up Creation */}
                  {createFollowUp && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Label className="text-sm font-medium mb-2 block">
                        Create Follow-up
                      </Label>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Follow-up notes..."
                          value={followUpNotes}
                          onChange={(e) => setFollowUpNotes(e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Select
                            value={followUpAssignTo}
                            onValueChange={setFollowUpAssignTo}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id.toString()}
                                >
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            value={followUpDueDate}
                            onChange={(e) => setFollowUpDueDate(e.target.value)}
                            className="text-xs"
                          />
                          <Button size="sm" onClick={handleCreateFollowUp}>
                            Create
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCreateFollowUp(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat Messages */}
                  {chatLoading ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-500">Loading chat...</div>
                    </div>
                  ) : (
                    <div
                      ref={messagesContainerRef}
                      className="max-h-64 overflow-y-auto space-y-2 mb-3 border rounded-lg p-2 bg-gray-50"
                    >
                      {sortedMessages.length === 0 ? (
                        <div className="text-center py-4">
                          <div className="text-sm text-gray-500">
                            No messages yet. Start the conversation!
                          </div>
                        </div>
                      ) : (
                        sortedMessages.map((message: ChatMessage) => (
                          <div
                            key={message.id}
                            className={`p-2 rounded text-sm ${
                              message.message_type === "system"
                                ? "bg-blue-100 border-l-4 border-blue-500"
                                : message.user_id === parseInt(user?.id || "0")
                                  ? "bg-blue-500 text-white ml-8"
                                  : "bg-white border mr-8"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                {message.message_type !== "system" && (
                                  <div className="font-medium text-xs mb-1">
                                    {message.user_name}
                                  </div>
                                )}
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: processMessageContent(message.message),
                                  }}
                                />
                                {message.attachments &&
                                  message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {message.attachments.map(
                                        (attachment, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center gap-2 text-xs"
                                          >
                                            <FileText className="w-3 h-3" />
                                            <span>{attachment.name}</span>
                                            {attachment.url && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-auto p-0 text-xs"
                                                onClick={() =>
                                                  window.open(
                                                    attachment.url,
                                                    "_blank",
                                                  )
                                                }
                                              >
                                                <Download className="w-3 h-3" />
                                              </Button>
                                            )}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>
                              <div className="text-xs opacity-75 ml-2">
                                {formatToISTDateTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Staged Attachments */}
                  {stagedAttachments.length > 0 && (
                    <div className="mb-3">
                      <Label className="text-xs text-gray-600 mb-1 block">
                        Attachments ({stagedAttachments.length})
                      </Label>
                      <div className="space-y-1">
                        {stagedAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              <span>{attachment.name}</span>
                              <span className="text-gray-500">
                                ({(attachment.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeAttachment(index)}
                              className="h-auto p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="text-sm resize-none"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={
                          !newMessage.trim() && stagedAttachments.length === 0
                        }
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                  />
                </div>

                {/* Delete Step Button */}
                <div className="border-t pt-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(step.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete Step
                  </Button>
                </div>
              </>
            )}

            {/* Template Step Display */}
            {step.isTemplate && (
              <div className="text-center py-4">
                <div className="text-sm text-blue-600 mb-2">
                  📋 This is a template step
                </div>
                <div className="text-xs text-blue-500">
                  Create a VC-specific step to start tracking progress and enable
                  team collaboration.
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
