import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { adminAnalyticsApi } from '@/lib/api';
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

const RevenueReports = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch revenue overview data
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['revenue-analytics', 'overview'],
    queryFn: () => adminAnalyticsApi.getRevenueAnalytics({ view: 'overview' }),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch revenue trends data
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['revenue-analytics', 'trends'],
    queryFn: () => adminAnalyticsApi.getRevenueAnalytics({ view: 'trends' }),
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch top customers data
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['revenue-analytics', 'customers'],
    queryFn: () => adminAnalyticsApi.getRevenueAnalytics({ view: 'customers' }),
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch revenue breakdown data
  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['revenue-analytics', 'breakdown'],
    queryFn: () => adminAnalyticsApi.getRevenueAnalytics({ view: 'breakdown' }),
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch revenue transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['revenue-analytics', 'transactions'],
    queryFn: () => adminAnalyticsApi.getRevenueTransactions({ limit: 100 }),
    refetchInterval: 5 * 60 * 1000,
  });

  // Transform trends data for chart (format month names)
  const revenueData = trends?.trends?.map((item: any) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    revenue: item.revenue,
    mrr: item.mrr,
    arr: item.arr,
    invoiceCount: item.invoiceCount,
  })) || [];

  // Transform breakdown data for pie chart
  const revenueByProduct = breakdown?.breakdown?.map((item: any, index: number) => ({
    name: `${item.plan} ${item.billingCycle}`,
    value: item.revenue,
    color: ['#F345B8', '#3BE2E9', '#939393', '#4ade80', '#f59e0b'][index % 5],
  })) || [];

  // Transform customers data for table
  const topCustomers = customers?.customers?.slice(0, 5).map((item: any) => ({
    name: item.organizationName,
    revenue: item.revenue,
    invoiceCount: item.invoiceCount,
  })) || [];

  // Loading state
  if (overviewLoading || trendsLoading || customersLoading || breakdownLoading || transactionsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading revenue analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (overviewError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500">Failed to load revenue data</p>
            <p className="text-sm text-muted-foreground mt-2">
              {overviewError instanceof Error ? overviewError.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Extract metrics from overview
  const totalRevenue = overview?.totalRevenue || 0;
  const revenueGrowth = overview?.revenueGrowth || 0;
  const currentMRR = overview?.currentMRR || 0;
  const payingCustomers = overview?.payingCustomers || 0;
  const activeSubscriptions = overview?.activeSubscriptions || 0;

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
              <div className="text-2xl font-bold">€{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">
                {revenueGrowth >= 0 ? (
                  <span className="text-green-500 inline-flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />+{revenueGrowth.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-red-500 inline-flex items-center">
                    <ArrowDownRight className="h-3 w-3 mr-1" />{revenueGrowth.toFixed(1)}%
                  </span>
                )}{' '}
                from previous period
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{currentMRR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paying Customers</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payingCustomers}</div>
              <p className="text-xs text-muted-foreground">Active organizations</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Current billing period</p>
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
                  name="Total Revenue (€)"
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#F345B8"
                  strokeWidth={2}
                  dot={{ fill: '#F345B8' }}
                  name="MRR (€)"
                />
                <Line
                  type="monotone"
                  dataKey="invoiceCount"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ fill: '#4ade80' }}
                  name="Invoice Count"
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
                    <TableHead className="text-right">Invoices</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.length > 0 ? (
                    topCustomers.map((customer, index) => (
                      <TableRow key={customer.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {customer.invoiceCount} invoices
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €{customer.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {customer.invoiceCount}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No customer data available
                      </TableCell>
                    </TableRow>
                  )}
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
                {transactions?.transactions && transactions.transactions.length > 0 ? (
                  transactions.transactions.map((transaction: any, index: number) => (
                    <TableRow key={transaction.id || index}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.organization}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right font-medium">
                        €{(transaction.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            transaction.status === 'paid'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }
                        >
                          {transaction.status ?? 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RevenueReports;
