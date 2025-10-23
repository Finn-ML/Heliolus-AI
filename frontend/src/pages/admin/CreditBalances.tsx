import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  User,
  AlertCircle,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CreditBalance {
  id: string;
  organizationName: string;
  organizationId: string;
  balance: number;
  allocated: number;
  used: number;
  available: number;
  lastUpdated: string;
  status: 'active' | 'low' | 'depleted';
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
}

const mockBalances: CreditBalance[] = [
  {
    id: '1',
    organizationName: 'TechCorp Solutions',
    organizationId: 'org-001',
    balance: 500,
    allocated: 500,
    used: 350,
    available: 150,
    lastUpdated: '2024-03-20 14:30',
    status: 'active',
    plan: 'professional',
  },
  {
    id: '2',
    organizationName: 'SecurePoint Inc',
    organizationId: 'org-002',
    balance: 1000,
    allocated: 1000,
    used: 850,
    available: 150,
    lastUpdated: '2024-03-19 09:15',
    status: 'low',
    plan: 'enterprise',
  },
  {
    id: '3',
    organizationName: 'StartupXYZ',
    organizationId: 'org-003',
    balance: 100,
    allocated: 100,
    used: 100,
    available: 0,
    lastUpdated: '2024-03-18 16:22',
    status: 'depleted',
    plan: 'starter',
  },
  {
    id: '4',
    organizationName: 'FreeUser Corp',
    organizationId: 'org-004',
    balance: 10,
    allocated: 10,
    used: 5,
    available: 5,
    lastUpdated: '2024-03-20 10:00',
    status: 'active',
    plan: 'free',
  },
];

const CreditBalances = () => {
  const [balances, setBalances] = useState<CreditBalance[]>(mockBalances);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustmentOrg, setAdjustmentOrg] = useState<CreditBalance | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const filteredBalances = balances.filter(
    balance =>
      balance.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.organizationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCredits = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
  const totalAvailable = balances.reduce((sum, b) => sum + b.available, 0);

  const handleAdjustment = () => {
    if (adjustmentOrg && adjustmentAmount) {
      const amount = parseInt(adjustmentAmount);
      setBalances(
        balances.map(b => {
          if (b.id === adjustmentOrg.id) {
            const newBalance =
              adjustmentType === 'add' ? b.balance + amount : Math.max(0, b.balance - amount);
            const newAvailable = newBalance - b.used;
            return {
              ...b,
              balance: newBalance,
              allocated: newBalance,
              available: newAvailable,
              lastUpdated: new Date().toLocaleString(),
              status: newAvailable === 0 ? 'depleted' : newAvailable < 50 ? 'low' : 'active',
            };
          }
          return b;
        })
      );
      setAdjustmentOrg(null);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500';
      case 'low':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'depleted':
        return 'bg-red-500/20 text-red-500';
      default:
        return '';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-500';
      case 'professional':
        return 'bg-blue-500/20 text-blue-500';
      case 'starter':
        return 'bg-cyan-500/20 text-cyan-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Credit Balances</h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage organization credit balances
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCredits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {balances.length} organizations
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((totalUsed / totalCredits) * 100).toFixed(1)}% utilization
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
              <CreditCard className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAvailable.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {balances.filter(b => b.status === 'low' || b.status === 'depleted').length} orgs
                need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
        </Card>

        {/* Balances Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Credit Balances</CardTitle>
            <CardDescription>
              Click on an organization to adjust their credit balance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.map(balance => (
                  <TableRow key={balance.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{balance.organizationName}</p>
                          <p className="text-xs text-muted-foreground">{balance.organizationId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanColor(balance.plan)}>{balance.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(balance.status)}>
                        {balance.status === 'depleted' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {balance.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {balance.allocated.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">{balance.used.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          balance.available === 0 ? 'text-red-500 font-medium' : 'font-medium'
                        }
                      >
                        {balance.available.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {balance.lastUpdated}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setAdjustmentOrg(balance)}>
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Adjustment Dialog */}
        <Dialog open={!!adjustmentOrg} onOpenChange={() => setAdjustmentOrg(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Credit Balance</DialogTitle>
              <DialogDescription>
                Manually adjust credits for {adjustmentOrg?.organizationName}
              </DialogDescription>
            </DialogHeader>
            {adjustmentOrg && (
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{adjustmentOrg.balance}</span>
                    <span className="text-sm text-muted-foreground">credits</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <Select
                    value={adjustmentType}
                    onValueChange={(value: any) => setAdjustmentType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-500" />
                          Add Credits
                        </div>
                      </SelectItem>
                      <SelectItem value="subtract">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-500" />
                          Remove Credits
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={adjustmentAmount}
                    onChange={e => setAdjustmentAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason for Adjustment</Label>
                  <Textarea
                    placeholder="Enter reason for this adjustment..."
                    value={adjustmentReason}
                    onChange={e => setAdjustmentReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {adjustmentAmount && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">New Balance</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">
                        {adjustmentType === 'add'
                          ? adjustmentOrg.balance + parseInt(adjustmentAmount || '0')
                          : Math.max(0, adjustmentOrg.balance - parseInt(adjustmentAmount || '0'))}
                      </span>
                      <span className="text-sm text-muted-foreground">credits</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustmentOrg(null)}>
                Cancel
              </Button>
              <Button onClick={handleAdjustment} disabled={!adjustmentAmount || !adjustmentReason}>
                Apply Adjustment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default CreditBalances;
