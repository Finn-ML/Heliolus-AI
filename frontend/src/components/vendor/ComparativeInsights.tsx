// Epic 13 - Story 13.4: Comparative Insights Component
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  Cloud,
} from 'lucide-react';
import { VendorMatchScore } from '@/types/vendor-matching.types';

interface ComparativeInsightsProps {
  vendor1: any;
  match1: VendorMatchScore;
  vendor2: any;
  match2: VendorMatchScore;
}

interface Insight {
  type: string;
  message: string;
  advantage: 'vendor1' | 'vendor2' | 'neutral';
  icon: React.ElementType;
}

export const ComparativeInsights: React.FC<ComparativeInsightsProps> = ({
  vendor1,
  match1,
  vendor2,
  match2,
}) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // 1. Overall Score Advantage
    const scoreDiff = Math.abs(match1.totalScore - match2.totalScore);
    const scorePercent = (scoreDiff / Math.max(match1.totalScore, match2.totalScore)) * 100;
    if (scorePercent >= 10) {
      const winner = match1.totalScore > match2.totalScore ? 'vendor1' : 'vendor2';
      insights.push({
        type: 'overall',
        message: `${winner === 'vendor1' ? vendor1.name : vendor2.name} scores ${scorePercent.toFixed(0)}% higher overall`,
        advantage: winner,
        icon: TrendingUp,
      });
    }

    // 2. Gap Coverage Advantage
    const gapDiff = Math.abs(
      match1.baseScore.riskAreaCoverage - match2.baseScore.riskAreaCoverage
    );
    if (gapDiff >= 5) {
      const winner =
        match1.baseScore.riskAreaCoverage > match2.baseScore.riskAreaCoverage
          ? 'vendor1'
          : 'vendor2';
      insights.push({
        type: 'gaps',
        message: `${winner === 'vendor1' ? vendor1.name : vendor2.name} addresses more of your critical compliance gaps`,
        advantage: winner,
        icon: CheckCircle,
      });
    }

    // 3. Priority Alignment Advantage
    if (match1.priorityBoost.topPriorityBoost > match2.priorityBoost.topPriorityBoost) {
      insights.push({
        type: 'priority',
        message: `${vendor1.name} better aligns with your top priorities`,
        advantage: 'vendor1',
        icon: Sparkles,
      });
    } else if (match2.priorityBoost.topPriorityBoost > match1.priorityBoost.topPriorityBoost) {
      insights.push({
        type: 'priority',
        message: `${vendor2.name} better aligns with your top priorities`,
        advantage: 'vendor2',
        icon: Sparkles,
      });
    }

    // 4. Feature Completeness
    const vendor1MissingCount = match1.priorityBoost.missingFeatures.length;
    const vendor2MissingCount = match2.priorityBoost.missingFeatures.length;
    if (vendor1MissingCount < vendor2MissingCount) {
      const diff = vendor2MissingCount - vendor1MissingCount;
      insights.push({
        type: 'features',
        message: `${vendor1.name} has ${diff} more of your must-have features`,
        advantage: 'vendor1',
        icon: CheckCircle,
      });
    } else if (vendor2MissingCount < vendor1MissingCount) {
      const diff = vendor1MissingCount - vendor2MissingCount;
      insights.push({
        type: 'features',
        message: `${vendor2.name} has ${diff} more of your must-have features`,
        advantage: 'vendor2',
        icon: CheckCircle,
      });
    }

    // 5. Budget Fit
    if (match1.baseScore.priceScore > match2.baseScore.priceScore) {
      const msg =
        match1.baseScore.priceScore === 20
          ? `${vendor1.name} is within your budget`
          : `${vendor1.name} is closer to your budget`;
      insights.push({
        type: 'budget',
        message: msg,
        advantage: 'vendor1',
        icon: DollarSign,
      });
    } else if (match2.baseScore.priceScore > match1.baseScore.priceScore) {
      const msg =
        match2.baseScore.priceScore === 20
          ? `${vendor2.name} is within your budget`
          : `${vendor2.name} is closer to your budget`;
      insights.push({
        type: 'budget',
        message: msg,
        advantage: 'vendor2',
        icon: DollarSign,
      });
    }

    // 6. Implementation Speed
    if (match1.priorityBoost.speedBoost > match2.priorityBoost.speedBoost) {
      insights.push({
        type: 'speed',
        message: `${vendor1.name} offers faster implementation`,
        advantage: 'vendor1',
        icon: Clock,
      });
    } else if (match2.priorityBoost.speedBoost > match1.priorityBoost.speedBoost) {
      insights.push({
        type: 'speed',
        message: `${vendor2.name} offers faster implementation`,
        advantage: 'vendor2',
        icon: Clock,
      });
    }

    // 7. Deployment Model
    if (match1.priorityBoost.deploymentBoost > match2.priorityBoost.deploymentBoost) {
      insights.push({
        type: 'deployment',
        message: `${vendor1.name} matches your deployment preferences`,
        advantage: 'vendor1',
        icon: Cloud,
      });
    } else if (match2.priorityBoost.deploymentBoost > match1.priorityBoost.deploymentBoost) {
      insights.push({
        type: 'deployment',
        message: `${vendor2.name} matches your deployment preferences`,
        advantage: 'vendor2',
        icon: Cloud,
      });
    }

    return insights;
  };

  const insights = generateInsights();

  // Determine overall recommendation
  const getRecommendation = () => {
    const vendor1Advantages = insights.filter((i) => i.advantage === 'vendor1').length;
    const vendor2Advantages = insights.filter((i) => i.advantage === 'vendor2').length;

    if (vendor1Advantages > vendor2Advantages) {
      return {
        vendor: vendor1.name,
        confidence: 'stronger',
        color: 'text-cyan-400',
      };
    } else if (vendor2Advantages > vendor1Advantages) {
      return {
        vendor: vendor2.name,
        confidence: 'stronger',
        color: 'text-pink-400',
      };
    } else {
      return {
        vendor: match1.totalScore > match2.totalScore ? vendor1.name : vendor2.name,
        confidence: 'slight',
        color: match1.totalScore > match2.totalScore ? 'text-cyan-400' : 'text-pink-400',
      };
    }
  };

  const recommendation = getRecommendation();

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-pink-900/20 border-cyan-500/30 mb-6">
      <CardHeader className="border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
          <h3 className="text-xl font-bold text-white">AI-Powered Comparative Insights</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ul className="space-y-3 mb-6">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            const colorClass =
              insight.advantage === 'vendor1'
                ? 'text-cyan-400'
                : insight.advantage === 'vendor2'
                ? 'text-pink-400'
                : 'text-gray-400';

            return (
              <li key={index} className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${colorClass} mt-0.5 flex-shrink-0`} />
                <span className="text-gray-300 text-sm leading-relaxed">{insight.message}</span>
              </li>
            );
          })}
        </ul>

        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm font-semibold mb-1 text-gray-400">Summary Recommendation:</p>
          <p className={`text-base font-semibold ${recommendation.color}`}>
            Based on your assessment, {recommendation.vendor} is the {recommendation.confidence}{' '}
            match for your needs
          </p>
        </div>

        {/* Additional Metadata */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <p className="font-medium text-gray-400 mb-1">Budget Fit:</p>
            <div className="flex gap-2">
              <Badge
                className={
                  match1.baseScore.priceScore === 20
                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                    : match1.baseScore.priceScore === 10
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                    : 'bg-red-500/20 text-red-400 border-red-500/50'
                }
              >
                {vendor1.name?.substring(0, 12) || 'Vendor 1'}
              </Badge>
              <Badge
                className={
                  match2.baseScore.priceScore === 20
                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                    : match2.baseScore.priceScore === 10
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                    : 'bg-red-500/20 text-red-400 border-red-500/50'
                }
              >
                {vendor2.name?.substring(0, 12) || 'Vendor 2'}
              </Badge>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-400 mb-1">Implementation Speed:</p>
            <div className="flex gap-2">
              <Badge
                className={
                  match1.priorityBoost.speedBoost === 5
                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                }
              >
                {match1.priorityBoost.speedBoost === 5 ? 'Fast' : 'Standard'}
              </Badge>
              <Badge
                className={
                  match2.priorityBoost.speedBoost === 5
                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                }
              >
                {match2.priorityBoost.speedBoost === 5 ? 'Fast' : 'Standard'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
