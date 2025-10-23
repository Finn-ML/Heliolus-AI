import { Calendar, CheckCircle, TrendingUp, Users, DollarSign, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { assessmentApi, queryKeys } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import type { TimelineBucket } from '@/types/vendor-matching.types';

interface StrategyMatrixProps {
  assessmentId: string;
}

const StrategyMatrix: React.FC<StrategyMatrixProps> = ({ assessmentId }) => {
  const navigate = useNavigate();

  // Fetch strategy matrix data from backend
  const {
    data: strategyMatrix,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.strategyMatrix(assessmentId),
    queryFn: () => assessmentApi.getStrategyMatrix(assessmentId),
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Loading state - show skeleton for three buckets
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
        </Card>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-800">
        <CardHeader>
          <CardTitle className="text-red-400">Error Loading Strategy Matrix</CardTitle>
          <CardDescription className="text-red-300">
            {error instanceof Error ? error.message : 'Failed to load strategy matrix data'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!strategyMatrix) {
    return null;
  }

  const buckets = [
    {
      key: 'immediate',
      data: strategyMatrix.immediate,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/50',
      icon: TrendingUp,
    },
    {
      key: 'nearTerm',
      data: strategyMatrix.nearTerm,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      icon: Calendar,
    },
    {
      key: 'strategic',
      data: strategyMatrix.strategic,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      badgeColor: 'bg-green-500/20 text-green-400 border-green-500/50',
      icon: Briefcase,
    },
  ];

  const renderBucket = (bucket: (typeof buckets)[0]) => {
    const { data, color, bgColor, borderColor, badgeColor, icon: Icon } = bucket;
    const hasGaps = data.gapCount > 0;

    return (
      <Card
        key={bucket.key}
        className={`bg-gray-900/50 backdrop-blur-sm border-gray-800 ${hasGaps ? bgColor : ''}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Icon className={`h-5 w-5 text-${color}-400`} />
              {data.timeline}
            </CardTitle>
            <Badge className={badgeColor}>
              {data.gapCount} {data.gapCount === 1 ? 'Gap' : 'Gaps'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {hasGaps ? (
            <div className="space-y-4">
              {/* Effort Distribution */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Effort Distribution</h4>
                <div className="flex gap-2">
                  {data.effortDistribution.SMALL > 0 && (
                    <Badge variant="outline" className="text-xs border-gray-700">
                      Small: {data.effortDistribution.SMALL}
                    </Badge>
                  )}
                  {data.effortDistribution.MEDIUM > 0 && (
                    <Badge variant="outline" className="text-xs border-gray-700">
                      Medium: {data.effortDistribution.MEDIUM}
                    </Badge>
                  )}
                  {data.effortDistribution.LARGE > 0 && (
                    <Badge variant="outline" className="text-xs border-gray-700">
                      Large: {data.effortDistribution.LARGE}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Estimated Cost */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estimated Cost
                </h4>
                <p className="text-sm text-white">{data.estimatedCostRange}</p>
              </div>

              {/* Top Vendors */}
              {data.topVendors && data.topVendors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Top Recommended Vendors
                  </h4>
                  <div className="space-y-2">
                    {data.topVendors.slice(0, 3).map((vendorRec, idx) => (
                      <div
                        key={vendorRec.vendor.id}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {vendorRec.vendor.companyName}
                          </p>
                          <p className="text-xs text-gray-400">
                            Covers {vendorRec.gapsCovered}{' '}
                            {vendorRec.gapsCovered === 1 ? 'gap' : 'gaps'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          onClick={() => navigate(`/marketplace?vendor=${vendorRec.vendor.id}`)}
                        >
                          View Vendor
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Empty state - no gaps in this timeframe
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mb-3" />
              <p className="text-sm text-gray-400">No gaps in this timeframe</p>
              <p className="text-xs text-gray-500 mt-1">All requirements met</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Strategic Overview Header */}
      <Card className="bg-gradient-to-r from-cyan-900/30 to-pink-900/30 border-cyan-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Strategic Compliance Roadmap
          </CardTitle>
          <CardDescription className="text-gray-300">
            Timeline-based remediation strategy with vendor recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">
                {strategyMatrix.immediate.gapCount}
              </div>
              <p className="text-sm text-gray-400">Immediate (0-6 months)</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {strategyMatrix.nearTerm.gapCount}
              </div>
              <p className="text-sm text-gray-400">Near-term (6-18 months)</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {strategyMatrix.strategic.gapCount}
              </div>
              <p className="text-sm text-gray-400">Strategic (18+ months)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Buckets - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buckets.map(bucket => renderBucket(bucket))}
      </div>
    </div>
  );
};

export default StrategyMatrix;
