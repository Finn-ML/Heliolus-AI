import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/AdminLayout';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileCheck,
  Activity,
  Building2,
  MousePointer,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsApi } from '@/lib/api';

// Utility functions
const formatDuration = (minutes: number): string => {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Loading skeleton component
const MetricCardSkeleton = () => (
  <Card className="card-hover">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
    </CardHeader>
    <CardContent>
      <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
      <div className="h-3 w-40 bg-muted animate-pulse rounded" />
    </CardContent>
  </Card>
);

const ChartCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-5 w-48 bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-64 bg-muted animate-pulse rounded" />
    </CardHeader>
    <CardContent>
      <div className="h-[300px] bg-muted animate-pulse rounded" />
    </CardContent>
  </Card>
);

// Trend indicator component
const TrendIndicator = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
};

const AdminDashboard = () => {
  // Fetch analytics data with 5-minute refresh
  const {
    data: assessmentData,
    isLoading: isLoadingAssessments,
    error: assessmentError,
    refetch: refetchAssessments,
  } = useQuery({
    queryKey: ['admin-analytics-assessments'],
    queryFn: () => adminAnalyticsApi.getAssessmentAnalytics(),
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
    retry: 3,
  });

  const {
    data: vendorData,
    isLoading: isLoadingVendors,
    error: vendorError,
    refetch: refetchVendors,
  } = useQuery({
    queryKey: ['admin-analytics-vendors'],
    queryFn: () => adminAnalyticsApi.getVendorAnalytics(),
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
    retry: 3,
  });

  const {
    data: userData,
    isLoading: isLoadingUsers,
    error: userError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['admin-analytics-users'],
    queryFn: () => adminAnalyticsApi.getUserAnalytics(),
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
    retry: 3,
  });

  // Calculate combined metrics
  const isLoading = isLoadingAssessments || isLoadingVendors || isLoadingUsers;
  const hasError = assessmentError || vendorError || userError;

  // Transform data for charts
  const funnelData = assessmentData
    ? [
        { name: 'Started Assessment', value: assessmentData.started, fill: '#3BE2E9' },
        {
          name: 'Completed Questions',
          value: assessmentData.completed,
          fill: '#3BE2E9',
        },
        {
          name: 'Viewed Results',
          value: assessmentData.completed,
          fill: '#3BE2E9',
        },
        {
          name: 'Contacted Vendor',
          value: vendorData?.totalContacts || 0,
          fill: '#F345B8',
        },
        {
          name: 'Converted',
          value: userData?.conversionFunnel?.upgradedToPremium || 0,
          fill: '#F345B8',
        },
      ]
    : [];

  const trendData = assessmentData?.trend?.slice(-7).map((t: any) => ({
    day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    assessments: t.started,
    completed: t.completed,
    vendors: vendorData?.trend?.find((v: any) => v.date === t.date)?.contacts || 0,
  })) || [];

  const distributionData = assessmentData?.byTemplate
    ?.slice(0, 5)
    .map((t: any, index: number) => ({
      name: t.templateName,
      value: t.percentage,
      color: ['#3BE2E9', '#F345B8', '#939393', '#4ade80', '#f59e0b'][index] || '#939393',
    })) || [];

  // Add "Other" category if there are more than 5 templates
  if (assessmentData?.byTemplate && assessmentData.byTemplate.length > 5) {
    const others = assessmentData.byTemplate.slice(5);
    const othersPercentage = others.reduce((sum: number, t: any) => sum + t.percentage, 0);
    if (othersPercentage > 0) {
      distributionData.push({
        name: 'Other',
        value: othersPercentage,
        color: '#94a3b8',
      });
    }
  }

  const topVendors = vendorData?.topVendors?.slice(0, 5).map((v: any) => ({
    name: v.companyName,
    clicks: v.clicks,
    trend: v.trendDirection as 'up' | 'down' | 'stable',
    id: v.vendorId,
  })) || [];

  // Error state
  if (hasError) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Failed to load analytics:{' '}
                {(assessmentError as Error)?.message ||
                  (vendorError as Error)?.message ||
                  (userError as Error)?.message}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchAssessments();
                  refetchVendors();
                  refetchUsers();
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time overview of platform metrics and activity
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                  <FileCheck className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assessmentData?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 inline-flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{assessmentData?.started || 0}
                    </span>{' '}
                    started this period
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {assessmentData?.completionRate?.toFixed(1) || 0}%
                  </div>
                  <Progress value={assessmentData?.completionRate || 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendor Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendorData?.totalClicks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 inline-flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {vendorData?.clickThroughRate?.toFixed(1) || 0}%
                    </span>{' '}
                    click-through rate
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendor Contacts</CardTitle>
                  <Phone className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendorData?.totalContacts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    From {vendorData?.activeVendors || 0} active vendors
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          {isLoading ? (
            <ChartCardSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assessment Conversion Funnel</CardTitle>
                <CardDescription>Drop-off tracking through assessment journey</CardDescription>
              </CardHeader>
              <CardContent>
                {funnelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <FunnelChart>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Funnel dataKey="value" data={funnelData} isAnimationActive>
                        <LabelList position="center" fill="#fff" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No funnel data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Weekly Trend */}
          {isLoading ? (
            <ChartCardSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity Trend</CardTitle>
                <CardDescription>Assessments and vendor interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="day" stroke="#999" />
                      <YAxis stroke="#999" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="assessments"
                        stroke="#3BE2E9"
                        strokeWidth={2}
                        dot={{ fill: '#3BE2E9' }}
                        name="Started"
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#4ade80"
                        strokeWidth={2}
                        dot={{ fill: '#4ade80' }}
                        name="Completed"
                      />
                      <Line
                        type="monotone"
                        dataKey="vendors"
                        stroke="#F345B8"
                        strokeWidth={2}
                        dot={{ fill: '#F345B8' }}
                        name="Vendor Contacts"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No trend data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assessment Types Distribution */}
          {isLoading ? (
            <ChartCardSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assessment Types</CardTitle>
                <CardDescription>Distribution by compliance framework</CardDescription>
              </CardHeader>
              <CardContent>
                {distributionData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {distributionData.map(item => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{item.value.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No template data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* In Progress Stats */}
          {isLoading ? (
            <ChartCardSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Real-time assessment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span>Currently Active</span>
                    </div>
                    <span className="text-2xl font-bold text-green-500">
                      {userData?.activeUsers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>In Progress</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-500">
                      {assessmentData?.inProgress || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span>Abandoned</span>
                    </div>
                    <span className="text-2xl font-bold text-red-500">
                      {assessmentData?.abandoned || 0}
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Duration</span>
                      <span className="font-medium">
                        {formatDuration(assessmentData?.avgCompletionTime || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Vendors */}
          {isLoading ? (
            <ChartCardSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Vendors</CardTitle>
                <CardDescription>By engagement this week</CardDescription>
              </CardHeader>
              <CardContent>
                {topVendors.length > 0 ? (
                  <div className="space-y-3">
                    {topVendors.map((vendor: any, index: number) => (
                      <div key={vendor.id || vendor.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground">{vendor.clicks} clicks</p>
                          </div>
                        </div>
                        <TrendIndicator trend={vendor.trend} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No vendor data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
