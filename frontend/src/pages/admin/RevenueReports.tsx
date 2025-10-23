import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';

// Mock data
const revenueData = [
  { month: 'Jan', revenue: 12500, subscriptions: 8500, credits: 3200, assessments: 800 },
  { month: 'Feb', revenue: 15200, subscriptions: 9200, credits: 4800, assessments: 1200 },
  { month: 'Mar', revenue: 18900, subscriptions: 10500, credits: 6800, assessments: 1600 },
  { month: 'Apr', revenue: 22300, subscriptions: 12000, credits: 8500, assessments: 1800 },
  { month: 'May', revenue: 25600, subscriptions: 13500, credits: 9800, assessments: 2300 },
  { month: 'Jun', revenue: 28900, subscriptions: 15000, credits: 11200, assessments: 2700 },
];

const revenueByProduct = [
  { name: 'Enterprise Plans', value: 45000, color: '#F345B8' },
  { name: 'Professional Plans', value: 32000, color: '#3BE2E9' },
  { name: 'Starter Plans', value: 18000, color: '#939393' },
  { name: 'Credit Purchases', value: 25000, color: '#4ade80' },
  { name: 'One-time Assessments', value: 8900, color: '#f59e0b' },
];

const topCustomers = [
  { name: 'TechCorp Solutions', revenue: 12500, growth: 15.2, assessments: 145 },
  { name: 'SecurePoint Inc', revenue: 10200, growth: 8.7, assessments: 98 },
  { name: 'DataGuard Systems', revenue: 8900, growth: -2.3, assessments: 76 },
  { name: 'CloudSafe Pro', revenue: 7600, growth: 22.1, assessments: 64 },
  { name: 'ComplianceHub', revenue: 6800, growth: 12.5, assessments: 52 },
];

const RevenueReports = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const avgMonthlyRevenue = totalRevenue / revenueData.length;
  const lastMonthGrowth = (
    ((revenueData[5].revenue - revenueData[4].revenue) / revenueData[4].revenue) *
    100
  ).toFixed(1);
  const totalCustomers = 234;
  const totalAssessments = 892;

  const handleExportPDF = () => {
    setIsGenerating(true);
    // Simulate PDF generation
    setTimeout(() => {
      setIsGenerating(false);
      // In a real app, this would trigger PDF download
      console.log('Downloading PDF report...');
    }, 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Revenue Reports</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive financial analytics and reporting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleExportPDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />+{lastMonthGrowth}%
                </span>{' '}
                from last month
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Avg</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Math.round(avgMonthlyRevenue).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">6-month average</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">+18 new this month</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssessments}</div>
              <p className="text-xs text-muted-foreground">Completed this period</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue breakdown by source</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3BE2E9"
                  strokeWidth={3}
                  dot={{ fill: '#3BE2E9' }}
                  name="Total Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="subscriptions"
                  stroke="#F345B8"
                  strokeWidth={2}
                  dot={{ fill: '#F345B8' }}
                  name="Subscriptions"
                />
                <Line
                  type="monotone"
                  dataKey="credits"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ fill: '#4ade80' }}
                  name="Credit Sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Product */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Product</CardTitle>
              <CardDescription>Distribution across different offerings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueByProduct}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueByProduct.map((entry, index) => (
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
                {revenueByProduct.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Highest revenue generating organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer, index) => (
                    <TableRow key={customer.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.assessments} assessments
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${customer.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center ${
                            customer.growth > 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {customer.growth > 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(customer.growth)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Report Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detailed Revenue Breakdown</CardTitle>
                <CardDescription>Transaction-level revenue details</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="subscriptions">Subscriptions</SelectItem>
                    <SelectItem value="credits">Credits</SelectItem>
                    <SelectItem value="assessments">Assessments</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    date: '2024-03-20',
                    org: 'TechCorp Solutions',
                    type: 'subscription',
                    description: 'Enterprise Plan - Monthly',
                    amount: 999,
                    status: 'paid',
                  },
                  {
                    date: '2024-03-20',
                    org: 'SecurePoint Inc',
                    type: 'credits',
                    description: '500 Credits Purchase',
                    amount: 450,
                    status: 'paid',
                  },
                  {
                    date: '2024-03-19',
                    org: 'StartupXYZ',
                    type: 'assessment',
                    description: 'SOC 2 Assessment',
                    amount: 50,
                    status: 'paid',
                  },
                  {
                    date: '2024-03-19',
                    org: 'DataGuard Systems',
                    type: 'subscription',
                    description: 'Professional Plan - Monthly',
                    amount: 499,
                    status: 'pending',
                  },
                ].map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {transaction.date}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.org}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-right font-medium">${transaction.amount}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          transaction.status === 'paid'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RevenueReports;
