import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  max_users: number;
  max_projects: number;
}

const MembershipPlanManager = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for small teams getting started',
      price: 29,
      billing_period: 'monthly',
      features: ['Up to 5 users', 'Basic risk assessment', 'Email support', 'Dashboard analytics'],
      is_active: true,
      is_popular: false,
      max_users: 5,
      max_projects: 3,
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Advanced features for growing businesses',
      price: 79,
      billing_period: 'monthly',
      features: [
        'Up to 25 users',
        'Advanced risk assessment',
        'Priority support',
        'Custom templates',
        'API access',
      ],
      is_active: true,
      is_popular: true,
      max_users: 25,
      max_projects: 10,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Full-featured solution for large organizations',
      price: 199,
      billing_period: 'monthly',
      features: [
        'Unlimited users',
        'Premium risk assessment',
        '24/7 support',
        'White-label options',
        'Custom integrations',
      ],
      is_active: true,
      is_popular: false,
      max_users: -1,
      max_projects: -1,
    },
  ]);

  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const handleSavePlan = () => {
    if (!editingPlan) return;

    if (editingPlan.id === 'new') {
      const newPlan = { ...editingPlan, id: Date.now().toString() };
      setPlans([...plans, newPlan]);
    } else {
      setPlans(plans.map(plan => (plan.id === editingPlan.id ? editingPlan : plan)));
    }

    setEditingPlan(null);
    setIsDialogOpen(false);
    toast({
      title: 'Plan saved',
      description: 'Membership plan has been updated successfully.',
    });
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(plans.filter(plan => plan.id !== planId));
    toast({
      title: 'Plan deleted',
      description: 'Membership plan has been removed.',
      variant: 'destructive',
    });
  };

  const handleAddFeature = () => {
    if (!editingPlan || !newFeature.trim()) return;

    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeature.trim()],
    });
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;

    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index),
    });
  };

  const startEditingPlan = (plan: MembershipPlan | null = null) => {
    if (plan) {
      setEditingPlan({ ...plan });
    } else {
      setEditingPlan({
        id: 'new',
        name: '',
        description: '',
        price: 0,
        billing_period: 'monthly',
        features: [],
        is_active: true,
        is_popular: false,
        max_users: 0,
        max_projects: 0,
      });
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Membership Plans</h3>
          <p className="text-sm text-muted-foreground">
            Configure and manage your subscription plans
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => startEditingPlan()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan?.id === 'new' ? 'Create New Plan' : 'Edit Plan'}
              </DialogTitle>
              <DialogDescription>Configure the details for this membership plan.</DialogDescription>
            </DialogHeader>

            {editingPlan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan-name">Plan Name</Label>
                    <Input
                      id="plan-name"
                      value={editingPlan.name}
                      onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      placeholder="Enter plan name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-price">Price ($)</Label>
                    <Input
                      id="plan-price"
                      type="number"
                      value={editingPlan.price}
                      onChange={e =>
                        setEditingPlan({ ...editingPlan, price: Number(e.target.value) })
                      }
                      placeholder="Enter price"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="plan-description">Description</Label>
                  <Textarea
                    id="plan-description"
                    value={editingPlan.description}
                    onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    placeholder="Enter plan description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-users">Max Users</Label>
                    <Input
                      id="max-users"
                      type="number"
                      value={editingPlan.max_users === -1 ? '' : editingPlan.max_users}
                      onChange={e =>
                        setEditingPlan({
                          ...editingPlan,
                          max_users: e.target.value === '' ? -1 : Number(e.target.value),
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-projects">Max Projects</Label>
                    <Input
                      id="max-projects"
                      type="number"
                      value={editingPlan.max_projects === -1 ? '' : editingPlan.max_projects}
                      onChange={e =>
                        setEditingPlan({
                          ...editingPlan,
                          max_projects: e.target.value === '' ? -1 : Number(e.target.value),
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={editingPlan.is_active}
                      onCheckedChange={checked =>
                        setEditingPlan({ ...editingPlan, is_active: checked })
                      }
                    />
                    <Label htmlFor="is-active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-popular"
                      checked={editingPlan.is_popular}
                      onCheckedChange={checked =>
                        setEditingPlan({ ...editingPlan, is_popular: checked })
                      }
                    />
                    <Label htmlFor="is-popular">Popular</Label>
                  </div>
                </div>

                <div>
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {editingPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 p-2 bg-muted rounded text-sm">{feature}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        placeholder="Add new feature"
                        onKeyPress={e => e.key === 'Enter' && handleAddFeature()}
                      />
                      <Button variant="outline" onClick={handleAddFeature}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePlan}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Plan
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="relative">
            {plan.is_popular && (
              <Badge className="absolute -top-2 left-4 bg-primary">Most Popular</Badge>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${plan.price}</div>
                  <div className="text-sm text-muted-foreground">/{plan.billing_period}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Limits</h4>
                  <div className="text-sm space-y-1">
                    <div>Users: {plan.max_users === -1 ? 'Unlimited' : plan.max_users}</div>
                    <div>
                      Projects: {plan.max_projects === -1 ? 'Unlimited' : plan.max_projects}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Features</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => startEditingPlan(plan)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MembershipPlanManager;
