import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  DollarSign,
  Globe,
  Database,
  Leaf,
  Lock,
  ChevronRight,
  Clock,
  FileText,
  Star,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { templateApi, queryKeys } from '@/lib/api';
import { AssessmentTemplate, TemplateCategory } from '@/types/assessment';

const categoryIcons: Record<TemplateCategory, any> = {
  FINANCIAL_CRIME: DollarSign,
  TRADE_COMPLIANCE: Globe,
  DATA_PRIVACY: Database,
  CYBERSECURITY: Lock,
  ESG: Leaf,
};

const categoryColors: Record<TemplateCategory, string> = {
  FINANCIAL_CRIME: 'text-yellow-400 bg-yellow-500/20',
  TRADE_COMPLIANCE: 'text-blue-400 bg-blue-500/20',
  DATA_PRIVACY: 'text-purple-400 bg-purple-500/20',
  CYBERSECURITY: 'text-red-400 bg-red-500/20',
  ESG: 'text-green-400 bg-green-500/20',
};

const AssessmentTemplates = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'ALL'>('ALL');

  // Fetch templates from API (only active templates)
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey:
      selectedCategory === 'ALL'
        ? queryKeys.templatesFiltered({ active: true })
        : queryKeys.templatesFiltered({ category: selectedCategory, active: true }),
    queryFn: () =>
      templateApi.getTemplates(
        selectedCategory === 'ALL' ? { active: true } : { category: selectedCategory, active: true }
      ),
  });

  // Filter templates based on search
  const filteredTemplates = templates.filter(
    template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartAssessment = (templateId: string) => {
    // Navigate to execution page with template ID
    navigate(`/assessment/execute/${templateId}`);
  };

  const getPopularityScore = (template: AssessmentTemplate) => {
    // Mock popularity score - in production, this would come from backend
    const scores: Record<string, number> = {
      'financial-crime-basic': 4.8,
      'trade-compliance-standard': 4.6,
      'data-privacy-gdpr': 4.9,
      'cybersecurity-basic': 4.7,
    };
    return scores[template.slug] || 4.5;
  };

  const getUsageCount = (template: AssessmentTemplate) => {
    // Mock usage count - in production, this would come from backend
    const counts: Record<string, number> = {
      'financial-crime-basic': 2847,
      'trade-compliance-standard': 1923,
      'data-privacy-gdpr': 3156,
      'cybersecurity-basic': 2234,
    };
    return counts[template.slug] || 1000;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-900/20 border-red-800">
            <CardContent className="p-6">
              <p className="text-red-400">
                Failed to load assessment templates. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-5"
            style={{
              left: `${30 + i * 25}%`,
              top: `${20 + i * 20}%`,
              animation: `float ${20 + i * 5}s infinite ease-in-out`,
            }}
          >
            <div
              className={`w-96 h-96 rounded-full bg-gradient-to-br ${
                i % 2 === 0 ? 'from-cyan-500 to-cyan-400' : 'from-pink-500 to-pink-400'
              }`}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-cyan-500/20 backdrop-blur-sm">
            <Shield className="h-10 w-10 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 gradient-text">Risk Assessment Templates</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Choose from our comprehensive library of AI-powered assessment templates tailored to
            your compliance needs
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500"
              data-testid="input-search-templates"
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={value => setSelectedCategory(value as TemplateCategory | 'ALL')}
          >
            <SelectTrigger className="w-full md:w-[250px] bg-gray-900/50 border-gray-800 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="FINANCIAL_CRIME">Financial Crime</SelectItem>
              <SelectItem value="TRADE_COMPLIANCE">Trade Compliance</SelectItem>
              <SelectItem value="DATA_PRIVACY">Data Privacy</SelectItem>
              <SelectItem value="CYBERSECURITY">Cybersecurity</SelectItem>
              <SelectItem value="ESG">ESG Compliance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured Template */}
        {!isLoading && filteredTemplates.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-cyan-900/30 to-pink-900/30 border-cyan-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                  Featured
                </Badge>
              </div>
              <CardTitle className="text-2xl text-white">{filteredTemplates[0].name}</CardTitle>
              <CardDescription className="text-gray-300">
                {filteredTemplates[0].description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{filteredTemplates[0].estimatedMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText className="h-4 w-4" />
                  <span>{filteredTemplates[0].totalQuestions} questions</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{getPopularityScore(filteredTemplates[0])}/5.0</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>{getUsageCount(filteredTemplates[0]).toLocaleString()} assessments</span>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => handleStartAssessment(filteredTemplates[0].id)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                data-testid={`button-start-featured-${filteredTemplates[0].id}`}
              >
                Start Featured Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Template Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="template-cards">
          {isLoading
            ? // Loading skeletons
              [...Array(6)].map((_, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))
            : filteredTemplates.map(template => {
                const Icon = categoryIcons[template.category];
                const colorClass = categoryColors[template.category];

                return (
                  <Card
                    key={template.id}
                    className="bg-gray-900/50 border-gray-800 hover:border-cyan-700/50 transition-all duration-300 card-hover group"
                  >
                    <CardHeader>
                      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400 line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                          {template.category.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                          v{template.version}
                        </Badge>
                        {template.isActive && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            Active
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{template.estimatedMinutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FileText className="h-4 w-4" />
                          <span>{template.totalQuestions} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-gray-400">{getPopularityScore(template)}/5.0</span>
                          <span className="text-gray-500">
                            ({getUsageCount(template).toLocaleString()} uses)
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gray-800 hover:bg-cyan-700 text-white group-hover:bg-cyan-600 transition-colors"
                        onClick={() => handleStartAssessment(template.id)}
                        data-testid={`button-start-${template.id}`}
                      >
                        Start Assessment
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Empty State */}
        {!isLoading && filteredTemplates.length === 0 && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssessmentTemplates;
