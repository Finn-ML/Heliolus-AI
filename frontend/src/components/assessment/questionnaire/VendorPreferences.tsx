/**
 * Step 5: Vendor Preferences
 * Story 1.14: Priorities Questionnaire UI
 */

import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import type { PrioritiesData } from '@/types/priorities.types';
import {
  VENDOR_MATURITY_OPTIONS,
  GEOGRAPHIC_REQUIREMENTS,
  SUPPORT_MODELS,
} from '@/types/priorities.types';
import { Check } from 'lucide-react';

export default function VendorPreferences() {
  const { control } = useFormContext<PrioritiesData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Vendor Preferences</h2>
        <p className="text-gray-400 text-sm">
          Tell us about your preferences for vendor characteristics and support requirements.
        </p>
      </div>

      {/* Vendor Maturity */}
      <div className="space-y-3">
        <Label className="text-white">
          Vendor Maturity Preference <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          What type of vendor are you most comfortable working with?
        </p>
        <Controller
          name="step5.vendorMaturity"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <RadioGroup onValueChange={field.onChange} value={field.value}>
                <div className="space-y-3">
                  {VENDOR_MATURITY_OPTIONS.map(option => (
                    <Card
                      key={option.value}
                      className={`cursor-pointer transition-all ${
                        field.value === option.value
                          ? 'bg-cyan-900/30 border-cyan-600'
                          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={option.value}
                            id={`maturity-${option.value}`}
                            className="mt-1 border-gray-600 text-cyan-600"
                          />
                          <label
                            htmlFor={`maturity-${option.value}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white">{option.label}</h3>
                              {field.value === option.value && (
                                <Check className="h-4 w-4 text-cyan-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{option.description}</p>
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

      {/* Geographic Requirements */}
      <div className="space-y-3">
        <Label className="text-white">
          Geographic Coverage Requirements <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          What level of geographic presence do you need from your vendor?
        </p>
        <Controller
          name="step5.geographicRequirements"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <RadioGroup onValueChange={field.onChange} value={field.value}>
                <div className="space-y-3">
                  {GEOGRAPHIC_REQUIREMENTS.map(option => (
                    <Card
                      key={option.value}
                      className={`cursor-pointer transition-all ${
                        field.value === option.value
                          ? 'bg-cyan-900/30 border-cyan-600'
                          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={option.value}
                            id={`geo-${option.value}`}
                            className="mt-1 border-gray-600 text-cyan-600"
                          />
                          <label htmlFor={`geo-${option.value}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white">{option.label}</h3>
                              {field.value === option.value && (
                                <Check className="h-4 w-4 text-cyan-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{option.description}</p>
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

      {/* Support Model */}
      <div className="space-y-3">
        <Label className="text-white">
          Support Model Preference <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">What level of vendor support do you require?</p>
        <Controller
          name="step5.supportModel"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <RadioGroup onValueChange={field.onChange} value={field.value}>
                <div className="space-y-3">
                  {SUPPORT_MODELS.map(option => (
                    <Card
                      key={option.value}
                      className={`cursor-pointer transition-all ${
                        field.value === option.value
                          ? 'bg-cyan-900/30 border-cyan-600'
                          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={option.value}
                            id={`support-${option.value}`}
                            className="mt-1 border-gray-600 text-cyan-600"
                          />
                          <label
                            htmlFor={`support-${option.value}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white">{option.label}</h3>
                              {field.value === option.value && (
                                <Check className="h-4 w-4 text-cyan-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{option.description}</p>
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
    </div>
  );
}
