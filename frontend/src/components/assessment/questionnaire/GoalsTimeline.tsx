/**
 * Step 2: Goals and Timeline
 * Story 1.14: Priorities Questionnaire UI
 */

import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import type { PrioritiesData } from '@/types/priorities.types';
import { PRIMARY_GOALS, IMPLEMENTATION_URGENCY_LABELS } from '@/types/priorities.types';
import { Check } from 'lucide-react';

export default function GoalsTimeline() {
  const { control, watch } = useFormContext<PrioritiesData>();

  const urgency = watch('step2.implementationUrgency') || 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Goals & Timeline</h2>
        <p className="text-gray-400 text-sm">
          Help us understand your primary objectives and timeline for implementation.
        </p>
      </div>

      {/* Primary Goal */}
      <div className="space-y-3">
        <Label className="text-white">
          Primary Goal <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          What is your most important objective for this compliance initiative?
        </p>
        <Controller
          name="step2.primaryGoal"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <RadioGroup onValueChange={field.onChange} value={field.value}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PRIMARY_GOALS.map(goal => (
                    <Card
                      key={goal.value}
                      className={`cursor-pointer transition-all ${
                        field.value === goal.value
                          ? 'bg-cyan-900/30 border-cyan-600'
                          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={goal.value}
                            id={goal.value}
                            className="mt-1 border-gray-600 text-cyan-600"
                          />
                          <label htmlFor={goal.value} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white">{goal.label}</h3>
                              {field.value === goal.value && (
                                <Check className="h-4 w-4 text-cyan-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{goal.description}</p>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
              {fieldState.error && (
                <p className="text-sm text-red-500">{fieldState.error.message}</p>
              )}
            </>
          )}
        />
      </div>

      {/* Implementation Urgency */}
      <div className="space-y-4">
        <Label className="text-white">
          Implementation Urgency <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          What is your desired timeline for implementing a solution?
        </p>
        <Controller
          name="step2.implementationUrgency"
          control={control}
          render={({ field }) => (
            <div className="space-y-4">
              <Slider
                min={1}
                max={4}
                step={1}
                value={[field.value || 2]}
                onValueChange={value => field.onChange(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                {IMPLEMENTATION_URGENCY_LABELS.map((label, index) => (
                  <div
                    key={index}
                    className={`flex-1 text-center ${
                      urgency === index + 1 ? 'text-cyan-400 font-medium' : ''
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="text-center mt-2">
                <div className="inline-block px-4 py-2 bg-cyan-900/30 border border-cyan-600 rounded-lg">
                  <p className="text-sm text-cyan-400 font-medium">
                    Selected: {IMPLEMENTATION_URGENCY_LABELS[urgency - 1]}
                  </p>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
