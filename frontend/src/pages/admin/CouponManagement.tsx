import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from '@/hooks/useAdminCoupons';
import { usePlans } from '@/hooks/useAdminPlans';
import { Coupon, CreateCouponData, UpdateCouponData } from '@/lib/api';
import {
  Ticket,
  Plus,
  Edit,
  Trash,
  MoreVertical,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';

const CouponManagement = () => {
  const { data, isLoading, error } = useCoupons();
  const { data: plansData } = usePlans();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCouponData>({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    currency: 'USD',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    maxRedemptions: undefined,
    applicablePlans: [],
    minimumAmount: undefined,
    newCustomersOnly: false,
    durationInMonths: undefined,
    isActive: true,
    createInStripe: true,
  });

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      currency: 'USD',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      maxRedemptions: undefined,
      applicablePlans: [],
      minimumAmount: undefined,
      newCustomersOnly: false,
      durationInMonths: undefined,
      isActive: true,
      createInStripe: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name || '',
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      currency: coupon.currency,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      maxRedemptions: coupon.maxRedemptions || undefined,
      applicablePlans: coupon.applicablePlans || [],
      minimumAmount: coupon.minimumAmount ? Number(coupon.minimumAmount) : undefined,
      newCustomersOnly: coupon.newCustomersOnly,
      durationInMonths: coupon.durationInMonths || undefined,
      isActive: coupon.isActive,
      createInStripe: false,
    });
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = async () => {
    try {
      if (editingCoupon) {
        const updateData: UpdateCouponData = {
          name: formData.name,
          description: formData.description,
          validUntil: formData.validUntil || undefined,
          maxRedemptions: formData.maxRedemptions,
          isActive: formData.isActive,
        };
        await updateCoupon.mutateAsync({ id: editingCoupon.id, data: updateData });
      } else {
        const createData: CreateCouponData = {
          ...formData,
          validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : undefined,
          validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
        };
        await createCoupon.mutateAsync(createData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save coupon:', error);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteCoupon.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete coupon:', error);
    }
  };

  const coupons = data?.data || [];
  const plans = plansData?.data || [];

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue}%`;
    }
    return `$${coupon.discountValue}`;
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.validUntil) return false;
    return new Date(coupon.validUntil) < new Date();
  };

  const isRedemptionLimitReached = (coupon: Coupon) => {
    if (!coupon.maxRedemptions) return false;
    return coupon.timesRedeemed >= coupon.maxRedemptions;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coupon Management</h1>
            <p className="text-muted-foreground">
              Manage discount coupons for subscription checkout
            </p>
          </div>
          <Button onClick={handleAddCoupon}>
            <Plus className="w-4 h-4 mr-2" />
            Add Coupon
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coupons.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coupons.filter(c => c.isActive && !isExpired(c)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coupons.filter(c => isExpired(c)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coupons.reduce((sum, c) => sum + c.timesRedeemed, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Discount Coupons</CardTitle>
            <CardDescription>
              Manage all discount coupons and Stripe integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load coupons</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Restrictions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No coupons found. Create your first coupon to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map(coupon => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium font-mono">{coupon.code}</div>
                            {coupon.name && (
                              <div className="text-sm text-muted-foreground">{coupon.name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {coupon.discountType === 'PERCENTAGE' ? (
                              <Percent className="w-4 h-4 text-green-600" />
                            ) : (
                              <DollarSign className="w-4 h-4 text-blue-600" />
                            )}
                            <span className="font-medium">{formatDiscount(coupon)}</span>
                          </div>
                          {coupon.durationInMonths && (
                            <div className="text-xs text-muted-foreground">
                              {coupon.durationInMonths} months
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {coupon.validFrom && (
                              <div className="text-sm">
                                From: {format(new Date(coupon.validFrom), 'MMM d, yyyy')}
                              </div>
                            )}
                            {coupon.validUntil && (
                              <div className={`text-sm ${isExpired(coupon) ? 'text-red-600' : 'text-muted-foreground'}`}>
                                Until: {format(new Date(coupon.validUntil), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">
                              {coupon.timesRedeemed}
                              {coupon.maxRedemptions && ` / ${coupon.maxRedemptions}`}
                            </div>
                            {isRedemptionLimitReached(coupon) && (
                              <Badge variant="destructive" className="text-xs">Limit reached</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {coupon.newCustomersOnly && (
                              <Badge variant="outline" className="text-xs">New customers</Badge>
                            )}
                            {coupon.minimumAmount && (
                              <div className="text-xs text-muted-foreground">
                                Min: ${coupon.minimumAmount}
                              </div>
                            )}
                            {coupon.applicablePlans.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {coupon.applicablePlans.length} plan(s)
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!coupon.isActive ? (
                              <Badge variant="secondary">Inactive</Badge>
                            ) : isExpired(coupon) ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : isRedemptionLimitReached(coupon) ? (
                              <Badge variant="destructive">Full</Badge>
                            ) : (
                              <Badge variant="success">Active</Badge>
                            )}
                            {coupon.stripeCouponId && (
                              <a
                                href={`https://dashboard.stripe.com/coupons/${coupon.stripeCouponId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Coupon
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmId(coupon.id)}
                                className="text-red-600"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete Coupon
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
              <DialogDescription>
                {editingCoupon
                  ? 'Update coupon details (limited fields can be modified)'
                  : 'Create a new discount coupon with optional Stripe integration'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE20"
                      disabled={!!editingCoupon}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="20% Off Promotion"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Coupon description..."
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-4">
                <h3 className="font-semibold">Discount</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Type *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: 'PERCENTAGE' | 'FIXED_AMOUNT') =>
                        setFormData({ ...formData, discountType: value })
                      }
                      disabled={!!editingCoupon}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      disabled={!!editingCoupon}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durationInMonths">Duration (months)</Label>
                    <Input
                      id="durationInMonths"
                      type="number"
                      value={formData.durationInMonths || ''}
                      onChange={(e) => setFormData({ ...formData, durationInMonths: parseInt(e.target.value) || undefined })}
                      placeholder="Forever"
                      disabled={!!editingCoupon}
                    />
                  </div>
                </div>
              </div>

              {/* Validity */}
              <div className="space-y-4">
                <h3 className="font-semibold">Validity Period</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      disabled={!!editingCoupon}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Restrictions */}
              <div className="space-y-4">
                <h3 className="font-semibold">Restrictions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      value={formData.maxRedemptions || ''}
                      onChange={(e) => setFormData({ ...formData, maxRedemptions: parseInt(e.target.value) || undefined })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumAmount">Minimum Amount ($)</Label>
                    <Input
                      id="minimumAmount"
                      type="number"
                      step="0.01"
                      value={formData.minimumAmount || ''}
                      onChange={(e) => setFormData({ ...formData, minimumAmount: parseFloat(e.target.value) || undefined })}
                      placeholder="No minimum"
                      disabled={!!editingCoupon}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicablePlans">Applicable Plans</Label>
                  <Select
                    value={formData.applicablePlans.join(',')}
                    onValueChange={(value) =>
                      setFormData({ ...formData, applicablePlans: value ? value.split(',') : [] })
                    }
                    disabled={!!editingCoupon}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Plans</SelectItem>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.slug}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to apply to all plans
                  </p>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Settings</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="newCustomersOnly"
                      checked={formData.newCustomersOnly}
                      onCheckedChange={(checked) => setFormData({ ...formData, newCustomersOnly: checked })}
                      disabled={!!editingCoupon}
                    />
                    <Label htmlFor="newCustomersOnly">New Customers Only</Label>
                  </div>
                  {!editingCoupon && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="createInStripe"
                        checked={formData.createInStripe}
                        onCheckedChange={(checked) => setFormData({ ...formData, createInStripe: checked })}
                      />
                      <Label htmlFor="createInStripe">Create in Stripe</Label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCoupon} disabled={createCoupon.isPending || updateCoupon.isPending}>
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Coupon</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this coupon? This will deactivate the coupon and
                remove it from Stripe if applicable.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDeleteCoupon(deleteConfirmId)}
                disabled={deleteCoupon.isPending}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default CouponManagement;
