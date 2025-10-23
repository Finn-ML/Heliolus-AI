import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calculator,
  Save,
  Edit,
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle,
  Info,
  Percent,
} from 'lucide-react';

interface TemplateCost {
  id: string;
  templateName: string;
  framework: string;
  baseCost: number;
  aiCost: number;
  totalCost: number;
  usageCount: number;
  revenue: number;
  lastModified: string;
  status: 'active' | 'inactive';
  discount?: number;
}

const mockTemplateCosts: TemplateCost[] = [
  {
    id: '1',
    templateName: 'SOC 2 Type II Readiness',
    framework: 'SOC 2',
    baseCost: 40,
    aiCost: 10,
    totalCost: 50,
    usageCount: 145,
    revenue: 7250,
    lastModified: '2024-03-15',
    status: 'active',
  },
  {
    id: '2',
    templateName: 'ISO 27001 Compliance',
    framework: 'ISO 27001',
    baseCost: 60,
    aiCost: 15,
    totalCost: 75,
    usageCount: 89,
    revenue: 6675,
    lastModified: '2024-03-10',
    status: 'active',
  },
  {
    id: '3',
    templateName: 'HIPAA Security Rule',
    framework: 'HIPAA',
    baseCost: 50,
    aiCost: 10,
    totalCost: 60,
    usageCount: 67,
    revenue: 4020,
    lastModified: '2024-03-12',
    status: 'active',
  },
  {
    id: '4',
    templateName: 'GDPR Data Protection',
    framework: 'GDPR',
    baseCost: 35,
    aiCost: 10,
    totalCost: 45,
    usageCount: 102,
    revenue: 4590,
    lastModified: '2024-03-18',
    status: 'active',
  },
  {
    id: '5',
    templateName: 'PCI DSS Level 1',
    framework: 'PCI DSS',
    baseCost: 70,
    aiCost: 20,
    totalCost: 90,
    usageCount: 34,
    revenue: 3060,
    lastModified: '2024-03-05',
    status: 'active',
  },
  {
    id: '6',
    templateName: 'NIST Cybersecurity',
    framework: 'NIST',
    baseCost: 45,
    aiCost: 15,
    totalCost: 60,
    usageCount: 12,
    revenue: 720,
    lastModified: '2024-03-20',
    status: 'inactive',
  },
];

const TemplateCosts = () => {
  const [templateCosts, setTemplateCosts] = useState<TemplateCost[]>(mockTemplateCosts);
  const [editingTemplate, setEditingTemplate] = useState<TemplateCost | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [globalAdjustment, setGlobalAdjustment] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');

  const totalRevenue = templateCosts.reduce((sum, t) => sum + t.revenue, 0);
  const totalUsage = templateCosts.reduce((sum, t) => sum + t.usageCount, 0);
  const avgCost = templateCosts.reduce((sum, t) => sum + t.totalCost, 0) / templateCosts.length;

  const handleEditTemplate = (template: TemplateCost) => {
    setEditingTemplate({ ...template });
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplateCosts(
        templateCosts.map(t =>
          t.id === editingTemplate.id
            ? {
                ...editingTemplate,
                totalCost: editingTemplate.baseCost + editingTemplate.aiCost,
                lastModified: new Date().toISOString().split('T')[0],
              }
            : t
        )
      );
      setEditingTemplate(null);
    }
  };

  const handleBulkAdjustment = () => {
    const adjustment = parseFloat(globalAdjustment);
    if (!isNaN(adjustment)) {
      setTemplateCosts(
        templateCosts.map(t => {
          let newBaseCost = t.baseCost;
          if (adjustmentType === 'percentage') {
            newBaseCost = Math.round(t.baseCost * (1 + adjustment / 100));
          } else {
            newBaseCost = Math.max(0, t.baseCost + adjustment);
          }
          return {
            ...t,
            baseCost: newBaseCost,
            totalCost: newBaseCost + t.aiCost,
            lastModified: new Date().toISOString().split('T')[0],
          };
        })
      );
      setBulkEditMode(false);
      setGlobalAdjustment('');
    }
  };

  const toggleTemplateStatus = (id: string) => {
    setTemplateCosts(
      templateCosts.map(t =>
        t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t
      )
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Template Costs</h1>
            <p className="text-muted-foreground mt-2">
              Configure credit costs for assessment templates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setBulkEditMode(true)}>
              <Calculator className="h-4 w-4 mr-2" />
              Bulk Adjust
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ${totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">From all templates</p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsage}</div>
              <p className="text-xs text-muted-foreground">Assessments completed</p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgCost)}</div>
              <p className="text-xs text-muted-foreground">Credits per template</p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templateCosts.filter(t => t.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {templateCosts.filter(t => t.status === 'inactive').length} inactive
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Template costs determine how many credits are deducted when users complete assessments.
            Base cost covers the assessment itself, while AI cost covers intelligent analysis
            features.
          </AlertDescription>
        </Alert>

        {/* Template Costs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Template Pricing Configuration</CardTitle>
            <CardDescription>Click on a template to adjust individual pricing</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Base Cost</TableHead>
                  <TableHead className="text-right">AI Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templateCosts.map(template => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{template.templateName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.framework}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.status === 'active'}
                        onCheckedChange={() => toggleTemplateStatus(template.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {template.baseCost}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {template.aiCost}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 font-medium">
                        <DollarSign className="h-3 w-3" />
                        {template.totalCost}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        {template.usageCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-500">
                      ${template.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {template.lastModified}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Template Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Template Cost</DialogTitle>
              <DialogDescription>
                Adjust pricing for {editingTemplate?.templateName}
              </DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Base Cost (Credits)</Label>
                  <Input
                    type="number"
                    value={editingTemplate.baseCost}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        baseCost: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost for the assessment questions and basic analysis
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>AI Analysis Cost (Credits)</Label>
                  <Input
                    type="number"
                    value={editingTemplate.aiCost}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        aiCost: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional cost for AI-powered insights and recommendations
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Cost</span>
                    <span className="text-lg font-bold">
                      {editingTemplate.baseCost + editingTemplate.aiCost} credits
                    </span>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This template has been used {editingTemplate.usageCount} times. Changes will
                    only affect future assessments.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Adjustment Dialog */}
        <Dialog open={bulkEditMode} onOpenChange={setBulkEditMode}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Price Adjustment</DialogTitle>
              <DialogDescription>
                Apply a global adjustment to all template base costs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={adjustmentType === 'percentage' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('percentage')}
                  className="flex-1"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Percentage
                </Button>
                <Button
                  variant={adjustmentType === 'fixed' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('fixed')}
                  className="flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Fixed Amount
                </Button>
              </div>

              <div className="space-y-2">
                <Label>
                  {adjustmentType === 'percentage' ? 'Percentage Change' : 'Credit Adjustment'}
                </Label>
                <Input
                  type="number"
                  placeholder={
                    adjustmentType === 'percentage' ? 'e.g., 10 for +10%' : 'e.g., 5 for +5 credits'
                  }
                  value={globalAdjustment}
                  onChange={e => setGlobalAdjustment(e.target.value)}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This will adjust the base cost of all {templateCosts.length} templates.
                  {adjustmentType === 'percentage'
                    ? ' Enter a positive number to increase or negative to decrease prices.'
                    : ' Enter a positive number to add or negative to subtract credits.'}
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAdjustment}>Apply Adjustment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default TemplateCosts;
