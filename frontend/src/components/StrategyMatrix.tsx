import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Filter,
  DollarSign,
  Download,
} from 'lucide-react';

interface StrategyMatrixProps {
  report: any;
  businessProfile: any;
  onNavigateToMarketplace: () => void;
}

const StrategyMatrix: React.FC<StrategyMatrixProps> = ({
  report,
  businessProfile,
  onNavigateToMarketplace,
}) => {
  const [sortBy, setSortBy] = useState<'urgency' | 'risk' | 'impact'>('urgency');
  const [filterBy, setFilterBy] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  if (!report || !businessProfile) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Analysis Required</h3>
          <p className="text-gray-600">
            Complete your business profile and risk assessment to view the strategy matrix and
            mitigation recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Generate strategy matrix data from risk areas with business profile context
  const generateStrategyMatrix = () => {
    const maturityLevel = businessProfile.maturityAssessment?.level || 'Basic';
    const businessSize = businessProfile.companySize || 'Medium';
    const businessType = businessProfile.businessType || 'Traditional Banking';

    return report.riskAreas.map((area: any, index: number) => {
      // Adjust priority based on business maturity and type
      const maturityMultiplier = maturityLevel.includes('Advanced')
        ? 0.8
        : maturityLevel.includes('Intermediate')
          ? 1.0
          : 1.2;

      const adjustedScore = area.score * maturityMultiplier;
      const urgencyScore = adjustedScore >= 7 ? 'High' : adjustedScore >= 4 ? 'Medium' : 'Low';

      // Calculate budget based on business size and risk level
      const baseBudget =
        businessSize === 'Large Enterprise'
          ? 200000
          : businessSize === 'Medium Enterprise'
            ? 100000
            : 50000;

      const riskMultiplier = adjustedScore >= 7 ? 1.5 : adjustedScore >= 4 ? 1.0 : 0.6;
      const estimatedBudget = Math.round(baseBudget * riskMultiplier);

      return {
        id: index + 1,
        category: area.category,
        riskLevel: area.riskLevel,
        currentScore: area.score,
        adjustedScore: adjustedScore,
        targetScore: Math.max(2, adjustedScore - 4), // More aggressive targets based on maturity
        urgency: urgencyScore,
        impact:
          area.category === 'Customer Due Diligence' || area.category === 'Transaction Monitoring'
            ? 'High'
            : 'Medium',
        effort: adjustedScore >= 7 ? 'High' : 'Medium',
        timeline: adjustedScore >= 7 ? '3-6 months' : '6-12 months',
        primaryMitigation: area.mitigationStrategies[0],
        secondaryActions: area.mitigationStrategies.slice(1),
        estimatedBudget: `$${estimatedBudget / 1000}K`,
        priority: adjustedScore >= 7 ? 1 : adjustedScore >= 5 ? 2 : 3,
        businessContext: {
          maturityGap: maturityLevel,
          sizeImpact: businessSize,
          typeSpecific: businessType,
        },
      };
    });
  };

  const strategyItems = generateStrategyMatrix();

  // Calculate total strategic investment needed
  const totalInvestment = strategyItems.reduce((acc, item) => {
    const budget = parseInt(item.estimatedBudget.replace('$', '').replace('K', ''));
    return acc + budget;
  }, 0);

  // Generate business strategy recommendations
  const generateBusinessStrategy = () => {
    const highPriorityItems = strategyItems.filter(item => item.priority === 1);
    const maturityLevel = businessProfile.maturityAssessment?.level || 'Basic';

    return {
      phase1: {
        title: 'Immediate Actions (0-6 months)',
        budget: Math.round(totalInvestment * 0.4),
        focus: highPriorityItems.map(item => item.category),
        keyActions: [
          'Address critical compliance gaps in high-risk areas',
          'Implement foundational controls and monitoring systems',
          'Establish governance framework and policies',
        ],
      },
      phase2: {
        title: 'Strategic Enhancement (6-18 months)',
        budget: Math.round(totalInvestment * 0.35),
        focus: ['Technology Modernization', 'Process Optimization', 'Staff Training'],
        keyActions: [
          'Deploy advanced analytics and AI-driven solutions',
          'Enhance customer due diligence processes',
          'Implement comprehensive training programs',
        ],
      },
      phase3: {
        title: 'Optimization & Maturation (18+ months)',
        budget: Math.round(totalInvestment * 0.25),
        focus: ['Continuous Monitoring', 'Innovation', 'Industry Leadership'],
        keyActions: [
          'Establish continuous improvement processes',
          'Leverage emerging technologies and industry best practices',
          'Build competitive advantage through compliance excellence',
        ],
      },
    };
  };

  const businessStrategy = generateBusinessStrategy();

  const filteredAndSortedItems = strategyItems
    .filter(item => filterBy === 'all' || item.riskLevel.toLowerCase() === filterBy)
    .sort((a, b) => {
      if (sortBy === 'urgency') {
        const urgencyOrder = { High: 3, Medium: 2, Low: 1 };
        return (
          urgencyOrder[b.urgency as keyof typeof urgencyOrder] -
          urgencyOrder[a.urgency as keyof typeof urgencyOrder]
        );
      }
      if (sortBy === 'risk') {
        return b.adjustedScore - a.adjustedScore;
      }
      if (sortBy === 'impact') {
        const impactOrder = { High: 3, Medium: 2, Low: 1 };
        return (
          impactOrder[b.impact as keyof typeof impactOrder] -
          impactOrder[a.impact as keyof typeof impactOrder]
        );
      }
      return 0;
    });

  // Helper functions for colors and icons
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'default';
      case 'Low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: number) => {
    if (priority === 1) return <ArrowUp className="h-4 w-4 text-red-600" />;
    if (priority === 2) return <ArrowUp className="h-4 w-4 text-yellow-600" />;
    return <ArrowDown className="h-4 w-4 text-green-600" />;
  };

  const downloadStrategyReport = () => {
    const reportData = {
      companyName: businessProfile.companyName || 'Company',
      generatedDate: new Date().toLocaleDateString(),
      maturityLevel: businessProfile.maturityAssessment?.level,
      totalInvestment,
      businessStrategy,
      strategyItems,
    };

    const reportContent = `
STRATEGIC RISK MITIGATION & BUSINESS PLAN
Generated: ${reportData.generatedDate}
Company: ${reportData.companyName}
Current Maturity Level: ${reportData.maturityLevel}

EXECUTIVE SUMMARY
Total Strategic Investment: $${reportData.totalInvestment}K over 18-24 months
Critical Priority Items: ${strategyItems.filter(item => item.urgency === 'High').length}
Medium Priority Items: ${strategyItems.filter(item => item.urgency === 'Medium').length}
Risk Reduction Target: ${Math.round(strategyItems.reduce((acc, item) => acc + (item.targetScore - item.adjustedScore), 0) * -10)}%

STRATEGIC INVESTMENT PLAN
${Object.entries(reportData.businessStrategy)
  .map(
    ([key, phase]) => `
${phase.title}
Budget: $${phase.budget}K
Focus Areas: ${phase.focus.join(', ')}
Key Actions:
${phase.keyActions.map((action: string) => `• ${action}`).join('\n')}
`
  )
  .join('\n')}

DETAILED STRATEGY MATRIX
${reportData.strategyItems
  .map(
    (item: any, idx: number) => `
${idx + 1}. ${item.category}
   Priority: P${item.priority} (${item.urgency} Urgency)
   Risk Score: ${item.adjustedScore.toFixed(1)} → ${item.targetScore.toFixed(1)}
   Timeline: ${item.timeline}
   Budget: ${item.estimatedBudget}
   Primary Mitigation: ${item.primaryMitigation}
   Business Context: ${item.businessContext.maturityGap}, ${item.businessContext.sizeImpact}
`
  )
  .join('\n')}

IMPLEMENTATION ROADMAP
Phase 1 (0-6 months): Address critical compliance gaps and establish foundational controls
Phase 2 (6-18 months): Deploy advanced analytics and enhance processes  
Phase 3 (18+ months): Establish continuous improvement and build competitive advantage

This strategic plan was generated based on comprehensive risk assessment and business profile analysis.
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Strategy_Matrix_${reportData.companyName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-purple-600" />
                <span>Strategic Risk Mitigation & Business Plan</span>
              </CardTitle>
              <CardDescription>
                Comprehensive strategy matrix with prioritized actions, budgets, and implementation
                roadmap tailored to your {businessProfile.maturityAssessment?.level} maturity level
              </CardDescription>
            </div>
            <Button onClick={downloadStrategyReport} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Download Strategy Report</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Business Strategy Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span>Strategic Investment Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(businessStrategy).map(([key, phase]) => (
              <div key={key} className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold text-lg mb-2">{phase.title}</h3>
                <div className="text-2xl font-bold text-green-600 mb-3">${phase.budget}K</div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Focus Areas:</div>
                  <div className="flex flex-wrap gap-1">
                    {phase.focus.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 mt-3">
                    <ul className="space-y-1">
                      {phase.keyActions.map((action, idx) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-xs">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">Total Strategic Investment</div>
            <div className="text-3xl font-bold text-blue-600">${totalInvestment}K</div>
            <div className="text-sm text-gray-500">Over 18-24 months</div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">
              {strategyItems.filter(item => item.urgency === 'High').length}
            </div>
            <div className="text-sm text-red-600">Critical Priority</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">
              {strategyItems.filter(item => item.urgency === 'Medium').length}
            </div>
            <div className="text-sm text-yellow-600">Medium Priority</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {businessProfile.maturityAssessment?.level.split(' ')[0]}
            </div>
            <div className="text-sm text-blue-600">Current Maturity</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {Math.round(
                strategyItems.reduce(
                  (acc, item) => acc + (item.targetScore - item.adjustedScore),
                  0
                ) * -10
              )}
              %
            </div>
            <div className="text-sm text-green-600">Risk Reduction Target</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Sort by:</span>
              <div className="flex space-x-2">
                <Button
                  variant={sortBy === 'urgency' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('urgency')}
                >
                  Urgency
                </Button>
                <Button
                  variant={sortBy === 'risk' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('risk')}
                >
                  Risk Score
                </Button>
                <Button
                  variant={sortBy === 'impact' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('impact')}
                >
                  Impact
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Filter:</span>
              <div className="flex space-x-2">
                <Button
                  variant={filterBy === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBy('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterBy === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBy('high')}
                >
                  High Risk
                </Button>
                <Button
                  variant={filterBy === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBy('medium')}
                >
                  Medium Risk
                </Button>
                <Button
                  variant={filterBy === 'low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBy('low')}
                >
                  Low Risk
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Strategy Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Mitigation Strategy Matrix</CardTitle>
          <CardDescription>
            Prioritized mitigation strategies with business context, adjusted for your{' '}
            {businessProfile.maturityAssessment?.level} maturity level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Risk Area</TableHead>
                <TableHead>Adjusted Risk</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Primary Mitigation</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Business Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(item.priority)}
                      <span className="font-medium">P{item.priority}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.category}</div>
                      <Badge
                        variant={
                          item.riskLevel === 'High'
                            ? 'destructive'
                            : item.riskLevel === 'Medium'
                              ? 'default'
                              : 'secondary'
                        }
                        className="mt-1"
                      >
                        {item.riskLevel} Risk
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="text-lg font-bold">{item.adjustedScore.toFixed(1)}</div>
                      <ArrowDown className="h-4 w-4 text-green-600" />
                      <div className="text-sm text-green-600">{item.targetScore.toFixed(1)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getUrgencyColor(item.urgency)}>{item.urgency}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.impact === 'High' ? 'destructive' : 'default'}>
                      {item.impact}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm">{item.primaryMitigation}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{item.timeline}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.estimatedBudget}</TableCell>
                  <TableCell className="text-xs text-gray-600">
                    <div>{item.businessContext.maturityGap}</div>
                    <div>{item.businessContext.sizeImpact}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Implementation Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Implementation Roadmap</CardTitle>
          <CardDescription>
            Phased approach tailored to your business size ({businessProfile.companySize}) and
            maturity level ({businessProfile.maturityAssessment?.level})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(businessStrategy).map(([key, phase], phaseIndex) => {
              const phaseItems = filteredAndSortedItems.filter(item =>
                phaseIndex === 0
                  ? item.priority === 1
                  : phaseIndex === 1
                    ? item.priority === 2
                    : item.priority === 3
              );

              return (
                <div key={phase.title} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          phaseIndex === 0
                            ? 'bg-red-600'
                            : phaseIndex === 1
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                        }`}
                      >
                        {phaseIndex + 1}
                      </div>
                      <span>{phase.title}</span>
                    </h3>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">${phase.budget}K</div>
                      <div className="text-xs text-gray-500">Budget Allocation</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phaseItems.map(item => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{item.category}</h4>
                        <p className="text-sm text-gray-600 mb-3">{item.primaryMitigation}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Budget: {item.estimatedBudget}</span>
                          <span>Timeline: {item.timeline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Ready to Source Solutions?
              </h3>
              <p className="text-blue-700">
                Explore our marketplace to find technology vendors and solutions that align with
                your strategic priorities and budget.
              </p>
            </div>
            <Button
              onClick={onNavigateToMarketplace}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Find Solutions
              <TrendingUp className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategyMatrix;
