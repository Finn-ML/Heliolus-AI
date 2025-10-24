import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Coins, Clock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';

interface CreditManagementPanelProps {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GrantCreditsForm {
  amount: string;
  reason: string;
}

export function CreditManagementPanel({ user, open, onOpenChange }: CreditManagementPanelProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GrantCreditsForm>();

  // Fetch credit history
  const { data: creditHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin', 'credits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await fetch(`/v1/admin/users/${user.id}/credits`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credit history');
      }

      return response.json();
    },
    enabled: !!user?.id && open,
  });

  // Grant credits mutation
  const grantCreditsMutation = useMutation({
    mutationFn: async (data: GrantCreditsForm) => {
      if (!user?.id) throw new Error('No user selected');

      const response = await fetch(`/v1/admin/users/${user.id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: parseInt(data.amount),
          reason: data.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to grant credits');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Credits Granted',
        description: 'Credits have been successfully added to the user account.',
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'credits', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

      // Reset form
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Grant Credits',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: GrantCreditsForm) => {
    grantCreditsMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'GRANT':
      case 'PURCHASE':
      case 'ALLOCATION':
        return <ArrowUpCircle className="h-4 w-4 text-green-400" />;
      case 'DEDUCTION':
      case 'USAGE':
        return <ArrowDownCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Coins className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'GRANT':
        return 'default';
      case 'PURCHASE':
        return 'secondary';
      case 'ALLOCATION':
        return 'outline';
      case 'DEDUCTION':
      case 'USAGE':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (!user) return null;

  const transactions = creditHistory?.data || [];
  const currentBalance = transactions.length > 0 ? transactions[0].balance : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            Manage Credits
          </SheetTitle>
          <SheetDescription>
            {user.firstName} {user.lastName} ({user.email})
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Current Credit Balance</span>
              <span className="text-2xl font-bold text-yellow-400">{currentBalance}</span>
            </div>
          </div>

          {/* Grant Credits Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (credits)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 1, message: 'Amount must be at least 1' },
                })}
              />
              {errors.amount && (
                <p className="text-sm text-red-400">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for granting credits"
                rows={3}
                {...register('reason', {
                  required: 'Reason is required',
                  minLength: { value: 1, message: 'Reason cannot be empty' },
                })}
              />
              {errors.reason && (
                <p className="text-sm text-red-400">{errors.reason.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={grantCreditsMutation.isPending}
            >
              {grantCreditsMutation.isPending ? 'Granting...' : 'Grant Credits'}
            </Button>
          </form>

          {/* Transaction History */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Transaction History (Last 10)
            </h3>

            {isLoadingHistory ? (
              <div className="text-center py-8 text-gray-400">Loading history...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No transactions yet</div>
            ) : (
              <div className="border border-gray-800 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-xs">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <Badge variant={getTransactionBadgeVariant(transaction.type) as any}>
                              {transaction.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {transaction.balance}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          {transactions.length > 0 && (
            <div className="text-xs text-gray-400 space-y-1">
              <p>Last updated: {formatDate(transactions[0].createdAt)}</p>
              <p>Showing {Math.min(10, transactions.length)} of {transactions.length} total transactions</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
