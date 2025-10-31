import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Crown,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Pause,
  Play,
  Ban,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { adminSubscriptionsApi } from '@/lib/api';

interface Subscription {
  id: string;
  organizationName: string;
  organizationId: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  startDate: string;
  nextBillingDate: string;
  amount: number;
  interval: 'monthly' | 'yearly';
  credits: {
    included: number;
    used: number;
    remaining: number;
  };
  paymentMethod: {
    type: string;
    last4: string;
  };
}

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'pause' | 'cancel' | 'resume'>('pause');

  // Fetch subscriptions from API
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await adminSubscriptionsApi.getSubscriptions();

        if (response.success && response.data) {
          // Format the dates for display
          const formattedSubscriptions = response.data.map((sub: any) => ({
            ...sub,
            startDate: new Date(sub.startDate).toISOString().split('T')[0],
            nextBillingDate: sub.nextBillingDate
              ? new Date(sub.nextBillingDate).toISOString().split('T')[0]
              : '-',
          }));
          setSubscriptions(formattedSubscriptions);
        }
      } catch (err: any) {
        console.error('Failed to fetch subscriptions:', err);
        setError(err.message || 'Failed to load subscriptions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch =
      sub.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.organizationId && sub.organizationId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || sub.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesPlan = filterPlan === 'all' || sub.plan.toLowerCase() === filterPlan.toLowerCase();

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate metrics
  const activeSubscriptions = subscriptions.filter(s => s.status.toLowerCase() === 'active').length;
  const monthlyRecurringRevenue = subscriptions
    .filter(s => s.status.toLowerCase() === 'active')
    .reduce((sum, s) => sum + (s.interval.toLowerCase() === 'annual' || s.interval.toLowerCase() === 'yearly' ? s.amount / 12 : s.amount), 0);
  const churnedThisMonth = subscriptions.filter(s => s.status.toLowerCase() === 'canceled' || s.status.toLowerCase() === 'cancelled').length;
  const averageRevenue = activeSubscriptions > 0 ? monthlyRecurringRevenue / activeSubscriptions : 0;

  const handleSubscriptionAction = (
    subscription: Subscription,
    action: 'pause' | 'cancel' | 'resume'
  ) => {
    setSelectedSubscription(subscription);
    setActionType(action);
    setShowActionDialog(true);
  };

  const confirmAction = () => {
    if (selectedSubscription) {
      setSubscriptions(
        subscriptions.map(sub => {
          if (sub.id === selectedSubscription.id) {
            if (actionType === 'cancel') {
              return { ...sub, status: 'cancelled' };
            } else if (actionType === 'pause') {
              return { ...sub, status: 'paused' };
            } else if (actionType === 'resume') {
              return { ...sub, status: 'active' };
            }
          }
          return sub;
        })
      );
    }
    setShowActionDialog(false);
    setSelectedSubscription(null);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-500';
      case 'professional':
        return 'bg-blue-500/20 text-blue-500';
      case 'starter':
        return 'bg-cyan-500/20 text-cyan-500';
      case 'free':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'past_due':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'paused':
        return <Pause className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Subscriptions</h1>
            <p className="text-muted-foreground mt-2">Manage active subscriptions and billing</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading subscriptions...</span>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!isLoading && (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Crown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3
                </span>{' '}
                this month
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyRecurringRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Math.round(averageRevenue)}</div>
              <p className="text-xs text-muted-foreground">Per subscription</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{churnedThisMonth}</div>
              <p className="text-xs text-muted-foreground">Cancelled this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map(subscription => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{subscription.organizationName}</p>
                        <p className="text-xs text-muted-foreground">ID: {subscription.id}</p>
                        <p className="text-xs text-muted-foreground">
                          Since {subscription.startDate}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanColor(subscription.plan)}>
                        <Crown className="h-3 w-3 mr-1" />
                        {subscription.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(subscription.status)}
                        <span className="capitalize">{subscription.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {subscription.credits.remaining} / {subscription.credits.included}
                        </div>
                        <Progress
                          value={(subscription.credits.used / subscription.credits.included) * 100}
                          className="h-1.5"
                        />
                        <p className="text-xs text-muted-foreground">
                          {subscription.credits.used} used
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          ${subscription.amount}/
                          {subscription.interval === 'yearly' ? 'year' : 'mo'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {subscription.interval}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.paymentMethod.type !== '-' ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{subscription.paymentMethod.type}</p>
                            <p className="text-xs text-muted-foreground">
                              ****{subscription.paymentMethod.last4}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscription.nextBillingDate !== '-' ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {subscription.nextBillingDate}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Subscription
                          </DropdownMenuItem>
                          {subscription.status === 'active' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleSubscriptionAction(subscription, 'pause')}
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleSubscriptionAction(subscription, 'cancel')}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </DropdownMenuItem>
                            </>
                          )}
                          {subscription.status === 'paused' && (
                            <DropdownMenuItem
                              onClick={() => handleSubscriptionAction(subscription, 'resume')}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Resume Subscription
                            </DropdownMenuItem>
                          )}
                          {subscription.status === 'cancelled' && (
                            <DropdownMenuItem>
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </>
        )}

        {/* Action Confirmation Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'cancel' && 'Cancel Subscription'}
                {actionType === 'pause' && 'Pause Subscription'}
                {actionType === 'resume' && 'Resume Subscription'}
              </DialogTitle>
              <DialogDescription>{selectedSubscription?.organizationName}</DialogDescription>
            </DialogHeader>
            {selectedSubscription && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {actionType === 'cancel' && (
                    <>
                      This will immediately cancel the subscription. The organization will lose
                      access to premium features and their remaining{' '}
                      {selectedSubscription.credits.remaining} credits will be forfeited.
                    </>
                  )}
                  {actionType === 'pause' && (
                    <>
                      This will pause billing but maintain access to the service until the next
                      billing date ({selectedSubscription.nextBillingDate}). The subscription can be
                      resumed at any time.
                    </>
                  )}
                  {actionType === 'resume' && (
                    <>
                      This will resume the subscription and billing will continue on the regular
                      schedule. Next billing date will be recalculated.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                Cancel
              </Button>
              <Button
                variant={actionType === 'cancel' ? 'destructive' : 'default'}
                onClick={confirmAction}
              >
                {actionType === 'cancel' && 'Cancel Subscription'}
                {actionType === 'pause' && 'Pause Subscription'}
                {actionType === 'resume' && 'Resume Subscription'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Subscriptions;
