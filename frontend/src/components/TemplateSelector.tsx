import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Shield,
  Building,
  Globe,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Database,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { templateApi, queryKeys } from '@/lib/api';
import { AssessmentTemplate, TemplateCategory, TemplateFilters } from '@/types/assessment';
import { FreemiumProgress, RestrictedContent } from '@/components/ui/freemium';
import { toast } from '@/hooks/use-toast';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

interface TemplateSelectorProps {
  onTemplateSelect: (template: AssessmentTemplate) => void;
  onSkip: () => void;
  className?: string;
}

const categoryIcons: Record<TemplateCategory, any> = {
  FINANCIAL_CRIME: Shield,
  TRADE_COMPLIANCE: Globe,
  DATA_PRIVACY: Lock,
  CYBERSECURITY: Database,
};

const categoryColors: Record<TemplateCategory, string> = {
  FINANCIAL_CRIME: 'bg-cyan-600/20 text-cyan-400',
  TRADE_COMPLIANCE: 'bg-pink-600/20 text-pink-400',
  DATA_PRIVACY: 'bg-purple-600/20 text-purple-400',
  CYBERSECURITY: 'bg-orange-600/20 text-orange-400',
};

const getDifficultyColor = (estimatedMinutes: number) => {
  if (estimatedMinutes <= 30) return 'bg-green-600/20 text-green-400';
  if (estimatedMinutes <= 60) return 'bg-yellow-600/20 text-yellow-400';
  return 'bg-red-600/20 text-red-400';
};

const getDifficultyLevel = (estimatedMinutes: number) => {
  if (estimatedMinutes <= 30) return 'Basic';
  if (estimatedMinutes <= 60) return 'Intermediate';
  return 'Advanced';
};

const TemplateSelector = ({ onTemplateSelect, onSkip, className }: TemplateSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Get real subscription status from hook
  const { isPremium, isLoading: subscriptionLoading } = useSubscriptionCheck();

  // Build freemium status from real subscription data
  const freemiumStatus = {
    isFreeTier: !isPremium,
    assessmentsUsed: 0,
    assessmentsLimit: isPremium ? 999 : 1,
    canViewFullResults: isPremium,
    canDownloadReports: isPremium,
    canAccessMarketplace: isPremium,
  };

  // Build filters for API call
  const filters: TemplateFilters = {
    ...(selectedCategory !== 'all' && { category: selectedCategory }),
    active: true,
    ...(searchQuery && { search: searchQuery }),
  };

  // Fetch templates from API
  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.templatesFiltered(filters),
    queryFn: () => templateApi.getTemplates(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTemplateSelect = (template: AssessmentTemplate) => {
    // Check freemium limits
    if (
      freemiumStatus.isFreeTier &&
      freemiumStatus.assessmentsUsed >= freemiumStatus.assessmentsLimit
    ) {
      setShowUpgradeDialog(true);
      toast({
        title: 'Assessment Limit Reached',
        description: "You've reached your free assessment limit. Upgrade to continue.",
        variant: 'destructive',
      });
      return;
    }

    onTemplateSelect(template);
  };

  const handleUpgrade = () => {
    // Implementation for upgrade flow
    toast({
      title: 'Upgrade Coming Soon',
      description: 'Premium subscriptions will be available soon!',
    });
  };

  if (error) {
    return (
      <Card className={cn('max-w-6xl mx-auto', className)}>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Templates</h3>
          <p className="text-muted-foreground mb-4">
            Unable to fetch assessment templates. Please try again.
          </p>
          <Button onClick={() => refetch()} data-testid="button-retry-templates">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('max-w-6xl mx-auto space-y-6', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Choose Assessment Template</span>
          </CardTitle>
          <CardDescription>
            Select a comprehensive assessment template tailored to your compliance needs
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Freemium Progress */}
      {freemiumStatus.isFreeTier && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <FreemiumProgress
              used={freemiumStatus.assessmentsUsed}
              limit={freemiumStatus.assessmentsLimit}
              itemName="Assessment"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Upgrade to unlock unlimited assessments and advanced features
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={selectedCategory} onValueChange={value => setSelectedCategory(value as any)}>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-6">
                <TabsTrigger value="all" data-testid="filter-all">
                  All
                </TabsTrigger>
                <TabsTrigger value="FINANCIAL_CRIME" data-testid="filter-financial-crime">
                  Financial Crime
                </TabsTrigger>
                <TabsTrigger value="TRADE_COMPLIANCE" data-testid="filter-trade-compliance">
                  Trade Compliance
                </TabsTrigger>
                <TabsTrigger value="DATA_PRIVACY" data-testid="filter-data-privacy">
                  Data Privacy
                </TabsTrigger>
                <TabsTrigger value="CYBERSECURITY" data-testid="filter-cybersecurity">
                  Cybersecurity
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-templates"
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-9 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Templates Grid */}
            {!isLoading && (
              <TabsContent value={selectedCategory} className="mt-6">
                {templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? 'Try adjusting your search terms'
                        : 'No templates available for this category'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => {
                      const Icon = categoryIcons[template.category];
                      const isRestricted =
                        freemiumStatus.isFreeTier &&
                        freemiumStatus.assessmentsUsed >= freemiumStatus.assessmentsLimit;

                      return (
                        <RestrictedContent
                          key={template.id}
                          isRestricted={isRestricted}
                          restrictionMessage="You've reached your free assessment limit"
                          upgradeFeatures={[
                            'Unlimited assessments',
                            'Detailed risk analysis',
                            'Full gap analysis reports',
                            'Vendor marketplace access',
                          ]}
                          onUpgrade={handleUpgrade}
                        >
                          <Card
                            className={cn(
                              'hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/20',
                              isRestricted && 'opacity-60'
                            )}
                            data-testid={`template-card-${template.slug}`}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                  <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-white mb-1 line-clamp-2">
                                    {template.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {template.description}
                                  </p>

                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge className={categoryColors[template.category]}>
                                      {template.category.replace('_', ' ')}
                                    </Badge>
                                    <Badge
                                      className={getDifficultyColor(template.estimatedMinutes)}
                                    >
                                      {getDifficultyLevel(template.estimatedMinutes)}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{template.estimatedMinutes} min</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span>{template.totalQuestions} questions</span>
                                    </div>
                                  </div>

                                  <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleTemplateSelect(template)}
                                    disabled={isRestricted}
                                    data-testid={`button-select-${template.slug}`}
                                  >
                                    {isRestricted ? (
                                      <>
                                        <Lock className="h-4 w-4 mr-1" />
                                        Upgrade Required
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Start Assessment
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </RestrictedContent>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Skip Option */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <h3 className="font-medium mb-2">Don't see what you need?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You can upload your own documentation for custom analysis
          </p>
          <Button variant="outline" onClick={onSkip} data-testid="button-skip-templates">
            Skip Templates - Upload Documents
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateSelector;
