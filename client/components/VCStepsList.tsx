import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  Play,
  Trash2,
  Calendar,
  User,
} from "lucide-react";
import { formatToISTDateTime } from "@/lib/dateUtils";

interface VCStepsListProps {
  vcId: number;
  steps: any[];
  expandedSteps?: Set<number>;
  onToggleExpansion: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onUpdateStep: (stepId: number, stepData: any) => void;
}

const stepStatusColors = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const stepStatusIcons = {
  pending: Clock,
  in_progress: Play,
  completed: CheckCircle,
};

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export function VCStepsList({
  vcId,
  steps,
  expandedSteps = new Set(),
  onToggleExpansion,
  onDeleteStep,
  onUpdateStep,
}: VCStepsListProps) {
  const [updatingSteps, setUpdatingSteps] = useState<Set<number>>(new Set());

  const handleStatusChange = async (stepId: number, newStatus: string) => {
    setUpdatingSteps((prev) => new Set([...prev, stepId]));
    try {
      await onUpdateStep(stepId, { status: newStatus });
    } finally {
      setUpdatingSteps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  if (steps.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No funding steps yet</p>
        <p className="text-sm">Add your first step to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const StatusIcon =
          stepStatusIcons[step.status as keyof typeof stepStatusIcons] || Clock;
        const isExpanded = expandedSteps.has(step.id);
        const isUpdating = updatingSteps.has(step.id);

        return (
          <Card key={step.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500 min-w-[2rem]">
                      {index + 1}.
                    </span>
                    <StatusIcon className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{step.name}</h4>
                    {step.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={
                        stepStatusColors[
                          step.status as keyof typeof stepStatusColors
                        ]
                      }
                    >
                      {step.status.replace("_", " ").toUpperCase()}
                    </Badge>

                    {step.priority && (
                      <Badge
                        variant="outline"
                        className={
                          priorityColors[
                            step.priority as keyof typeof priorityColors
                          ]
                        }
                      >
                        {step.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpansion(step.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <Select
                        value={step.status}
                        onValueChange={(value) =>
                          handleStatusChange(step.id, value)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteStep(step.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {step.due_date && (
                    <div className="flex items-center space-x-2 mt-3 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Due: {new Date(step.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {step.assigned_to && (
                    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Assigned to: User {step.assigned_to}</span>
                    </div>
                  )}

                  {step.created_at && (
                    <div className="text-xs text-gray-500 mt-3">
                      Created: {formatToISTDateTime(step.created_at)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
