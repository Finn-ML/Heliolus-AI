/**
 * Step 6: Decision Factor Ranking
 * Story 1.14: Priorities Questionnaire UI
 */

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import type { PrioritiesData } from '@/types/priorities.types';
import { DECISION_FACTORS } from '@/types/priorities.types';
import { GripVertical, Medal } from 'lucide-react';
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

interface SortableFactorProps {
  id: string;
  factor: string;
  description: string;
  rank: number;
}

function SortableFactor({ id, factor, description, rank }: SortableFactorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-900/30 text-yellow-400 border-yellow-600';
    if (rank === 2) return 'bg-gray-600/30 text-gray-300 border-gray-500';
    if (rank === 3) return 'bg-orange-900/30 text-orange-400 border-orange-600';
    return 'bg-cyan-900/30 text-cyan-400 border-cyan-600';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start space-x-3 rounded-lg p-4 border transition-all ${
        rank <= 3 ? 'bg-gray-800 border-gray-600' : 'bg-gray-800/70 border-gray-700'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
        <GripVertical className="h-5 w-5 text-gray-500" />
      </div>
      <div className="flex items-center space-x-3 flex-1">
        <div className={`px-3 py-1 rounded-full border font-medium text-sm ${getRankColor(rank)}`}>
          #{rank}
        </div>
        {rank <= 3 && <Medal className="h-5 w-5 text-yellow-500" />}
        <div className="flex-1">
          <h3 className="font-medium text-white">{factor}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function DecisionFactorRanking() {
  const { watch, setValue } = useFormContext<PrioritiesData>();

  const decisionFactorRanking = watch('step6.decisionFactorRanking') || [];
  const [orderedFactors, setOrderedFactors] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize with default order if not set
  useEffect(() => {
    if (decisionFactorRanking.length === 0) {
      const defaultOrder = DECISION_FACTORS.map(f => f.id);
      setOrderedFactors(defaultOrder);
      updateRanking(defaultOrder);
    } else {
      const factorIds = decisionFactorRanking
        .sort((a, b) => a.rank - b.rank)
        .map(item => item.factor);
      setOrderedFactors(factorIds);
    }
  }, []);

  const updateRanking = (factorIds: string[]) => {
    const ranked = factorIds.map((factorId, index) => ({
      factor: factorId,
      rank: index + 1,
    }));
    setValue('step6.decisionFactorRanking', ranked, { shouldValidate: true });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedFactors.indexOf(active.id as string);
      const newIndex = orderedFactors.indexOf(over.id as string);

      const newOrder = arrayMove(orderedFactors, oldIndex, newIndex);
      setOrderedFactors(newOrder);
      updateRanking(newOrder);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Decision Factor Ranking</h2>
        <p className="text-gray-400 text-sm">
          Rank the following factors in order of importance for your vendor selection decision. Drag
          and drop to reorder.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-white">
          Rank Your Decision Factors <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          #1 is the most important factor. Drag factors to reorder them.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedFactors} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {orderedFactors.map((factorId, index) => {
                const factor = DECISION_FACTORS.find(f => f.id === factorId);
                return factor ? (
                  <SortableFactor
                    key={factorId}
                    id={factorId}
                    factor={factor.factor}
                    description={factor.description}
                    rank={index + 1}
                  />
                ) : null;
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="bg-cyan-900/20 border border-cyan-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">Why This Matters</h4>
        <p className="text-sm text-gray-300">
          Your ranking will help us prioritize vendor recommendations and highlight the solutions
          that best align with your decision-making criteria. The top 3 factors will have the
          greatest influence on our recommendations.
        </p>
      </div>
    </div>
  );
}
