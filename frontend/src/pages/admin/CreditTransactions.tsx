import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Filter,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  time: string;
  organization: string;
  type: 'purchase' | 'usage' | 'refund' | 'adjustment' | 'bonus';
  description: string;
  amount: number;
  balance: number;
  assessmentId?: string;
  invoiceId?: string;
  status: 'completed' | 'pending' | 'failed';
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    transactionId: 'TXN-2024-001',
    date: '2024-03-20',
    time: '14:30:00',
    organization: 'TechCorp Solutions',
    type: 'purchase',
    description: 'Professional Plan - 500 Credits',
    amount: 500,
    balance: 500,
    invoiceId: 'INV-2024-001',
    status: 'completed',
  },
  {
    id: '2',
    transactionId: 'TXN-2024-002',
    date: '2024-03-20',
    time: '15:45:00',
    organization: 'TechCorp Solutions',
    type: 'usage',
    description: 'SOC 2 Assessment - Complete',
    amount: -50,
    balance: 450,
    assessmentId: 'ASM-001',
    status: 'completed',
  },
  {
    id: '3',
    transactionId: 'TXN-2024-003',
    date: '2024-03-19',
    time: '09:15:00',
    organization: 'SecurePoint Inc',
    type: 'purchase',
    description: 'Enterprise Plan - 1000 Credits',
    amount: 1000,
    balance: 1000,
    invoiceId: 'INV-2024-002',
    status: 'completed',
  },
  {
    id: '4',
    transactionId: 'TXN-2024-004',
    date: '2024-03-19',
    time: '11:30:00',
    organization: 'SecurePoint Inc',
    type: 'usage',
    description: 'ISO 27001 Assessment - In Progress',
    amount: -75,
    balance: 925,
    assessmentId: 'ASM-002',
    status: 'pending',
  },
  {
    id: '5',
    transactionId: 'TXN-2024-005',
    date: '2024-03-18',
    time: '16:22:00',
    organization: 'StartupXYZ',
    type: 'bonus',
    description: 'Welcome Bonus Credits',
    amount: 25,
    balance: 125,
    status: 'completed',
  },
  {
    id: '6',
    transactionId: 'TXN-2024-006',
    date: '2024-03-18',
    time: '17:00:00',
    organization: 'StartupXYZ',
    type: 'refund',
    description: 'Refund - Duplicate charge',
    amount: 50,
    balance: 175,
    invoiceId: 'INV-2024-003',
    status: 'completed',
  },
  {
    id: '7',
    transactionId: 'TXN-2024-007',
    date: '2024-03-17',
    time: '10:00:00',
    organization: 'FreeUser Corp',
    type: 'adjustment',
    description: 'Manual adjustment - Support ticket #123',
    amount: 10,
    balance: 10,
    status: 'completed',
  },
];

const CreditTransactions = () => {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalCreditsAdded = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCreditsUsed = Math.abs(
    transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-3 w-3" />;
      case 'usage':
        return <FileText className="h-3 w-3" />;
      case 'refund':
        return <ArrowDownRight className="h-3 w-3" />;
      case 'adjustment':
        return <Receipt className="h-3 w-3" />;
      case 'bonus':
        return <ArrowUpRight className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-blue-500/20 text-blue-500';
      case 'usage':
        return 'bg-orange-500/20 text-orange-500';
      case 'refund':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'adjustment':
        return 'bg-purple-500/20 text-purple-500';
      case 'bonus':
        return 'bg-green-500/20 text-green-500';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      default:
        return '';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Credit Transactions</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all credit transactions across organizations
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Credits Added</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                +{totalCreditsAdded.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                Purchases & adjustments
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                -{totalCreditsUsed.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 mr-1" />
                Assessment usage
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.filter(t => t.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
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
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">{transaction.transactionId}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {transaction.date}
                        </div>
                        <div className="text-xs text-muted-foreground">{transaction.time}</div>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.organization}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(transaction.type)}>
                        {getTypeIcon(transaction.type)}
                        <span className="ml-1">{transaction.type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{transaction.description}</p>
                        {transaction.assessmentId && (
                          <p className="text-xs text-muted-foreground">
                            Assessment: {transaction.assessmentId}
                          </p>
                        )}
                        {transaction.invoiceId && (
                          <p className="text-xs text-muted-foreground">
                            Invoice: {transaction.invoiceId}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={transaction.amount > 0 ? 'text-green-500' : 'text-orange-500'}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{transaction.balance}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
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

export default CreditTransactions;
