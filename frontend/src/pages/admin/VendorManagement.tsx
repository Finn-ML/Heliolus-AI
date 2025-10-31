import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  Search,
  Plus,
  MoreVertical,
  Building2,
  Mail,
  Phone,
  Globe,
  Edit,
  Trash,
  Eye,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// Backend-aligned vendor data type
interface Vendor {
  id: string;
  userId?: string;
  companyName: string;
  website: string;
  logo?: string;
  description: string;
  shortDescription: string;
  categories: string[]; // VendorCategory enum values
  contactEmail: string;
  contactPhone?: string;
  contactName?: string;
  salesEmail?: string;
  featured: boolean;
  verified: boolean;
  rating?: number;
  reviewCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Extended vendor fields from database schema
  headquarters?: string;
  primaryProduct?: string;
  aiCapabilities?: string;
  deploymentOptions?: string;
  integrations?: string;
  dataCoverage?: string;
  awards?: string;
  customerSegments?: string;
  benefitsSnapshot?: string;
  maturityAssessment?: string;
  // Legacy fields for UI compatibility
  name?: string; // computed from companyName
  riskTags?: string[]; // alias for categories
}

// Mock data for fallback
const mockVendors: any[] = [
  {
    id: '1',
    name: 'SecurePoint Solutions',
    description: 'Enterprise-grade security compliance and risk management platform',
    status: 'APPROVED',
    riskTags: ['SOC 2', 'ISO 27001', 'HIPAA'],
    pricing: {
      model: 'subscription',
      startingPrice: 999,
      currency: 'USD',
    },
    deployment: 'cloud',
    contact: {
      email: 'sales@securepoint.com',
      phone: '+1-555-0123',
      website: 'https://securepoint.com',
      representative: 'John Smith',
    },
    metrics: {
      assessments: 145,
      clicks: 342,
      contacts: 45,
      conversionRate: 13.2,
    },
  },
  {
    id: '2',
    name: 'ComplianceHub Pro',
    description: 'Automated compliance management for growing businesses',
    status: 'APPROVED',
    riskTags: ['GDPR', 'CCPA', 'SOC 2'],
    pricing: {
      model: 'usage-based',
      startingPrice: 299,
      currency: 'USD',
    },
    deployment: 'hybrid',
    contact: {
      email: 'info@compliancehub.io',
      phone: '+1-555-0124',
      website: 'https://compliancehub.io',
      representative: 'Sarah Johnson',
    },
    metrics: {
      assessments: 98,
      clicks: 289,
      contacts: 38,
      conversionRate: 13.1,
    },
  },
];


// Map UI categories to backend enum values
const mapUICategoriesToBackendEnum = (uiCategories: string[]): string[] => {
  const validEnums = [
    'KYC_AML',
    'TRANSACTION_MONITORING',
    'SANCTIONS_SCREENING',
    'TRADE_SURVEILLANCE',
    'RISK_ASSESSMENT',
    'COMPLIANCE_TRAINING',
    'REGULATORY_REPORTING',
    'DATA_GOVERNANCE',
  ];

  const categoryMap: Record<string, string> = {
    AML: 'KYC_AML',
    KYC: 'KYC_AML',
    'KYC/AML': 'KYC_AML',
    'Transaction Monitoring': 'TRANSACTION_MONITORING',
    Sanctions: 'SANCTIONS_SCREENING',
    'Sanctions Screening': 'SANCTIONS_SCREENING',
    Trade: 'TRADE_SURVEILLANCE',
    'Trade Surveillance': 'TRADE_SURVEILLANCE',
    'Risk Assessment': 'RISK_ASSESSMENT',
    'Risk Management': 'RISK_ASSESSMENT',
    Training: 'COMPLIANCE_TRAINING',
    'Compliance Training': 'COMPLIANCE_TRAINING',
    Reporting: 'REGULATORY_REPORTING',
    'Regulatory Reporting': 'REGULATORY_REPORTING',
    'Data Governance': 'DATA_GOVERNANCE',
    'Data Privacy': 'DATA_GOVERNANCE',
  };

  return uiCategories
    .map(category => {
      // If it's already a valid backend enum, pass it through
      if (validEnums.includes(category)) {
        return category;
      }
      // Otherwise map it
      return categoryMap[category] || 'RISK_ASSESSMENT';
    })
    .filter(Boolean);
};

