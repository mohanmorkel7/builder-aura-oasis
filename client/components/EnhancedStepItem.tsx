import React, { useState, useRef, useEffect } from "react";
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
  X,
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
import { apiClient } from "@/lib/api";
import { formatToISTDateTime } from "@/lib/dateUtils";

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
  const {
    data: chatMessages = [],
    isLoading: chatLoading,
    error: chatError,
  } = useStepChats(step.id);
  const createChatMutation = useCreateStepChat();

  // Sort messages by created_at in ascending order (latest last for bottom scroll)
  const sortedMessages = React.useMemo(() => {
    return [...chatMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [chatMessages]);

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
      console.error("Chat loading error for step", step.id, ":", chatError);
    }
  }, [chatError, step.id]);

  const [newMessage, setNewMessage] = useState("");
  const [stagedAttachments, setStagedAttachments] = useState<any[]>([]);

  // Function to highlight mentions and make follow-up IDs clickable
  const processMessageContent = (messageText: string) => {
    if (!user) return messageText;

    let processedText = messageText;

    // Look for mentions of current user (case insensitive)
    const userNamePattern = new RegExp(`@${user.name}`, "gi");
    processedText = processedText.replace(
      userNamePattern,
      `<span class="bg-red-100 text-red-700 px-1 rounded font-medium">@${user.name}</span>`,
    );

    // Make follow-up IDs clickable (#13, #14, etc.)
    const followUpPattern = /#(\d+)/g;
    processedText = processedText.replace(
      followUpPattern,
      `<span class="follow-up-link bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium cursor-pointer hover:bg-blue-200"
        data-follow-up-id="$1"
        onclick="window.location.href='/follow-ups?id=$1'"
      >#$1</span>`,
    );

    return processedText;
  };

  // Don't render if step is invalid
  if (!step || !step.id) {
    return null;
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    try {
      // First, upload the actual files to the server
      console.log("Uploading files to server...");
      const uploadResult = await apiClient.uploadFiles(files);

      if (!uploadResult.success) {
        throw new Error("File upload failed");
      }

      console.log("Files uploaded successfully:", uploadResult.files);

      // Create attachments array with the uploaded file information
      const newAttachments = uploadResult.files.map((file: any) => ({
        file_name: file.originalName,
        file_path: file.path,
        file_size: file.size,
        file_type: file.mimetype,
        server_filename: file.filename,
      }));

      // Stage the attachments instead of immediately sending
      setStagedAttachments((prev) => [...prev, ...newAttachments]);
      event.target.value = "";

      console.log("Files staged for sending:", newAttachments);
    } catch (error) {
      console.error("Failed to upload files:", error);
      alert("Failed to upload files. Please try again.");
    }
  };

  const removeStagedAttachment = (index: number) => {
    setStagedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && stagedAttachments.length === 0) || !user) return;

    const messageText = newMessage.trim() || "📎 File attachment";

    const chatData = {
      user_id: parseInt(user.id),
      user_name: user.name,
      message: messageText,
      message_type: "text" as const,
      is_rich_text: true,
      attachments: stagedAttachments.length > 0 ? stagedAttachments : undefined,
    };

    try {
      await createChatMutation.mutateAsync({ stepId: step.id, chatData });
      setNewMessage("");
      setStagedAttachments([]);
      // Scroll to bottom after sending message (small delay to ensure DOM update)
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFollowUp = async (messageId: number) => {
    if (!user) return;

    // Navigate to follow-up screen with message and step context
    // The system message will be created after the follow-up is saved with assignment info
    navigate(`/follow-up`, {
      state: {
        messageId,
        stepId: step.id,
        leadId: step.lead_id,
        stepName: step.name,
        fromChat: true,
        createSystemMessage: true, // Flag to indicate system message should be created
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white ${isDragOverlay ? "shadow-2xl" : ""}`}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpansion}>
        <div className="flex items-center space-x-4 p-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            style={step.isTemplate ? { pointerEvents: 'none', opacity: 0.5 } : {}}
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
                <span
                  className={`font-medium ${step.isTemplate ? "text-blue-900" : "text-gray-900"}`}
                >
                  {step.name}
                </span>
                <div className="flex items-center space-x-2">
                  {step.isTemplate && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-100 text-blue-700 border-blue-300"
                    >
                      Template Step
                    </Badge>
                  )}
                  {step.probability_percent && (
                    <Badge variant="outline" className="text-xs">
                      {step.probability_percent}% weight
                    </Badge>
                  )}
                  {!step.isTemplate &&
                    !chatLoading &&
                    sortedMessages.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {sortedMessages.length} message
                        {sortedMessages.length !== 1 ? "s" : ""}
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
                  `Completed on ${new Date(step.completed_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}
                {step.status !== "completed" &&
                  step.due_date &&
                  `Due: ${new Date(step.due_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}
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
              onValueChange={
                step.isTemplate
                  ? undefined
                  : (value) => onUpdateStatus(step.id, value)
              }
              disabled={step.isTemplate}
            >
              <SelectTrigger
                className={`w-32 ${step.isTemplate ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {!step.isTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteStep(step.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t bg-gray-50">
            <div className="p-4">
              {step.isTemplate ? (
                /* Template Step Info */
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4 rounded-t-lg">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Template Step Details
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      This is a predefined step from a template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-700">
                      <strong>Description:</strong> {step.description}
                    </div>
                    {step.estimated_days && (
                      <div className="text-sm text-gray-700">
                        <strong>Estimated Duration:</strong>{" "}
                        {step.estimated_days} days
                      </div>
                    )}
                    {step.probability_percent && (
                      <div className="text-sm text-gray-700">
                        <strong>Success Weight:</strong>{" "}
                        {step.probability_percent}%
                      </div>
                    )}
                    <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
                      📋 This is a template step for reference. Create custom
                      lead-specific steps to track actual progress.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Regular Step with Chat */
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Team Chat
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          Real-time collaboration for this step
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-1">
                        {sortedMessages.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {sortedMessages.length} messages
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Chat Messages */}
                    <div
                      ref={messagesContainerRef}
                      className="space-y-3 max-h-96 overflow-y-auto"
                    >
                      {chatLoading && (
                        <div className="text-center py-4 text-gray-500">
                          Loading messages...
                        </div>
                      )}
                      {chatError && (
                        <div className="text-center py-4 text-red-500">
                          Error loading messages: {chatError.message}
                        </div>
                      )}
                      {!chatLoading &&
                        !chatError &&
                        sortedMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex space-x-3 p-3 rounded border ${
                              message.message_type === "system"
                                ? "bg-blue-50 border-blue-200"
                                : message.user_id === parseInt(user.id)
                                  ? "bg-green-50 border-green-200"
                                  : "bg-white"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                message.message_type === "system"
                                  ? "bg-orange-500"
                                  : "bg-blue-500"
                              }`}
                            >
                              {message.message_type === "system"
                                ? "���"
                                : message.user_name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {message.user_id === parseInt(user.id)
                                    ? "Me"
                                    : message.user_name}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {formatToISTDateTime(message.created_at)}
                                  </span>
                                  {message.message_type !== "system" && (
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
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: processMessageContent(
                                        message.message,
                                      ),
                                    }}
                                  />
                                ) : (
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: processMessageContent(
                                        message.message,
                                      ),
                                    }}
                                  />
                                )}
                              </div>
                              {message.attachments &&
                                message.attachments.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {message.attachments.map(
                                      (attachment, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg border"
                                        >
                                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Paperclip className="w-4 h-4 text-blue-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              {attachment.file_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {formatFileSize(
                                                attachment.file_size,
                                              )}
                                            </p>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-3 text-xs"
                                            onClick={async () => {
                                              try {
                                                const fileToDownload =
                                                  attachment.server_filename ||
                                                  attachment.file_name;
                                                console.log(
                                                  `Attempting to download: ${fileToDownload}`,
                                                );

                                                // First try the API endpoint
                                                const response = await fetch(
                                                  `/api/files/download/${fileToDownload}`,
                                                );

                                                if (response.ok) {
                                                  const blob =
                                                    await response.blob();
                                                  const url =
                                                    window.URL.createObjectURL(
                                                      blob,
                                                    );
                                                  const link =
                                                    document.createElement("a");
                                                  link.href = url;
                                                  link.download =
                                                    attachment.file_name; // Use original name for download
                                                  document.body.appendChild(
                                                    link,
                                                  );
                                                  link.click();
                                                  document.body.removeChild(
                                                    link,
                                                  );
                                                  window.URL.revokeObjectURL(
                                                    url,
                                                  );
                                                  console.log(
                                                    `Successfully downloaded: ${attachment.file_name}`,
                                                  );
                                                  return;
                                                }

                                                // If API fails, try direct file access
                                                console.log(
                                                  `API download failed (${response.status}), trying direct access...`,
                                                );

                                                const directResponse =
                                                  await fetch(
                                                    `/uploads/${fileToDownload}`,
                                                  );
                                                if (directResponse.ok) {
                                                  const blob =
                                                    await directResponse.blob();
                                                  const url =
                                                    window.URL.createObjectURL(
                                                      blob,
                                                    );
                                                  const link =
                                                    document.createElement("a");
                                                  link.href = url;
                                                  link.download =
                                                    attachment.file_name; // Use original name for download
                                                  document.body.appendChild(
                                                    link,
                                                  );
                                                  link.click();
                                                  document.body.removeChild(
                                                    link,
                                                  );
                                                  window.URL.revokeObjectURL(
                                                    url,
                                                  );
                                                  console.log(
                                                    `Successfully downloaded via direct access: ${attachment.file_name}`,
                                                  );
                                                  return;
                                                }

                                                // If both fail, show user-friendly error
                                                throw new Error(
                                                  `File '${attachment.file_name}' not found on server`,
                                                );
                                              } catch (error) {
                                                console.error(
                                                  "Download failed:",
                                                  error,
                                                );

                                                // Show user-friendly error message
                                                alert(
                                                  `Download failed: ${error.message || "File not found"}\n\nThe file may have been moved or deleted.`,
                                                );

                                                // As a last resort, try to open the file in a new tab
                                                const fallbackLink =
                                                  document.createElement("a");
                                                fallbackLink.href = `/uploads/${fileToDownload}`;
                                                fallbackLink.target = "_blank";
                                                fallbackLink.click();
                                              }
                                            }}
                                          >
                                            <Download className="w-3 h-3 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      {!chatLoading &&
                        !chatError &&
                        sortedMessages.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-8">
                            No messages yet. Start the conversation!
                          </p>
                        )}
                    </div>

                    {/* Rich Text Editor */}
                    <div className="border-t bg-white p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700 font-medium">
                            💬 Compose Message
                          </span>
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
                            className="h-8 px-3 text-xs"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Attach
                          </Button>
                        </div>
                      </div>

                      {/* Staged Attachments Display */}
                      {stagedAttachments.length > 0 && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-2">
                            Files ready to send:
                          </div>
                          <div className="space-y-2">
                            {stagedAttachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-white border rounded"
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                    📎
                                  </div>
                                  <span className="text-sm text-gray-700">
                                    {attachment.file_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({Math.round(attachment.file_size / 1024)}{" "}
                                    KB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStagedAttachment(index)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <RichTextEditor
                          value={newMessage}
                          onChange={setNewMessage}
                          placeholder="Type your message with rich formatting..."
                          className="min-h-[80px] border-gray-200"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          Press Ctrl+Enter to send
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={
                            !newMessage.trim() && stagedAttachments.length === 0
                          }
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
