/**
 * Step 7: Priorities Review & Submit
 * Story 1.14: Priorities Questionnaire UI
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { PrioritiesData } from '@/types/priorities.types';
import {
  COMPANY_SIZES,
  ANNUAL_REVENUES,
  COMPLIANCE_TEAM_SIZES,
  JURISDICTIONS,
  EXISTING_SYSTEMS,
  PRIMARY_GOALS,
  IMPLEMENTATION_URGENCY_LABELS,
  BUDGET_RANGES,
  DEPLOYMENT_PREFERENCES,
  MUST_HAVE_FEATURES,
  VENDOR_MATURITY_OPTIONS,
  GEOGRAPHIC_REQUIREMENTS,
  SUPPORT_MODELS,
  DECISION_FACTORS,
} from '@/types/priorities.types';
import { Edit, CheckCircle, Loader2 } from 'lucide-react';

interface PrioritiesReviewProps {
  data: PrioritiesData;
  onEdit: (step: number) => void;
  onSubmit: (data: PrioritiesData) => void;
  isSubmitting: boolean;
}

export default function PrioritiesReview({
  data,
  onEdit,
  onSubmit,
  isSubmitting,
}: PrioritiesReviewProps) {
  const getLabel = (value: string, options: { value: string; label: string }[]) => {
    return options.find(opt => opt.value === value)?.label || value;
  };

  const getLabels = (values: string[], options: { value: string; label: string }[]) => {
    return values.map(v => getLabel(v, options));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Review Your Priorities</h2>
        <p className="text-gray-400 text-sm">
          Review your responses below. Click Edit to make changes to any section, or Submit to save
          your priorities.
        </p>
      </div>

      {/* Step 1: Organizational Context */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg text-white">1. Organizational Context</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(1)}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Company Size</p>
            <p className="text-white">{getLabel(data.step1?.companySize || '', COMPANY_SIZES)}</p>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500">Annual Revenue</p>
            <p className="text-white">
              {getLabel(data.step1?.annualRevenue || '', ANNUAL_REVENUES)}
            </p>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500">Compliance Team Size</p>
            <p className="text-white">
              {getLabel(data.step1?.complianceTeamSize || '', COMPLIANCE_TEAM_SIZES)}
            </p>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500 mb-2">Operating Jurisdictions</p>
            <div className="flex flex-wrap gap-2">
              {getLabels(data.step1?.jurisdictions || [], JURISDICTIONS).map((label, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-cyan-900/30 text-cyan-400 border-cyan-600"
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500 mb-2">Existing Systems</p>
            <div className="flex flex-wrap gap-2">
              {getLabels(data.step1?.existingSystems || [], EXISTING_SYSTEMS).map(
                (label, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-gray-700 text-gray-300 border-gray-600"
                  >
                    {label}
                  </Badge>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Goals & Timeline */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg text-white">2. Goals & Timeline</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(2)}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Primary Goal</p>
            <p className="text-white font-medium">
              {PRIMARY_GOALS.find(g => g.value === data.step2?.primaryGoal)?.label}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {PRIMARY_GOALS.find(g => g.value === data.step2?.primaryGoal)?.description}
            </p>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500">Implementation Urgency</p>
            <Badge variant="outline" className="bg-cyan-900/30 text-cyan-400 border-cyan-600 mt-1">
              {IMPLEMENTATION_URGENCY_LABELS[(data.step2?.implementationUrgency || 2) - 1]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Use Case Prioritization */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg text-white">3. Use Case Prioritization</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(3)}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">Top 3 Prioritized Use Cases</p>
          <div className="space-y-2">
            {(data.step3?.prioritizedUseCases || [])
              .sort((a, b) => a.rank - b.rank)
              .map((uc, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <Badge variant="outline" className="bg-cyan-900/30 text-cyan-400 border-cyan-600">
                    #{uc.rank}
                  </Badge>
                  <span className="text-white">{uc.category}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Solution Requirements */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg text-white">4. Solution Requirements</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(4)}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Budget Range</p>
            <p className="text-white">{getLabel(data.step4?.budgetRange || '', BUDGET_RANGES)}</p>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500">Deployment Preference</p>
            <p className="text-white">
              {
                DEPLOYMENT_PREFERENCES.find(d => d.value === data.step4?.deploymentPreference)
                  ?.label
              }
            </p>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Must-Have Features ({data.step4?.mustHaveFeatures?.length || 0}/5)
            </p>
            <div className="flex flex-wrap gap-2">
              {getLabels(data.step4?.mustHaveFeatures || [], MUST_HAVE_FEATURES).map(
                (label, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-cyan-900/30 text-cyan-400 border-cyan-600"
                  >
                    {label}
                  </Badge>
                )
              )}
            </div>
          </div>
          {data.step4?.criticalIntegrations && data.step4.criticalIntegrations.length > 0 && (
            <>
              <Separator className="bg-gray-800" />
              <div>
                <p className="text-sm text-gray-500 mb-2">Critical Integrations</p>
                <p className="text-gray-300 text-sm">
                  {data.step4.criticalIntegrations.join(', ')}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 5: Vendor Preferences */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg text-white">5. Vendor Preferences</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(5)}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Vendor Maturity</p>
            <p className="text-white">
              {VENDOR_MATURITY_OPTIONS.find(v => v.value === data.step5?.vendorMaturity)?.label}
            </p>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500">Geographic Requirements</p>
            <p className="text-white">
              {
                GEOGRAPHIC_REQUIREMENTS.find(g => g.value === data.step5?.geographicRequirements)
                  ?.label
              }
            </p>
          </div>
          <Separator className="bg-gray-800" />
          <div>
            <p className="text-sm text-gray-500">Support Model</p>
            <p className="text-white">
              {SUPPORT_MODELS.find(s => s.value === data.step5?.supportModel)?.label}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 6: Decision Factor Ranking */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg text-white">6. Decision Factor Ranking</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(6)}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">Decision Factors (in priority order)</p>
          <div className="space-y-2">
            {(data.step6?.decisionFactorRanking || [])
              .sort((a, b) => a.rank - b.rank)
              .map((item, index) => {
                const factor = DECISION_FACTORS.find(f => f.id === item.factor);
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <Badge
                      variant="outline"
                      className={
                        item.rank === 1
                          ? 'bg-yellow-900/30 text-yellow-400 border-yellow-600'
                          : item.rank === 2
                            ? 'bg-gray-600/30 text-gray-300 border-gray-500'
                            : item.rank === 3
                              ? 'bg-orange-900/30 text-orange-400 border-orange-600'
                              : 'bg-cyan-900/30 text-cyan-400 border-cyan-600'
                      }
                    >
                      #{item.rank}
                    </Badge>
                    <span className="text-white">{factor?.factor}</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Submit Section */}
      <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-700">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <CheckCircle className="h-6 w-6 text-cyan-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Ready to Submit?</h3>
              <p className="text-gray-300 text-sm mb-4">
                By submitting your priorities, we'll generate personalized vendor recommendations
                based on your specific needs and preferences. You can update these priorities at any
                time.
              </p>
              <Button
                onClick={() => onSubmit(data)}
                disabled={isSubmitting}
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Submit Priorities
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
