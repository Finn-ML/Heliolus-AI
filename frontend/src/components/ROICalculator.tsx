import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';

interface ROICalculatorProps {
  vendor: any;
  onClose: () => void;
}

const ROICalculator: React.FC<ROICalculatorProps> = ({ vendor, onClose }) => {
  const [inputs, setInputs] = useState({
    currentAnnualCosts: '',
    implementationCost: '',
    annualLicenseCost: '',
    maintenanceCost: '',
    timeSavingsHours: '',
    hourlyRate: '',
    riskReductionSavings: '',
    complianceSavings: '',
  });

  const [results, setResults] = useState<any>(null);

  const calculateROI = () => {
    const currentCosts = parseFloat(inputs.currentAnnualCosts) || 0;
    const implementationCost = parseFloat(inputs.implementationCost) || 0;
    const annualLicense = parseFloat(inputs.annualLicenseCost) || 0;
    const maintenance = parseFloat(inputs.maintenanceCost) || 0;
    const timeSavings = parseFloat(inputs.timeSavingsHours) || 0;
    const hourlyRate = parseFloat(inputs.hourlyRate) || 0;
    const riskSavings = parseFloat(inputs.riskReductionSavings) || 0;
    const complianceSavings = parseFloat(inputs.complianceSavings) || 0;

    // Calculate annual benefits
    const timeSavingsBenefit = timeSavings * hourlyRate * 52; // weekly hours * rate * weeks
    const totalAnnualBenefits = timeSavingsBenefit + riskSavings + complianceSavings;
    const costSavings = Math.max(0, currentCosts - (annualLicense + maintenance));
    const totalAnnualSavings = totalAnnualBenefits + costSavings;

    // Calculate ROI metrics
    const totalFirstYearCost = implementationCost + annualLicense + maintenance;
    const netBenefit = totalAnnualSavings - totalFirstYearCost;
    const roi = totalFirstYearCost > 0 ? (netBenefit / totalFirstYearCost) * 100 : 0;
    const paybackPeriod = totalAnnualSavings > 0 ? totalFirstYearCost / totalAnnualSavings : 0;

    // 3-year projection
    const threeYearCosts = implementationCost + (annualLicense + maintenance) * 3;
    const threeYearBenefits = totalAnnualSavings * 3;
    const threeYearROI =
      threeYearCosts > 0 ? ((threeYearBenefits - threeYearCosts) / threeYearCosts) * 100 : 0;

    setResults({
      totalAnnualSavings,
      totalFirstYearCost,
      netBenefit,
      roi,
      paybackPeriod,
      threeYearROI,
      timeSavingsBenefit,
      costSavings,
      riskAndComplianceSavings: riskSavings + complianceSavings,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>ROI Calculator - {vendor.name}</CardTitle>
              <CardDescription>
                Calculate the potential return on investment for this solution
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cost Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Costs & Investment</h3>

            <div className="space-y-2">
              <Label htmlFor="currentCosts">Current Annual Compliance Costs ($)</Label>
              <Input
                id="currentCosts"
                type="number"
                value={inputs.currentAnnualCosts}
                onChange={e => setInputs(prev => ({ ...prev, currentAnnualCosts: e.target.value }))}
                placeholder="e.g., 150000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="implementationCost">Implementation Cost ($)</Label>
              <Input
                id="implementationCost"
                type="number"
                value={inputs.implementationCost}
                onChange={e => setInputs(prev => ({ ...prev, implementationCost: e.target.value }))}
                placeholder="e.g., 50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualLicense">Annual License Cost ($)</Label>
              <Input
                id="annualLicense"
                type="number"
                value={inputs.annualLicenseCost}
                onChange={e => setInputs(prev => ({ ...prev, annualLicenseCost: e.target.value }))}
                placeholder="e.g., 30000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance">Annual Maintenance Cost ($)</Label>
              <Input
                id="maintenance"
                type="number"
                value={inputs.maintenanceCost}
                onChange={e => setInputs(prev => ({ ...prev, maintenanceCost: e.target.value }))}
                placeholder="e.g., 10000"
              />
            </div>
          </div>

          {/* Benefits Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Expected Benefits</h3>

            <div className="space-y-2">
              <Label htmlFor="timeSavings">Time Savings (hours/week)</Label>
              <Input
                id="timeSavings"
                type="number"
                value={inputs.timeSavingsHours}
                onChange={e => setInputs(prev => ({ ...prev, timeSavingsHours: e.target.value }))}
                placeholder="e.g., 20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Average Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={inputs.hourlyRate}
                onChange={e => setInputs(prev => ({ ...prev, hourlyRate: e.target.value }))}
                placeholder="e.g., 75"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskSavings">Annual Risk Reduction Savings ($)</Label>
              <Input
                id="riskSavings"
                type="number"
                value={inputs.riskReductionSavings}
                onChange={e =>
                  setInputs(prev => ({ ...prev, riskReductionSavings: e.target.value }))
                }
                placeholder="e.g., 25000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complianceSavings">Annual Compliance Savings ($)</Label>
              <Input
                id="complianceSavings"
                type="number"
                value={inputs.complianceSavings}
                onChange={e => setInputs(prev => ({ ...prev, complianceSavings: e.target.value }))}
                placeholder="e.g., 15000"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={calculateROI} size="lg" className="px-8">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate ROI
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="mt-8 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              ROI Analysis Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className={`${results.roi >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
              >
                <CardContent className="p-4 text-center">
                  <TrendingUp
                    className={`mx-auto h-8 w-8 mb-2 ${results.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <div
                    className={`text-2xl font-bold ${results.roi >= 0 ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {formatPercentage(results.roi)}
                  </div>
                  <div className="text-sm text-gray-600">First Year ROI</div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <DollarSign className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(results.netBenefit)}
                  </div>
                  <div className="text-sm text-gray-600">Net Benefit (Year 1)</div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Calculator className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                  <div className="text-2xl font-bold text-purple-700">
                    {results.paybackPeriod > 0
                      ? `${results.paybackPeriod.toFixed(1)} years`
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Payback Period</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Annual Benefits Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Time Savings:</span>
                    <span className="font-medium">
                      {formatCurrency(results.timeSavingsBenefit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost Savings:</span>
                    <span className="font-medium">{formatCurrency(results.costSavings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk & Compliance:</span>
                    <span className="font-medium">
                      {formatCurrency(results.riskAndComplianceSavings)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Annual Savings:</span>
                    <span>{formatCurrency(results.totalAnnualSavings)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3-Year Projection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>3-Year ROI:</span>
                    <span
                      className={`font-medium ${results.threeYearROI >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatPercentage(results.threeYearROI)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Benefits:</span>
                    <span className="font-medium">
                      {formatCurrency(results.totalAnnualSavings * 3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Investment:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        results.totalFirstYearCost +
                          (parseFloat(inputs.annualLicenseCost) +
                            parseFloat(inputs.maintenanceCost)) *
                            2
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ROICalculator;
