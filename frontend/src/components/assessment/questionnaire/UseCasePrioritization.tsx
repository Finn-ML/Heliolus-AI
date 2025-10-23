/**
 * Step 3: Use Case Prioritization
 * Story 1.14: Priorities Questionnaire UI
 */

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PrioritiesData } from '@/types/priorities.types';
import { GripVertical, AlertCircle } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface UseCasePrioritizationProps {
  assessmentId: string;
}

// Default use case categories for financial crime compliance
const USE_CASE_CATEGORIES = [
  {
    id: 'transaction-monitoring',
    label: 'Transaction Monitoring',
    description: 'Real-time monitoring of customer transactions for suspicious activity',
  },
  {
    id: 'kyc-onboarding',
    label: 'KYC/Customer Onboarding',
    description: 'Customer due diligence and identity verification',
  },
  {
    id: 'sanctions-screening',
    label: 'Sanctions Screening',
    description: 'Screening against global sanctions lists',
  },
  {
    id: 'fraud-detection',
    label: 'Fraud Detection & Prevention',
    description: 'Identifying and preventing fraudulent transactions',
  },
  {
    id: 'regulatory-reporting',
    label: 'Regulatory Reporting',
    description: 'SAR/STR filing and other regulatory submissions',
  },
  {
    id: 'risk-scoring',
    label: 'Customer Risk Scoring',
    description: 'Dynamic risk assessment and categorization',
  },
  {
    id: 'case-management',
    label: 'Case Management & Investigation',
    description: 'Workflow for investigating alerts and cases',
  },
  {
    id: 'adverse-media',
    label: 'Adverse Media Screening',
    description: 'Screening for negative news and reputational risks',
  },
  {
    id: 'pep-screening',
    label: 'PEP Screening',
    description: 'Politically Exposed Person identification and monitoring',
  },
  {
    id: 'trade-compliance',
    label: 'Trade-Based Money Laundering',
    description: 'Detecting trade finance related AML risks',
  },
];

interface SortableItemProps {
  id: string;
  label: string;
  rank: number;
}

function SortableItem({ id, label, rank }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 bg-gray-800 border border-gray-700 rounded-lg p-3"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-500" />
      </div>
      <Badge variant="outline" className="bg-cyan-900/30 text-cyan-400 border-cyan-600">
        #{rank}
      </Badge>
      <span className="flex-1 text-white">{label}</span>
    </div>
  );
}

export default function UseCasePrioritization({ assessmentId }: UseCasePrioritizationProps) {
  const { watch, setValue } = useFormContext<PrioritiesData>();

  const prioritizedUseCases = watch('step3.prioritizedUseCases') || [];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    prioritizedUseCases.map(uc => uc.category)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Sync selected categories with prioritized use cases
    const categories = prioritizedUseCases.map(uc => uc.category);
    setSelectedCategories(categories);
  }, [prioritizedUseCases]);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    let newSelected: string[];

    if (checked) {
      if (selectedCategories.length >= 3) {
        // Replace the last item if already at max
        newSelected = [...selectedCategories.slice(0, 2), categoryId];
      } else {
        newSelected = [...selectedCategories, categoryId];
      }
    } else {
      newSelected = selectedCategories.filter(c => c !== categoryId);
    }

    setSelectedCategories(newSelected);
    updatePrioritizedUseCases(newSelected);
  };

  const updatePrioritizedUseCases = (categories: string[]) => {
    const ranked = categories.map((category, index) => ({
      category,
      rank: index + 1,
    }));
    setValue('step3.prioritizedUseCases', ranked, { shouldValidate: true });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedCategories.indexOf(active.id as string);
      const newIndex = selectedCategories.indexOf(over.id as string);

      const newOrder = arrayMove(selectedCategories, oldIndex, newIndex);
      setSelectedCategories(newOrder);
      updatePrioritizedUseCases(newOrder);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Use Case Prioritization</h2>
        <p className="text-gray-400 text-sm">
          Select and rank your top 3 compliance use cases in order of priority.
        </p>
      </div>

      {/* Selection Grid */}
      <div className="space-y-3">
        <Label className="text-white">
          Available Use Cases <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          Select up to 3 use cases. Click and drag in the ranking area below to reorder.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {USE_CASE_CATEGORIES.map(useCase => (
            <Card
              key={useCase.id}
              className={`cursor-pointer transition-all ${
                selectedCategories.includes(useCase.id)
                  ? 'bg-cyan-900/30 border-cyan-600'
                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={useCase.id}
                    checked={selectedCategories.includes(useCase.id)}
                    onCheckedChange={checked =>
                      handleCategoryToggle(useCase.id, checked as boolean)
                    }
                    disabled={
                      !selectedCategories.includes(useCase.id) && selectedCategories.length >= 3
                    }
                    className="mt-1 border-gray-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                  <label htmlFor={useCase.id} className="flex-1 cursor-pointer">
                    <h3 className="font-medium text-white">{useCase.label}</h3>
                    <p className="text-sm text-gray-400 mt-1">{useCase.description}</p>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ranking Area */}
      {selectedCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white">Priority Ranking ({selectedCategories.length}/3)</Label>
            {selectedCategories.length < 3 && (
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Select {3 - selectedCategories.length} more use case(s)
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Drag to reorder your priorities. #1 is your highest priority.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={selectedCategories} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {selectedCategories.map((categoryId, index) => {
                  const category = USE_CASE_CATEGORIES.find(uc => uc.id === categoryId);
                  return category ? (
                    <SortableItem
                      key={categoryId}
                      id={categoryId}
                      label={category.label}
                      rank={index + 1}
                    />
                  ) : null;
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {selectedCategories.length === 0 && (
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
          <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">Select at least 3 use cases above to begin ranking</p>
        </div>
      )}
    </div>
  );
}
