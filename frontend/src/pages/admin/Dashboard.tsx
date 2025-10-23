import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

// Mock data for metrics
const assessmentMetrics = {
  started: 342,
  completed: 218,
  inProgress: 124,
  abandoned: 47,
  completionRate: 63.7,
  avgDuration: '24 min',
};

const vendorMetrics = {
  totalClicks: 1842,
  uniqueVisitors: 567,
  contacts: 89,
  conversionRate: 15.7,
  topVendor: 'SecurePoint Solutions',
};

// Conversion funnel data
const funnelData = [
  { name: 'Started Assessment', value: 342, fill: '#3BE2E9' },
  { name: 'Completed Questions', value: 265, fill: '#3BE2E9' },
  { name: 'Viewed Results', value: 218, fill: '#3BE2E9' },
  { name: 'Contacted Vendor', value: 89, fill: '#F345B8' },
  { name: 'Converted', value: 34, fill: '#F345B8' },
];

// Daily assessment trend
const trendData = [
  { day: 'Mon', assessments: 45, vendors: 12 },
  { day: 'Tue', assessments: 52, vendors: 18 },
  { day: 'Wed', assessments: 48, vendors: 15 },
  { day: 'Thu', assessments: 61, vendors: 22 },
  { day: 'Fri', assessments: 55, vendors: 19 },
  { day: 'Sat', assessments: 32, vendors: 8 },
  { day: 'Sun', assessments: 28, vendors: 6 },
];

// Assessment distribution
const distributionData = [
  { name: 'SOC 2', value: 35, color: '#3BE2E9' },
  { name: 'ISO 27001', value: 25, color: '#F345B8' },
  { name: 'HIPAA', value: 20, color: '#939393' },
  { name: 'GDPR', value: 15, color: '#4ade80' },
  { name: 'Other', value: 5, color: '#f59e0b' },
];

const AdminDashboard = () => {
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
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <FileCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessmentMetrics.started}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12.5%
                </span>{' '}
                from last month
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessmentMetrics.completionRate}%</div>
              <Progress value={assessmentMetrics.completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendor Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorMetrics.totalClicks}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +8.3%
                </span>{' '}
                conversion rate
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendor Contacts</CardTitle>
              <Phone className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorMetrics.contacts}</div>
              <p className="text-xs text-muted-foreground">
                From {vendorMetrics.uniqueVisitors} unique visitors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Conversion Funnel</CardTitle>
              <CardDescription>Drop-off tracking through assessment journey</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="center" fill="#fff" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Trend</CardTitle>
              <CardDescription>Assessments and vendor interactions</CardDescription>
            </CardHeader>
            <CardContent>
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
                  />
                  <Line
                    type="monotone"
                    dataKey="vendors"
                    stroke="#F345B8"
                    strokeWidth={2}
                    dot={{ fill: '#F345B8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assessment Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Types</CardTitle>
              <CardDescription>Distribution by compliance framework</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* In Progress Stats */}
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
                  <span className="text-2xl font-bold text-green-500">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>In Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-500">
                    {assessmentMetrics.inProgress}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span>Abandoned</span>
                  </div>
                  <span className="text-2xl font-bold text-red-500">
                    {assessmentMetrics.abandoned}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Duration</span>
                    <span className="font-medium">{assessmentMetrics.avgDuration}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>By engagement this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'SecurePoint Solutions', clicks: 342, trend: 'up' },
                  { name: 'ComplianceHub Pro', clicks: 289, trend: 'up' },
                  { name: 'RiskShield Technologies', clicks: 234, trend: 'down' },
                  { name: 'AuditMaster Inc', clicks: 198, trend: 'up' },
                  { name: 'CyberGuard Systems', clicks: 156, trend: 'down' },
                ].map((vendor, index) => (
                  <div key={vendor.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.clicks} clicks</p>
                      </div>
                    </div>
                    {vendor.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
