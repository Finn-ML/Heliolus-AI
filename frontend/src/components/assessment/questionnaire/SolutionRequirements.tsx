/**
 * Step 4: Solution Requirements
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PrioritiesData } from '@/types/priorities.types';
import {
  BUDGET_RANGES,
  DEPLOYMENT_PREFERENCES,
  MUST_HAVE_FEATURES,
} from '@/types/priorities.types';
import { Check, AlertCircle } from 'lucide-react';

// Common integration systems for financial crime compliance
const CRITICAL_INTEGRATIONS = [
  { value: 'CORE_BANKING', label: 'Core Banking System' },
  { value: 'CRM', label: 'CRM (Salesforce, etc.)' },
  { value: 'ERP', label: 'ERP (SAP, Oracle, etc.)' },
  { value: 'PAYMENT_GATEWAY', label: 'Payment Gateway' },
  { value: 'DATA_WAREHOUSE', label: 'Data Warehouse / Analytics' },
  { value: 'IDENTITY_PROVIDER', label: 'Identity Provider (SSO)' },
  { value: 'RISK_PLATFORM', label: 'Risk Management Platform' },
  { value: 'SCREENING_SERVICE', label: 'Third-party Screening Service' },
  { value: 'DOCUMENT_MANAGEMENT', label: 'Document Management System' },
  { value: 'WORKFLOW_ENGINE', label: 'Workflow/BPM Engine' },
];

export default function SolutionRequirements() {
  const { control, watch, setValue } = useFormContext<PrioritiesData>();

  const mustHaveFeatures = watch('step4.mustHaveFeatures') || [];
  const criticalIntegrations = watch('step4.criticalIntegrations') || [];

  const handleFeatureToggle = (value: string, checked: boolean) => {
    if (checked) {
      if (mustHaveFeatures.length < 5) {
        setValue('step4.mustHaveFeatures', [...mustHaveFeatures, value], { shouldValidate: true });
      }
    } else {
      setValue(
        'step4.mustHaveFeatures',
        mustHaveFeatures.filter(f => f !== value),
        { shouldValidate: true }
      );
    }
  };

  const handleIntegrationToggle = (value: string, checked: boolean) => {
    if (checked) {
      setValue('step4.criticalIntegrations', [...criticalIntegrations, value], {
        shouldValidate: true,
      });
    } else {
      setValue(
        'step4.criticalIntegrations',
        criticalIntegrations.filter(i => i !== value),
        { shouldValidate: true }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Solution Requirements</h2>
        <p className="text-gray-400 text-sm">
          Define your budget, deployment preferences, and critical technical requirements.
        </p>
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <Label htmlFor="budgetRange" className="text-white">
          Annual Budget Range <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          What is your estimated annual budget for this compliance solution?
        </p>
        <Controller
          name="step4.budgetRange"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select budget range..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {BUDGET_RANGES.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-gray-700"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <p className="text-sm text-red-500">{fieldState.error.message}</p>
              )}
            </>
          )}
        />
      </div>

      {/* Deployment Preference */}
      <div className="space-y-3">
        <Label className="text-white">
          Deployment Preference <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-400">
          How would you prefer to deploy the compliance solution?
        </p>
        <Controller
          name="step4.deploymentPreference"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <RadioGroup onValueChange={field.onChange} value={field.value}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DEPLOYMENT_PREFERENCES.map(deployment => (
                    <Card
                      key={deployment.value}
                      className={`cursor-pointer transition-all ${
                        field.value === deployment.value
                          ? 'bg-cyan-900/30 border-cyan-600'
                          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={deployment.value}
                            id={deployment.value}
                            className="mt-1 border-gray-600 text-cyan-600"
                          />
                          <label htmlFor={deployment.value} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white">{deployment.label}</h3>
                              {field.value === deployment.value && (
                                <Check className="h-4 w-4 text-cyan-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{deployment.description}</p>
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

      {/* Must-Have Features */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-white">Must-Have Features</Label>
          <Badge
            variant="outline"
            className={
              mustHaveFeatures.length === 5
                ? 'bg-amber-900/30 text-amber-400 border-amber-600'
                : 'bg-cyan-900/30 text-cyan-400 border-cyan-600'
            }
          >
            {mustHaveFeatures.length}/5 selected
          </Badge>
        </div>
        <p className="text-sm text-gray-400">
          Select up to 5 features that are absolutely critical for your needs
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MUST_HAVE_FEATURES.map(feature => {
            const isSelected = mustHaveFeatures.includes(feature.value);
            const isDisabled = !isSelected && mustHaveFeatures.length >= 5;

            return (
              <div
                key={feature.value}
                className={`flex items-center space-x-2 p-3 rounded-lg border ${
                  isSelected
                    ? 'bg-cyan-900/30 border-cyan-600'
                    : isDisabled
                      ? 'bg-gray-900 border-gray-800 opacity-50'
                      : 'bg-gray-800/50 border-gray-700'
                }`}
              >
                <Checkbox
                  id={`feature-${feature.value}`}
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={checked =>
                    handleFeatureToggle(feature.value, checked as boolean)
                  }
                  className="border-gray-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <label
                  htmlFor={`feature-${feature.value}`}
                  className={`text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-300'} cursor-pointer flex-1`}
                >
                  {feature.label}
                </label>
              </div>
            );
          })}
        </div>
        {mustHaveFeatures.length === 5 && (
          <div className="flex items-center space-x-2 text-amber-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Maximum of 5 features reached. Unselect a feature to choose another.</span>
          </div>
        )}
      </div>

      {/* Critical Integrations */}
      <div className="space-y-3">
        <Label className="text-white">Critical Integrations</Label>
        <p className="text-sm text-gray-400">
          Select all systems that the compliance solution must integrate with
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CRITICAL_INTEGRATIONS.map(integration => (
            <div key={integration.value} className="flex items-center space-x-2">
              <Checkbox
                id={`integration-${integration.value}`}
                checked={criticalIntegrations.includes(integration.value)}
                onCheckedChange={checked =>
                  handleIntegrationToggle(integration.value, checked as boolean)
                }
                className="border-gray-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
              />
              <label
                htmlFor={`integration-${integration.value}`}
                className="text-sm text-gray-300 cursor-pointer"
              >
                {integration.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
