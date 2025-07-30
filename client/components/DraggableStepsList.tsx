import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { EnhancedStepItem } from "./EnhancedStepItem";
import { useReorderLeadSteps, useUpdateLeadStep } from "@/hooks/useApi";

interface DraggableStepsListProps {
  leadId: number;
  steps: any[];
  expandedSteps: Set<number>;
  onToggleExpansion: (stepId: number) => void;
  onUpdateStatus: (stepId: number, status: string) => void;
  onDeleteStep: (stepId: number) => void;
  onReorderSteps: (steps: any[]) => void;
}

export function DraggableStepsList({
  leadId,
  steps,
  expandedSteps,
  onToggleExpansion,
  onUpdateStatus,
  onDeleteStep,
  onReorderSteps,
}: DraggableStepsListProps) {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [items, setItems] = useState(steps);
  const reorderMutation = useReorderLeadSteps();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    setItems(steps);
  }, [steps]);

  function handleDragStart(event: any) {
    const { active } = event;
    setActiveId(active.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Update step orders
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        step_order: index + 1,
      }));

      setItems(updatedItems);
      onReorderSteps(updatedItems);

      // Call API to persist the new order
      const stepOrders = updatedItems.map((item, index) => ({
        id: item.id,
        order: index + 1,
      }));

      reorderMutation.mutate({ leadId, stepOrders });
    }

    setActiveId(null);
  }

  const activeStep = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((step) => (
            <EnhancedStepItem
              key={step.id}
              step={step}
              isExpanded={expandedSteps.has(step.id)}
              onToggleExpansion={() => onToggleExpansion(step.id)}
              onUpdateStatus={onUpdateStatus}
              onDeleteStep={onDeleteStep}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeStep ? (
          <EnhancedStepItem
            step={activeStep}
            isExpanded={expandedSteps.has(activeStep.id)}
            onToggleExpansion={() => {}}
            onUpdateStatus={() => {}}
            onDeleteStep={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
