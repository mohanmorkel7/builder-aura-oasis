import React, { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Reply,
  Paperclip,
  Bold,
  Italic,
  Link,
  AlignLeft,
  List,
  Image,
  Eye,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useStepChats, useCreateStepChat } from "@/hooks/useApi";

interface EnhancedStepItemProps {
  step: any;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdateStatus: (stepId: number, status: string) => void;
  onDeleteStep: (stepId: number) => void;
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



export function EnhancedStepItem({
  step,
  isExpanded,
  onToggleExpansion,
  onUpdateStatus,
  onDeleteStep,
  isDragOverlay = false,
}: EnhancedStepItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Fetch real chat data from API
  const { data: chatMessages = [], isLoading: chatLoading, error: chatError } = useStepChats(step.id);
  const createChatMutation = useCreateStepChat();

  // Debug logging
  React.useEffect(() => {
    if (chatError) {
      console.error("Chat loading error for step", step.id, ":", chatError);
    }
  }, [chatError, step.id]);



  const [newMessage, setNewMessage] = useState("");

  // Don't render if step is invalid
  if (!step || !step.id) {
    return null;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    // Create a chat message with file attachments and current text
    const attachments = Array.from(files).map(file => ({
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
    }));

    const fileNames = Array.from(files).map(f => f.name).join(', ');
    const currentText = newMessage.trim();
    const messageText = currentText
      ? `${currentText}\n\n📎 Attached: ${fileNames}`
      : `📎 Uploaded ${files.length} file${files.length > 1 ? 's' : ''}: ${fileNames}`;

    const chatData = {
      user_id: parseInt(user.id),
      user_name: `${user.first_name} ${user.last_name}`,
      message: messageText,
      message_type: "text" as const,
      is_rich_text: !!currentText, // Use rich text if there was existing text
      attachments,
    };

    try {
      await createChatMutation.mutateAsync({ stepId: step.id, chatData });
      setNewMessage(""); // Clear the message input after successful upload
      event.target.value = "";
    } catch (error) {
      console.error("Failed to upload files:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const chatData = {
      user_id: parseInt(user.id),
      user_name: `${user.first_name} ${user.last_name}`,
      message: newMessage,
      message_type: "text" as const,
      is_rich_text: true,
    };

    try {
      await createChatMutation.mutateAsync({ stepId: step.id, chatData });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFollowUp = async (messageId: number) => {
    if (!user) return;

    try {
      // Create a system message indicating follow-up was created
      const followUpData = {
        user_id: parseInt(user.id),
        user_name: `${user.first_name} ${user.last_name}`,
        message: `📋 Follow-up created for message #${messageId} | Assigned to: ${user.first_name} ${user.last_name} | Time: ${new Date().toLocaleString()}`,
        message_type: "system" as const,
        is_rich_text: false,
      };

      await createChatMutation.mutateAsync({ stepId: step.id, chatData: followUpData });

      // Navigate to follow-up screen with message and step context
      navigate(`/follow-up`, {
        state: {
          messageId,
          stepId: step.id,
          stepName: step.name,
          fromChat: true
        }
      });
    } catch (error) {
      console.error("Failed to create follow-up notification:", error);
      // Still navigate even if notification fails
      navigate(`/follow-up`, {
        state: {
          messageId,
          stepId: step.id,
          stepName: step.name,
          fromChat: true
        }
      });
    }
  };



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white ${isDragOverlay ? 'shadow-2xl' : ''}`}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpansion}>
        <div className="flex items-center space-x-4 p-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Status Icon */}
          <div className="flex-shrink-0">
            {step.status === "completed" ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : step.status === "in_progress" ? (
              <Clock className="w-6 h-6 text-blue-600" />
            ) : (
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
            )}
          </div>

          <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {step.name}
                </span>
                <div className="flex items-center space-x-2">
                  {!chatLoading && chatMessages.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {step.description}
              </div>
              <div className="text-sm text-gray-600">
                {step.status === "completed" &&
                  step.completed_date &&
                  `Completed on ${new Date(step.completed_date).toLocaleDateString()}`}
                {step.status !== "completed" &&
                  step.due_date &&
                  `Due: ${new Date(step.due_date).toLocaleDateString()}`}
              </div>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </CollapsibleTrigger>

          <div className="flex items-center space-x-2">
            <Select
              value={step.status}
              onValueChange={(value) => onUpdateStatus(step.id, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteStep(step.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t bg-gray-50">
            <div className="p-4">
              {/* Chat Section */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Team Chat</CardTitle>
                  <CardDescription>
                    Communicate with your team about this step
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Chat Messages */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex space-x-3 p-3 rounded border ${
                          message.message_type === 'system'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          message.message_type === 'system'
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}>
                          {message.message_type === 'system' ? '🔔' : message.user_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {message.user_name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleString()}
                              </span>
                              {message.message_type !== 'system' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFollowUp(message.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Reply className="w-3 h-3 mr-1" />
                                  Follow-up
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-700">
                            {message.is_rich_text ? (
                              <div dangerouslySetInnerHTML={{ __html: message.message }} />
                            ) : (
                              <p>{message.message}</p>
                            )}
                          </div>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center space-x-2 text-xs">
                                  <Paperclip className="w-3 h-3 text-blue-600" />
                                  <span
                                    className="text-blue-600 hover:text-blue-800 cursor-pointer underline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = `/uploads/${attachment.file_name}`;
                                      link.download = attachment.file_name;
                                      link.target = '_blank';
                                      link.click();
                                    }}
                                  >
                                    {attachment.file_name}
                                  </span>
                                  <span className="text-gray-500">({formatFileSize(attachment.file_size)})</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-auto p-1"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = `/uploads/${attachment.file_name}`;
                                      link.download = attachment.file_name;
                                      link.target = '_blank';
                                      link.click();
                                    }}
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No messages yet. Start the conversation!
                      </p>
                    )}
                  </div>

                  {/* Rich Text Editor */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">Rich Text Editor</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          multiple
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          title="Upload documents"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <RichTextEditor
                        value={newMessage}
                        onChange={setNewMessage}
                        placeholder="Type your message with rich formatting..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