// Memoized VendorForm component to prevent unnecessary re-renders
const VendorForm = memo(
  ({ formData, onFormDataChange }: { formData: any; onFormDataChange: (data: any) => void }) => {
    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-3">Basic Information</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName || ''}
                  onChange={e => onFormDataChange({ ...formData, companyName: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => onFormDataChange({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={e => onFormDataChange({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headquarters">Headquarters</Label>
                <Input
                  id="headquarters"
                  value={formData.headquarters || ''}
                  onChange={e => onFormDataChange({ ...formData, headquarters: e.target.value })}
                  placeholder="e.g., London, UK"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo || ''}
                onChange={e => onFormDataChange({ ...formData, logo: e.target.value })}
                placeholder="https://company.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Product & Capabilities */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-3">Product & Capabilities</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="primaryProduct">Primary Product</Label>
              <Input
                id="primaryProduct"
                value={formData.primaryProduct || ''}
                onChange={e => onFormDataChange({ ...formData, primaryProduct: e.target.value })}
                placeholder="e.g., Iris, Continuum Platform"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiCapabilities">AI Capabilities</Label>
              <Textarea
                id="aiCapabilities"
                value={formData.aiCapabilities || ''}
                onChange={e => onFormDataChange({ ...formData, aiCapabilities: e.target.value })}
                placeholder="e.g., Agentic AI + NLP for alert adjudication; explainable decisions"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deploymentOptions">Deployment Options</Label>
              <Input
                id="deploymentOptions"
                value={formData.deploymentOptions || ''}
                onChange={e => onFormDataChange({ ...formData, deploymentOptions: e.target.value })}
                placeholder="e.g., SaaS; API; on-prem (enterprise)"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-3">Business Information</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="integrations">Integrations</Label>
              <Textarea
                id="integrations"
                value={formData.integrations || ''}
                onChange={e => onFormDataChange({ ...formData, integrations: e.target.value })}
                placeholder="e.g., Core banking / case mgmt (various)"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataCoverage">Data Coverage</Label>
              <Textarea
                id="dataCoverage"
                value={formData.dataCoverage || ''}
                onChange={e => onFormDataChange({ ...formData, dataCoverage: e.target.value })}
                placeholder="e.g., Sanctions, PEP/adverse media (via partners)"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerSegments">Customer Segments</Label>
              <Input
                id="customerSegments"
                value={formData.customerSegments || ''}
                onChange={e => onFormDataChange({ ...formData, customerSegments: e.target.value })}
                placeholder="e.g., Banks; global FIs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maturityAssessment">Maturity Assessment</Label>
              <Input
                id="maturityAssessment"
                value={formData.maturityAssessment || ''}
                onChange={e =>
                  onFormDataChange({ ...formData, maturityAssessment: e.target.value })
                }
                placeholder="e.g., Scale-up / Enterprise"
              />
            </div>
          </div>
        </div>

        {/* Marketing & Awards */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-3">Marketing & Awards</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="benefitsSnapshot">Benefits Snapshot</Label>
              <Textarea
                id="benefitsSnapshot"
                value={formData.benefitsSnapshot || ''}
                onChange={e => onFormDataChange({ ...formData, benefitsSnapshot: e.target.value })}
                placeholder="e.g., Cut false positives and investigation time with explainable decisions"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awards">Awards & Trust Signals</Label>
              <Textarea
                id="awards"
                value={formData.awards || ''}
                onChange={e => onFormDataChange({ ...formData, awards: e.target.value })}
                placeholder="e.g., Used by global banks; focus on explainability"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-3">Categories</h4>
          <div className="space-y-2">
            <Label>Solution Categories</Label>
            <Input
              placeholder="Enter categories separated by commas (e.g., KYC_AML, SANCTIONS_SCREENING)"
              value={formData.categories?.join(', ') || ''}
              onChange={e =>
                onFormDataChange({
                  ...formData,
                  categories: e.target.value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag),
                })
              }
            />
          </div>
        </div>

        <div className="border-t pt-3 space-y-3">
          <h4 className="font-medium">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail || ''}
                onChange={e => onFormDataChange({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone || ''}
                onChange={e => onFormDataChange({ ...formData, contactPhone: e.target.value })}
                placeholder="+1-555-0123"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName || ''}
                onChange={e => onFormDataChange({ ...formData, contactName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesEmail">Sales Email</Label>
              <Input
                id="salesEmail"
                type="email"
                value={formData.salesEmail || ''}
                onChange={e => onFormDataChange({ ...formData, salesEmail: e.target.value })}
                placeholder="sales@company.com"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="verified"
              checked={formData.verified || false}
              onChange={e => onFormDataChange({ ...formData, verified: e.target.checked })}
            />
            <Label htmlFor="verified">Verified Vendor</Label>
          </div>
        </div>
      </div>
    );
  }
);

const VendorManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendors from API
  const {
    data: vendorsResponse,
    isLoading: isLoadingVendors,
    isError: isVendorsError,
  } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(
        '/v1/admin/vendors?page=1&limit=100&sortBy=createdAt&sortOrder=desc',
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      // Handle 401 by returning null (will fall back to mock data)
      if (response.status === 401) {
        return null;
      }

      // For other errors, throw to trigger error state
      if (!response.ok) {
        throw new Error(`Failed to fetch vendors: ${response.status}`);
      }

      return response.json();
    },
  });

  // Transform API data to match backend schema
  const vendors =
    vendorsResponse?.data?.data?.map((vendor: any) => ({
      id: vendor.id,
      userId: vendor.userId,
      companyName: vendor.companyName,
      website: vendor.website || '',
      logo: vendor.logo,
      description: vendor.benefitsSnapshot || vendor.primaryProduct || 'No description available',
      shortDescription:
        vendor.benefitsSnapshot?.substring(0, 150) ||
        vendor.primaryProduct?.substring(0, 150) ||
        'No description available',
      categories: vendor.categories || [],
      // Extended vendor details - ALL fields from database schema
      headquarters: vendor.headquarters || '',
      primaryProduct: vendor.primaryProduct || '',
      aiCapabilities: vendor.aiCapabilities || '',
      deploymentOptions: vendor.deploymentOptions || '',
      integrations: vendor.integrations || '',
      dataCoverage: vendor.dataCoverage || '',
      awards: vendor.awards || '',
      customerSegments: vendor.customerSegments || '',
      benefitsSnapshot: vendor.benefitsSnapshot || '',
      maturityAssessment: vendor.maturityAssessment || '',
      contactEmail: vendor.contactEmail || 'contact@vendor.com',
      contactPhone: vendor.contactPhone || '',
      contactName: vendor.contactName || '',
      salesEmail: vendor.salesEmail || '',
      featured: vendor.featured || false,
      verified: vendor.verified || false,
      rating: vendor.rating || 0,
      reviewCount: vendor.reviewCount || 0,
      status: vendor.status || 'PENDING',
      approvedAt: vendor.approvedAt,
      approvedBy: vendor.approvedBy,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      // Legacy aliases for UI compatibility
      name: vendor.companyName,
      riskTags: vendor.categories || [],
    })) || [];

  // Only use mock data when explicitly unauthenticated (not during loading)
  const fallbackVendors =
    !isLoadingVendors && vendorsResponse === null
      ? mockVendors.map(mockVendor => ({
          // Convert mock data to new format
          id: mockVendor.id,
          companyName: mockVendor.name,
          website: mockVendor.contact?.website || '',
          description: mockVendor.description,
          shortDescription: mockVendor.description.substring(0, 100) + '...',
          categories: mockVendor.riskTags || [],
          contactEmail: mockVendor.contact?.email || 'contact@vendor.com',
          contactPhone: mockVendor.contact?.phone,
          contactName: mockVendor.contact?.representative,
          salesEmail: mockVendor.contact?.email,
          featured: mockVendor.status === 'APPROVED',
          verified: mockVendor.status === 'APPROVED',
          rating: Math.random() * 5,
          reviewCount: mockVendor.metrics?.assessments || 0,
          status:
            mockVendor.status === 'APPROVED'
              ? 'APPROVED'
              : ('PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED'),
          name: mockVendor.name,
          riskTags: mockVendor.riskTags || [],
        }))
      : [];

  const displayVendors = vendors.length > 0 ? vendors : fallbackVendors;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    vendorId: string;
    vendorName: string;
  }>({
    isOpen: false,
    vendorId: '',
    vendorName: '',
  });

  // Bulk upload state
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll position preservation for edit dialog
  const editDialogScrollRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef<number>(0);

  // Vendor details dialog state
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Vendor>>({
    companyName: '',
    website: '',
    logo: '',
    description: '',
    shortDescription: '',
    categories: [],
    contactEmail: '',
    contactPhone: '',
    contactName: '',
    salesEmail: '',
    featured: false,
    verified: false,
    rating: 0,
    reviewCount: 0,
    status: 'PENDING',
  });

  const filteredVendors = displayVendors.filter(vendor => {
    const matchesSearch =
      (vendor?.companyName?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
      (vendor?.description?.toLowerCase() || '').includes((searchTerm || '').toLowerCase());
    const matchesTag =
      filterTag === 'all' ||
      (vendor?.categories || []).some(tag =>
        (tag?.toLowerCase() || '').includes((filterTag || '').toLowerCase())
      );
    return matchesSearch && matchesTag;
  });

  // Add vendor mutation
  const addVendorMutation = useMutation({
    mutationFn: async (vendorData: any) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/v1/admin/vendors', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: vendorData.companyName,
          description: vendorData.description,
          shortDescription: vendorData.shortDescription,
          website: vendorData.website,
          logo: vendorData.logo,
          categories: mapUICategoriesToBackendEnum(vendorData.categories || []),
          contactEmail: vendorData.contactEmail,
          contactPhone: vendorData.contactPhone,
          contactName: vendorData.contactName,
          salesEmail: vendorData.salesEmail,
          featured: vendorData.featured || false,
          verified: vendorData.verified || false,
          rating: vendorData.rating || 0,
          reviewCount: vendorData.reviewCount || 0,
          status: vendorData.status || 'PENDING',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add vendor');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast({ title: 'Success', description: 'Vendor added successfully' });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add vendor',
        variant: 'destructive',
      });
    },
  });

  const handleAddVendor = () => {
    addVendorMutation.mutate(formData);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    const extendedVendor = vendor as any;

    // Debug log to see what data we're working with
    console.log('Editing vendor data:', vendor);

    setFormData({
      // Basic vendor fields
      id: vendor.id,
      companyName: vendor.companyName || '',
      website: vendor.website || '',
      logo: vendor.logo || '',
      description: vendor.description || '',
      shortDescription: vendor.shortDescription || '',
      categories: vendor.categories || [],
      contactEmail: vendor.contactEmail || '',
      contactPhone: vendor.contactPhone || '',
      contactName: vendor.contactName || '',
      salesEmail: vendor.salesEmail || '',
      featured: vendor.featured || false,
      verified: vendor.verified || false,
      rating: vendor.rating || 0,
      reviewCount: vendor.reviewCount || 0,
      status: vendor.status || 'PENDING',

      // Extended fields - ensure all additional fields are properly mapped
      headquarters: extendedVendor.headquarters || '',
      primaryProduct: extendedVendor.primaryProduct || '',
      aiCapabilities: extendedVendor.aiCapabilities || '',
      deploymentOptions: extendedVendor.deploymentOptions || '',
      integrations: extendedVendor.integrations || '',
      dataCoverage: extendedVendor.dataCoverage || '',
      awards: extendedVendor.awards || '',
      customerSegments: extendedVendor.customerSegments || '',
      benefitsSnapshot: extendedVendor.benefitsSnapshot || '',
      maturityAssessment: extendedVendor.maturityAssessment || '',
    } as any);
  };

  // Update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: async ({ id, vendorData }: { id: string; vendorData: any }) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/v1/admin/vendors/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: vendorData.companyName,
          description: vendorData.description,
          shortDescription: vendorData.shortDescription,
          website: vendorData.website,
          logo: vendorData.logo,
          categories: mapUICategoriesToBackendEnum(vendorData.categories || []),
          contactEmail: vendorData.contactEmail,
          contactPhone: vendorData.contactPhone,
          contactName: vendorData.contactName,
          salesEmail: vendorData.salesEmail,
          featured: vendorData.featured || false,
          verified: vendorData.verified || false,
          rating: vendorData.rating || 0,
          reviewCount: vendorData.reviewCount || 0,
          status: vendorData.status || 'PENDING',
          // Extended vendor fields
          headquarters: vendorData.headquarters || '',
          primaryProduct: vendorData.primaryProduct || '',
          aiCapabilities: vendorData.aiCapabilities || '',
          deploymentOptions: vendorData.deploymentOptions || '',
          integrations: vendorData.integrations || '',
          dataCoverage: vendorData.dataCoverage || '',
          awards: vendorData.awards || '',
          customerSegments: vendorData.customerSegments || '',
          benefitsSnapshot: vendorData.benefitsSnapshot || '',
          maturityAssessment: vendorData.maturityAssessment || '',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update vendor');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast({ title: 'Success', description: 'Vendor updated successfully' });
      setEditingVendor(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update vendor',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateVendor = () => {
    if (editingVendor) {
      updateVendorMutation.mutate({ id: editingVendor.id, vendorData: formData });
    }
  };

  // Delete vendor mutation with optimistic updates
  const deleteVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/v1/admin/vendors/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          // Don't set Content-Type for DELETE requests with no body
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete vendor');
      }
      return response.json();
    },
    // Optimistic update - remove vendor immediately from UI
    onMutate: async deletedId => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['admin-vendors'] });

      // Snapshot the previous value
      const previousVendors = queryClient.getQueryData(['admin-vendors']);

      // Optimistically update to remove the vendor
      queryClient.setQueryData(['admin-vendors'], (old: any) => {
        if (!old || !old.data || !old.data.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.filter((vendor: any) => vendor.id !== deletedId),
          },
        };
      });

      // Return a context with the previous and new vendor data
      return { previousVendors, deletedId };
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vendor deleted successfully' });
    },
    onError: (error: any, deletedId, context) => {
      // Revert the optimistic update on error
      if (context?.previousVendors) {
        queryClient.setQueryData(['admin-vendors'], context.previousVendors);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete vendor',
        variant: 'destructive',
      });
    },
    // Always refetch after error or success to ensure UI consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
    },
  });

  const handleDeleteVendor = (id: string) => {
    const vendor = vendors.find(v => v.id === id);
    setDeleteConfirmation({
      isOpen: true,
      vendorId: id,
      vendorName: vendor?.companyName || 'Unknown Vendor',
    });
  };

  const confirmDeleteVendor = () => {
    deleteVendorMutation.mutate(deleteConfirmation.vendorId);
    setDeleteConfirmation({ isOpen: false, vendorId: '', vendorName: '' });
  };

  const cancelDeleteVendor = () => {
    setDeleteConfirmation({ isOpen: false, vendorId: '', vendorName: '' });
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      website: '',
      logo: '',
      description: '',
      shortDescription: '',
      categories: [],
      contactEmail: '',
      contactPhone: '',
      contactName: '',
      salesEmail: '',
      featured: false,
      verified: false,
      rating: 0,
      reviewCount: 0,
      status: 'PENDING',
      // Additional vendor fields from database
      headquarters: '',
      primaryProduct: '',
      aiCapabilities: '',
      deploymentOptions: '',
      integrations: '',
      dataCoverage: '',
      awards: '',
      customerSegments: '',
      benefitsSnapshot: '',
      maturityAssessment: '',
    });
  };

  // Preserve scroll position when form data changes
  useEffect(() => {
    if (editDialogScrollRef.current && scrollPosition.current > 0) {
      // Restore scroll position after state update
      const timeoutId = setTimeout(() => {
        if (editDialogScrollRef.current) {
          editDialogScrollRef.current.scrollTop = scrollPosition.current;
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [formData]);

  // Stable callback for form data changes to prevent re-renders
  const handleFormDataChange = useCallback((newFormData: any) => {
    // Save scroll position before state update
    if (editDialogScrollRef.current) {
      scrollPosition.current = editDialogScrollRef.current.scrollTop;
    }
    setFormData(newFormData);
  }, []);


  // Bulk upload handlers
  const handleBulkUpload = async (file: File) => {
    setIsUploading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the centralized API request function with proper URL and auth handling
      const result = await apiRequest<{ success: boolean; data?: any; error?: string }>(
        '/admin/vendors/bulk-upload',
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - let FormData set it with boundary
        }
      );

      if (result.success) {
        setUploadResults(result.data);
        // Refresh vendors list
        queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
        toast({
          title: 'Upload Complete',
          description: `Processed ${result.data.processed} vendors. ${result.data.success} successful, ${result.data.errors} errors.`,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      setUploadResults({
        processed: 0,
        success: 0,
        errors: 1,
        results: [
          {
            row: 1,
            status: 'error',
            error: error.message || 'Upload failed',
          },
        ],
      });
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      handleBulkUpload(file);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      [
        'Vendor Name',
        'Website',
        'HQ (if known)',
        'Solution Category / Tags',
        'AI Capabilities (short)',
        'Compliance & Trust Signals (awards/partners/certs)',
        'Data Coverage (lists/datasets/signals)',
        'Solution Description (1–2 lines)',
        'Maturity Assessment',
        'Benefits Snapshot',
        'Contact (email or page)',
      ],
      [
        'Silent Eight',
        'https://www.silenteight.com',
        'Singapore / New York',
        'Sanctions & Name Screening, AML Investigations',
        'Agentic AI + NLP for alert adjudication; explainable decisions',
        'Used by global banks',
        'Sanctions, PEP, Adverse Media',
        'Iris platform delivers end-to-end name & transaction screening.',
        'Scale-up / Enterprise',
        'Cuts investigation time and false positives',
        'info@silenteight.com | https://silenteight.com/contact',
      ],
      [
        'Napier AI',
        'https://www.napier.ai',
        'London, UK',
        'AML Transaction Monitoring, Screening, KYC/CDD',
        'Explainable AI models; risk scoring',
        'Continuum Live/API deployments',
        'Transactions, Sanctions, PEP',
        'Continuum configurable AML TM and screening.',
        'Scale-up / Enterprise',
        'Lower TCO, reduced false positives',
        'info@napier.ai | https://napier.ai/contact',
      ],
    ];

    const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor_upload_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Vendor Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage vendor profiles, pricing, and integrations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Bulk Upload Vendors</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to add multiple vendors at once. Download the sample CSV to
                    see the required format.
                  </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 space-y-4">
                  {!uploadResults ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                        <p className="text-gray-600 mb-4">
                          Select a CSV file containing vendor information to upload.
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Select CSV File
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={downloadSampleCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Sample
                          </Button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Required CSV Columns</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>• Vendor Name</div>
                            <div>• Website</div>
                            <div>• HQ (if known)</div>
                            <div>• Solution Category / Tags</div>
                            <div>• AI Capabilities (short)</div>
                            <div>• Compliance & Trust Signals</div>
                            <div>• Data Coverage</div>
                            <div>• Solution Description</div>
                            <div>• Maturity Assessment</div>
                            <div>• Benefits Snapshot</div>
                            <div>• Contact (email or page)</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {uploadResults.errors === 0 ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                            Upload Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{uploadResults.processed}</div>
                              <div className="text-sm text-gray-600">Processed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {uploadResults.success}
                              </div>
                              <div className="text-sm text-gray-600">Success</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">
                                {uploadResults.errors}
                              </div>
                              <div className="text-sm text-gray-600">Errors</div>
                            </div>
                          </div>

                          {uploadResults.results && uploadResults.results.length > 0 && (
                            <div className="border rounded-lg">
                              <div className="max-h-64 overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Row</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Vendor</TableHead>
                                      <TableHead>Details</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {uploadResults.results.map((result: any, index: number) => (
                                      <TableRow key={index}>
                                        <TableCell>{result.row}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              result.status === 'success'
                                                ? 'default'
                                                : 'destructive'
                                            }
                                            className={
                                              result.status === 'success'
                                                ? 'bg-green-500/20 text-green-500'
                                                : ''
                                            }
                                          >
                                            {result.status === 'success' && (
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                            )}
                                            {result.status === 'error' && (
                                              <XCircle className="h-3 w-3 mr-1" />
                                            )}
                                            {result.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{result.vendor?.companyName || '-'}</TableCell>
                                        <TableCell>
                                          {result.error || 'Created successfully'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex-shrink-0">
                  {uploadResults ? (
                    <Button
                      onClick={() => {
                        setUploadResults(null);
                        setIsBulkUploadOpen(false);
                      }}
                    >
                      Close
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>
                      Cancel
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Vendors Section */}
        <div className="space-y-6">
            <div className="flex items-center justify-end">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Add New Vendor</DialogTitle>
                    <DialogDescription>
                      Enter vendor details to add them to the marketplace
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto flex-1 -mx-6 px-6">
                    <VendorForm formData={formData} onFormDataChange={handleFormDataChange} />
                  </div>
                  <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddVendor}>Add Vendor</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search vendors..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterTag} onValueChange={setFilterTag}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        <SelectItem value="SOC 2">SOC 2</SelectItem>
                        <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                        <SelectItem value="HIPAA">HIPAA</SelectItem>
                        <SelectItem value="GDPR">GDPR</SelectItem>
                        <SelectItem value="CCPA">CCPA</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Vendors Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingVendors ? (
                      // Loading skeleton rows
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`loading-${index}`}>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24"></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredVendors.length > 0 ? (
                      filteredVendors.map(vendor => (
                        <TableRow key={vendor.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vendor.companyName}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {vendor.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {vendor.categories.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{vendor.contactEmail}</p>
                              {vendor.contactPhone && (
                                <p className="text-muted-foreground">{vendor.contactPhone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setIsDetailsDialogOpen(true);
                                }}
                                data-testid={`button-view-details-${vendor.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Vendor
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => handleDeleteVendor(vendor.id)}
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      // Empty state
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Building2 className="h-8 w-8" />
                            <p>No vendors found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingVendor} onOpenChange={() => setEditingVendor(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Edit Vendor</DialogTitle>
                  <DialogDescription>Update vendor details</DialogDescription>
                </DialogHeader>
                <div
                  ref={editDialogScrollRef}
                  className="overflow-y-auto flex-1 -mx-6 px-6"
                  onScroll={e => {
                    // Save scroll position on scroll
                    scrollPosition.current = (e.target as HTMLDivElement).scrollTop;
                  }}
                >
                  <VendorForm formData={formData} onFormDataChange={handleFormDataChange} />
                </div>
                <DialogFooter className="flex-shrink-0">
                  <Button variant="outline" onClick={() => setEditingVendor(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateVendor}>Update Vendor</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Vendor Details Dialog */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0 border-b pb-4">
                  <DialogTitle className="text-2xl flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    Vendor Details
                  </DialogTitle>
                  <DialogDescription>
                    Complete information for {selectedVendor?.companyName}
                  </DialogDescription>
                </DialogHeader>

                {selectedVendor && (
                  <div className="overflow-y-auto flex-1 py-6 space-y-6">
                    {/* Header Card with Company Overview */}
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                          {selectedVendor.logo && (
                            <img
                              src={selectedVendor.logo}
                              alt={selectedVendor.companyName}
                              className="w-20 h-20 rounded-lg object-cover border-2 border-primary/20"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-bold">{selectedVendor.companyName}</h3>
                              <div className="flex gap-2">
                                {selectedVendor.featured && (
                                  <Badge
                                    variant="default"
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500"
                                  >
                                    ⭐ Featured
                                  </Badge>
                                )}
                                {selectedVendor.verified && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-500/20 text-green-600"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-lg text-muted-foreground mb-3">
                              {selectedVendor.shortDescription}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              {selectedVendor.website && (
                                <a
                                  href={selectedVendor.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Globe className="h-4 w-4" />
                                  Visit Website
                                </a>
                              )}
                              {selectedVendor.rating && selectedVendor.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">⭐</span>
                                  <span className="font-medium">
                                    {selectedVendor.rating.toFixed(1)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    ({selectedVendor.reviewCount} reviews)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Categories */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Solution Categories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedVendor.categories && selectedVendor.categories.length > 0 ? (
                            selectedVendor.categories.map(category => (
                              <Badge key={category} variant="outline" className="px-3 py-1 text-sm">
                                {category.replace(/_/g, ' ')}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No categories specified</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Description */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Full Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {selectedVendor.description || 'No description available'}
                            </p>
                          </div>

                          {/* AI Capabilities */}
                          {(selectedVendor as any).aiCapabilities && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">AI Capabilities</h4>
                              <p className="text-sm text-muted-foreground">
                                {(selectedVendor as any).aiCapabilities}
                              </p>
                            </div>
                          )}

                          {/* Deployment Options */}
                          {(selectedVendor as any).deploymentOptions && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Deployment Options</h4>
                              <p className="text-sm text-muted-foreground">
                                {(selectedVendor as any).deploymentOptions}
                              </p>
                            </div>
                          )}

                          {/* Integrations */}
                          {(selectedVendor as any).integrations && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Integrations</h4>
                              <p className="text-sm text-muted-foreground">
                                {(selectedVendor as any).integrations}
                              </p>
                            </div>
                          )}

                          {/* Awards & Trust Signals */}
                          {(selectedVendor as any).awards && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Awards & Trust Signals</h4>
                              <p className="text-sm text-muted-foreground">
                                {(selectedVendor as any).awards}
                              </p>
                            </div>
                          )}

                          {/* Customer Segments */}
                          {(selectedVendor as any).customerSegments && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Customer Segments</h4>
                              <p className="text-sm text-muted-foreground">
                                {(selectedVendor as any).customerSegments}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Primary Contact
                              </p>
                              <div className="space-y-1">
                                {selectedVendor.contactName && (
                                  <p className="font-medium">{selectedVendor.contactName}</p>
                                )}
                                <p className="text-sm flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  {selectedVendor.contactEmail}
                                </p>
                                {selectedVendor.contactPhone && (
                                  <p className="text-sm flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {selectedVendor.contactPhone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Sales Contact
                              </p>
                              <div className="space-y-1">
                                {selectedVendor.salesEmail && (
                                  <p className="text-sm flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {selectedVendor.salesEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Additional Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Created Date</p>
                            <p>
                              {selectedVendor.createdAt
                                ? new Date(selectedVendor.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })
                                : 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Last Updated</p>
                            <p>
                              {selectedVendor.updatedAt
                                ? new Date(selectedVendor.updatedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })
                                : 'Unknown'}
                            </p>
                          </div>
                          {selectedVendor.approvedAt && (
                            <>
                              <div>
                                <p className="font-medium text-muted-foreground mb-1">
                                  Approved Date
                                </p>
                                <p>
                                  {new Date(selectedVendor.approvedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                              {selectedVendor.approvedBy && (
                                <div>
                                  <p className="font-medium text-muted-foreground mb-1">
                                    Approved By
                                  </p>
                                  <p>{selectedVendor.approvedBy}</p>
                                </div>
                              )}
                            </>
                          )}
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Vendor ID</p>
                            <p className="font-mono text-xs">{selectedVendor.id}</p>
                          </div>
                          {selectedVendor.userId && (
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">User ID</p>
                              <p className="font-mono text-xs">{selectedVendor.userId}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <DialogFooter className="flex-shrink-0 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleEditVendor(selectedVendor!);
                      setIsDetailsDialogOpen(false);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Vendor
                  </Button>
                  <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={open => !open && cancelDeleteVendor()}
      >
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmation.vendorName}</strong>? This
              action cannot be undone and will permanently remove the vendor from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={cancelDeleteVendor}
              data-testid="button-cancel-delete"
              disabled={deleteVendorMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVendor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
              disabled={deleteVendorMutation.isPending}
            >
              {deleteVendorMutation.isPending ? 'Deleting...' : 'Delete Vendor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default VendorManagement;
