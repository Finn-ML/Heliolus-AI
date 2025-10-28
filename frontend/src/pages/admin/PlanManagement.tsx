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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
} from '@/hooks/useAdminPlans';
import { Plan, CreatePlanData, UpdatePlanData } from '@/lib/api';
import {
  Package,
  Plus,
  Edit,
  Trash,
  MoreVertical,
  DollarSign,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const PlanManagement = () => {
  const { data, isLoading, error } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePlanData>({
    slug: '',
    name: '',
    description: '',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'USD',
    monthlyCredits: 0,
    assessmentCredits: 0,
    maxAssessments: 0,
    maxUsers: 1,
    features: [],
    trialDays: 0,
    isActive: true,
    isPublic: true,
    displayOrder: 0,
    createInStripe: true,
  });
  const [featuresInput, setFeaturesInput] = useState('');

  const handleAddPlan = () => {
    setEditingPlan(null);
    setFormData({
      slug: '',
      name: '',
      description: '',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'USD',
      monthlyCredits: 0,
      assessmentCredits: 0,
      maxAssessments: 0,
      maxUsers: 1,
      features: [],
      trialDays: 0,
      isActive: true,
      isPublic: true,
      displayOrder: 0,
      createInStripe: true,
    });
    setFeaturesInput('');
    setIsDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      slug: plan.slug,
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: Number(plan.monthlyPrice),
      annualPrice: Number(plan.annualPrice),
      currency: plan.currency,
      monthlyCredits: plan.monthlyCredits,
      assessmentCredits: plan.assessmentCredits,
      maxAssessments: plan.maxAssessments,
      maxUsers: plan.maxUsers,
      features: plan.features || [],
      trialDays: plan.trialDays,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      displayOrder: plan.displayOrder,
      createInStripe: false, // Don't create in Stripe when editing
    });
    setFeaturesInput((plan.features || []).join('\n'));
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    const features = featuresInput
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const dataToSubmit = {
      ...formData,
      features,
    };

    try {
      if (editingPlan) {
        const updateData: UpdatePlanData = {
          name: dataToSubmit.name,
          description: dataToSubmit.description,
          monthlyPrice: dataToSubmit.monthlyPrice,
          annualPrice: dataToSubmit.annualPrice,
          monthlyCredits: dataToSubmit.monthlyCredits,
          assessmentCredits: dataToSubmit.assessmentCredits,
          maxAssessments: dataToSubmit.maxAssessments,
          maxUsers: dataToSubmit.maxUsers,
          features: dataToSubmit.features,
          trialDays: dataToSubmit.trialDays,
          isActive: dataToSubmit.isActive,
          isPublic: dataToSubmit.isPublic,
          displayOrder: dataToSubmit.displayOrder,
          syncToStripe: formData.createInStripe,
        };
        await updatePlan.mutateAsync({ id: editingPlan.id, data: updateData });
      } else {
        await createPlan.mutateAsync(dataToSubmit);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await deletePlan.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  const plans = data || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plan Management</h1>
            <p className="text-muted-foreground">
              Manage subscription plans and pricing
            </p>
          </div>
          <Button onClick={handleAddPlan}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.filter(p => p.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Public Plans</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.filter(p => p.isPublic).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>
              Manage all subscription plans and Stripe integration
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
                <AlertDescription>Failed to load plans</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stripe</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No plans found. Create your first plan to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map(plan => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {plan.slug}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <DollarSign className="inline w-3 h-3" />
                              {plan.monthlyPrice}/mo
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <DollarSign className="inline w-3 h-3" />
                              {plan.annualPrice}/yr
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <Zap className="inline w-3 h-3 mr-1" />
                              {plan.monthlyCredits} monthly
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {plan.assessmentCredits} assessment
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {plan.maxAssessments} assessments
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {plan.maxUsers} users
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                              {plan.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {plan.isPublic && <Badge variant="outline">Public</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.stripeProductId ? (
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="text-muted-foreground">Synced</span>
                              </div>
                              <a
                                href={`https://dashboard.stripe.com/products/${plan.stripeProductId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View
                              </a>
                            </div>
                          ) : (
                            <Badge variant="secondary">Not synced</Badge>
                          )}
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
                              <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmId(plan.id)}
                                className="text-red-600"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete Plan
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? 'Update plan details and sync with Stripe'
                  : 'Create a new subscription plan with optional Stripe integration'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toUpperCase() })}
                      placeholder="FREE, PREMIUM, ENTERPRISE"
                      disabled={!!editingPlan}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Premium Plan"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Plan description..."
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold">Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPrice">Monthly Price ($) *</Label>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      step="0.01"
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualPrice">Annual Price ($) *</Label>
                    <Input
                      id="annualPrice"
                      type="number"
                      step="0.01"
                      value={formData.annualPrice}
                      onChange={(e) => setFormData({ ...formData, annualPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      disabled={!!editingPlan}
                    />
                  </div>
                </div>
              </div>

              {/* Credits and Limits */}
              <div className="space-y-4">
                <h3 className="font-semibold">Credits & Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyCredits">Monthly Credits</Label>
                    <Input
                      id="monthlyCredits"
                      type="number"
                      value={formData.monthlyCredits}
                      onChange={(e) => setFormData({ ...formData, monthlyCredits: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessmentCredits">Assessment Credits</Label>
                    <Input
                      id="assessmentCredits"
                      type="number"
                      value={formData.assessmentCredits}
                      onChange={(e) => setFormData({ ...formData, assessmentCredits: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAssessments">Max Assessments</Label>
                    <Input
                      id="maxAssessments"
                      type="number"
                      value={formData.maxAssessments}
                      onChange={(e) => setFormData({ ...formData, maxAssessments: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Max Users</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="AI-powered assessments&#10;Priority support&#10;Custom branding"
                  rows={4}
                />
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trialDays">Trial Days</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      value={formData.trialDays}
                      onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
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
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                    />
                    <Label htmlFor="isPublic">Public</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="createInStripe"
                      checked={formData.createInStripe}
                      onCheckedChange={(checked) => setFormData({ ...formData, createInStripe: checked })}
                    />
                    <Label htmlFor="createInStripe">
                      {editingPlan ? 'Sync to Stripe' : 'Create in Stripe'}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan} disabled={createPlan.isPending || updatePlan.isPending}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Plan</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this plan? This will deactivate the plan and
                remove it from Stripe if applicable.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDeletePlan(deleteConfirmId)}
                disabled={deletePlan.isPending}
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

export default PlanManagement;
