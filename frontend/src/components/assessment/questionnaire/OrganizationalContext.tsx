/**
 * Step 1: Organizational Context
 * Story 1.14: Priorities Questionnaire UI
 */

import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { PrioritiesData } from '@/types/priorities.types';
import {
  JURISDICTIONS,
  EXISTING_SYSTEMS,
} from '@/types/priorities.types';

export default function OrganizationalContext() {
  const { control, watch, setValue } = useFormContext<PrioritiesData>();

  const jurisdictions = watch('step1.jurisdictions') || [];
  const existingSystems = watch('step1.existingSystems') || [];

  const handleJurisdictionToggle = (value: string, checked: boolean) => {
    if (checked) {
      setValue('step1.jurisdictions', [...jurisdictions, value], { shouldValidate: true });
    } else {
      setValue(
        'step1.jurisdictions',
        jurisdictions.filter(j => j !== value),
        { shouldValidate: true }
      );
    }
  };

  const handleSystemToggle = (value: string, checked: boolean) => {
    if (checked) {
      setValue('step1.existingSystems', [...existingSystems, value], { shouldValidate: true });
    } else {
      setValue(
        'step1.existingSystems',
        existingSystems.filter(s => s !== value),
        { shouldValidate: true }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Organizational Context</h2>
        <p className="text-gray-400 text-sm">
          Tell us about your compliance needs and infrastructure to help us recommend the best
          solutions.
        </p>
      </div>

      {/* Jurisdictions */}
      <div className="space-y-3">
        <Label className="text-white">
          Operating Jurisdictions <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          Select all jurisdictions where you operate or are regulated
        </p>
        <div className="grid grid-cols-2 gap-3">
          {JURISDICTIONS.map(jurisdiction => (
            <div key={jurisdiction.value} className="flex items-center space-x-2">
              <Checkbox
                id={`jurisdiction-${jurisdiction.value}`}
                checked={jurisdictions.includes(jurisdiction.value)}
                onCheckedChange={checked =>
                  handleJurisdictionToggle(jurisdiction.value, checked as boolean)
                }
                className="border-gray-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
              />
              <label
                htmlFor={`jurisdiction-${jurisdiction.value}`}
                className="text-sm text-gray-300 cursor-pointer"
              >
                {jurisdiction.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Systems */}
      <div className="space-y-3">
        <Label className="text-white">
          Existing Compliance Systems <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">Select all compliance systems you currently use</p>
        <div className="grid grid-cols-2 gap-3">
          {EXISTING_SYSTEMS.map(system => (
            <div key={system.value} className="flex items-center space-x-2">
              <Checkbox
                id={`system-${system.value}`}
                checked={existingSystems.includes(system.value)}
                onCheckedChange={checked => handleSystemToggle(system.value, checked as boolean)}
                className="border-gray-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
              />
              <label
                htmlFor={`system-${system.value}`}
                className="text-sm text-gray-300 cursor-pointer"
              >
                {system.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
