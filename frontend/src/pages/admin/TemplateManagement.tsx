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
  useTemplates,
  useTemplateStats,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from '@/hooks/useAdminTemplates';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import {
  FileText,
  Plus,
  Edit,
  Trash,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  GripVertical,
  Package,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'boolean' | 'scale';
  required: boolean;
  aiPrompt?: string;
  order: number;
  weight?: number;
}

interface Section {
  id: string;
  name: string;
  description: string;
  order: number;
  weight?: number;
  questions: Question[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  framework: string;
  status: 'active' | 'draft' | 'archived';
  sections: Section[];
  aiEnabled: boolean;
  creditCost: number;
  createdDate: string;
  lastModified: string;
  usageCount: number;
}

const TemplateManagement = () => {
  // Fetch templates and stats using TanStack Query hooks
  const { data: templates = [], isLoading, error } = useTemplates();
  const { data: stats, isLoading: isStatsLoading } = useTemplateStats();

  // Mutation hooks
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<string[]>([]);

  // Pending weight changes cache: { itemId: newWeight }
  const [pendingWeightChanges, setPendingWeightChanges] = useState<Map<string, number>>(new Map());
  // Track which sections have pending changes: Set of sectionIds
  const [sectionsWithPendingChanges, setSectionsWithPendingChanges] = useState<Set<string>>(new Set());

  // Dialog states
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);

  const toggleTemplateExpansion = (templateId: string) => {
    setExpandedTemplates(prev =>
      prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId]
    );
  };

  const handleAddTemplate = () => {
    setEditingTemplate({
      id: Date.now().toString(),
      name: '',
      description: '',
      framework: '', // Keep for compatibility with Template interface
      status: 'draft',
      sections: [],
      aiEnabled: false,
      creditCost: 50,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      usageCount: 0,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const handleAddSection = (template: Template) => {
    setSelectedTemplate(template);
    setEditingSection({
      id: Date.now().toString(),
      name: '',
      description: '',
      order: template.sections.length + 1,
      questions: [],
      weight: 1.0,
    } as any);
    setIsSectionDialogOpen(true);
  };

  const handleAddQuestion = (template: Template, section: Section) => {
    setSelectedTemplate(template);
    setEditingSection(section);
    setEditingQuestion({
      id: Date.now().toString(),
      question: '',
      type: 'text',
      required: true,
      aiPrompt: '',
      order: section.questions.length + 1,
      weight: 1.0,
    } as any);
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (template: Template, section: Section, question: Question) => {
    setSelectedTemplate(template);
    setEditingSection(section);
    setEditingQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      deleteTemplate.mutate(templateId);
    }
  };

  const handleDeleteSection = (templateId: string, sectionId: string) => {
    if (confirm('Are you sure you want to delete this section and all its questions?')) {
      deleteSection.mutate(sectionId);
    }
  };

  const handleDeleteQuestion = (templateId: string, sectionId: string, questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      deleteQuestion.mutate(questionId);
    }
  };

  // Helper: Get effective weight (pending or current)
  const getEffectiveWeight = (itemId: string, currentWeight: number): number => {
    return pendingWeightChanges.get(itemId) ?? currentWeight;
  };

  // Auto-balancing weight handlers - now only update local state
  const handleSectionWeightChange = (template: Template, sectionId: string, newWeight: number) => {
    const sections = template.sections;
    if (sections.length <= 1) return; // Can't rebalance with one section

    const remaining = 1.0 - newWeight;
    const otherSectionsCount = sections.length - 1;
    const redistributedWeight = remaining / otherSectionsCount;

    // Update pending changes map for all sections
    setPendingWeightChanges(prev => {
      const updated = new Map(prev);
      for (const section of sections) {
        const updatedWeight = section.id === sectionId ? newWeight : redistributedWeight;
        updated.set(section.id, Math.max(0.01, Math.min(0.99, updatedWeight)));
      }
      return updated;
    });

    // Mark section as having pending changes
    setSectionsWithPendingChanges(prev => new Set(prev).add(sectionId));
  };

  const handleQuestionWeightChange = (section: Section, questionId: string, newWeight: number) => {
    const questions = section.questions;
    if (questions.length <= 1) return; // Can't rebalance with one question

    const remaining = 1.0 - newWeight;
    const otherQuestionsCount = questions.length - 1;
    const redistributedWeight = remaining / otherQuestionsCount;

    // Update pending changes map for all questions
    setPendingWeightChanges(prev => {
      const updated = new Map(prev);
      for (const question of questions) {
        const updatedWeight = question.id === questionId ? newWeight : redistributedWeight;
        updated.set(question.id, Math.max(0.01, Math.min(0.99, updatedWeight)));
      }
      return updated;
    });

    // Mark section as having pending changes
    setSectionsWithPendingChanges(prev => new Set(prev).add(section.id));
  };

  // Save all pending weight changes for a section
  const saveSectionWeights = async (template: Template, section: Section) => {
    const updates: Promise<any>[] = [];

    // Save section weight if changed
    const sectionWeight = pendingWeightChanges.get(section.id);
    if (sectionWeight !== undefined) {
      updates.push(
        updateSection.mutateAsync({
          id: section.id,
          data: { weight: sectionWeight },
        })
      );
    }

    // Save all question weights if changed
    for (const question of section.questions) {
      const questionWeight = pendingWeightChanges.get(question.id);
      if (questionWeight !== undefined) {
        updates.push(
          updateQuestion.mutateAsync({
            id: question.id,
            data: { weight: questionWeight },
          })
        );
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      try {
        await Promise.all(updates);

        // Clear pending changes for this section and its questions
        setPendingWeightChanges(prev => {
          const updated = new Map(prev);
          updated.delete(section.id);
          section.questions.forEach(q => updated.delete(q.id));
          return updated;
        });

        // Remove section from pending changes set
        setSectionsWithPendingChanges(prev => {
          const updated = new Set(prev);
          updated.delete(section.id);
          return updated;
        });
      } catch (error) {
        console.error('Failed to save weights:', error);
      }
    }
  };

  // Discard pending weight changes for a section
  const discardSectionWeights = (section: Section) => {
    setPendingWeightChanges(prev => {
      const updated = new Map(prev);
      updated.delete(section.id);
      section.questions.forEach(q => updated.delete(q.id));
      return updated;
    });

    setSectionsWithPendingChanges(prev => {
      const updated = new Set(prev);
      updated.delete(section.id);
      return updated;
    });
  };

  // Get count of pending changes for a section
  const getPendingChangesCount = (section: Section): number => {
    let count = 0;
    if (pendingWeightChanges.has(section.id)) count++;
    section.questions.forEach(q => {
      if (pendingWeightChanges.has(q.id)) count++;
    });
    return count;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'archived':
        return 'bg-gray-500/20 text-gray-500';
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
            <h1 className="text-3xl font-bold gradient-text">Template Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage assessment templates with AI-powered questions
            </p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleAddTemplate}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-500">Error Loading Templates</CardTitle>
              </div>
              <CardDescription className="text-red-400">
                Failed to load templates. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading templates...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isStatsLoading ? '...' : stats?.totalTemplates || templates.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeTemplates || templates.filter(t => t.status === 'active').length}{' '}
                    active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isStatsLoading
                      ? '...'
                      : templates.reduce(
                          (sum, t) =>
                            sum + (t.sections || []).reduce((sSum, s) => sSum + ((s.questions || []).length), 0),
                          0
                        )}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all templates</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">AI-Enabled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isStatsLoading ? '...' : templates.filter(t => t.aiEnabled).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Templates with AI prompts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isStatsLoading ? '...' : templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Assessments completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Templates List */}
            <div className="space-y-4">
          {templates.map(template => {
            const isExpanded = expandedTemplates.includes(template.id);

            return (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-start gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleTemplateExpansion(template.id)}
                    >
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          <Badge className={getStatusColor(template.status)}>
                            {template.status}
                          </Badge>
                          {template.aiEnabled && (
                            <Badge className="bg-purple-500/20 text-purple-500">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI-Enabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Framework: {template.framework}</span>
                          <span>{(template.sections || []).length} sections</span>
                          <span>
                            {(template.sections || []).reduce((sum, s) => sum + ((s.questions || []).length), 0)}{' '}
                            questions
                          </span>
                          <span>{template.creditCost} credits</span>
                          <span>{template.usageCount || 0} uses</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t bg-muted/20">
                    <div className="space-y-4 pt-4">
                      {/* Sections */}
                      {template.sections.map((section, sectionIndex) => {
                        const pendingCount = getPendingChangesCount(section);
                        const hasPendingChanges = pendingCount > 0;

                        return (
                          <div key={section.id} className="border rounded-lg bg-background">
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      Section {sectionIndex + 1}: {section.name}
                                      {hasPendingChanges && (
                                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/50">
                                          {pendingCount} unsaved
                                        </Badge>
                                      )}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {section.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {(section.questions || []).length} questions
                                    </p>
                                    {/* Section Weight Slider */}
                                    {template.sections.length > 1 && (
                                      <div className="mt-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-xs">Section Weight</Label>
                                          <span className="text-xs font-medium">
                                            {getEffectiveWeight(section.id, (section as any).weight || 1.0).toFixed(2)}
                                          </span>
                                        </div>
                                        <Slider
                                          value={[getEffectiveWeight(section.id, (section as any).weight || 1.0) * 100]}
                                          onValueChange={(value) =>
                                            handleSectionWeightChange(template, section.id, value[0] / 100)
                                          }
                                          min={1}
                                          max={99}
                                          step={1}
                                          className="w-full"
                                        />
                                      </div>
                                    )}
                                    {/* Save/Discard Buttons */}
                                    {hasPendingChanges && (
                                      <div className="mt-3 flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => saveSectionWeights(template, section)}
                                          disabled={updateSection.isPending || updateQuestion.isPending}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Save Weights
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => discardSectionWeights(section)}
                                        >
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Discard
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddQuestion(template, section)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Question
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Section
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-500"
                                      onClick={() => handleDeleteSection(template.id, section.id)}
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Questions */}
                            {section.questions.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {section.questions.map((question, qIndex) => (
                                  <div key={question.id} className="bg-muted/50 p-3 rounded-md">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-muted-foreground">
                                            Q{qIndex + 1}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {question.type}
                                          </Badge>
                                          {question.required && (
                                            <Badge variant="outline" className="text-xs">
                                              Required
                                            </Badge>
                                          )}
                                          {question.aiPrompt && (
                                            <Badge className="bg-purple-500/20 text-purple-500 text-xs">
                                              <Sparkles className="h-3 w-3 mr-1" />
                                              AI
                                            </Badge>
                                          )}
                                          <Badge
                                            variant="secondary"
                                            className={`text-xs ${pendingWeightChanges.has(question.id) ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50' : ''}`}
                                          >
                                            Weight: {getEffectiveWeight(question.id, (question as any).weight || 1.0).toFixed(2)}
                                          </Badge>
                                        </div>
                                        <p className="text-sm mt-1">{question.question}</p>
                                        {/* Question Weight Slider */}
                                        {section.questions.length > 1 && (
                                          <div className="mt-2 space-y-1">
                                            <div className="flex items-center justify-between">
                                              <Label className="text-xs">Weight</Label>
                                              <span className="text-xs font-medium">
                                                {getEffectiveWeight(question.id, (question as any).weight || 1.0).toFixed(2)}
                                              </span>
                                            </div>
                                            <Slider
                                              value={[getEffectiveWeight(question.id, (question as any).weight || 1.0) * 100]}
                                              onValueChange={(value) =>
                                                handleQuestionWeightChange(section, question.id, value[0] / 100)
                                              }
                                              min={1}
                                              max={99}
                                              step={1}
                                              className="w-full"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleEditQuestion(template, section, question)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() =>
                                            handleDeleteQuestion(
                                              template.id,
                                              section.id,
                                              question.id
                                            )
                                          }
                                        >
                                          <Trash className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                      {/* Add Section Button */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleAddSection(template)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
            </div>
          </>
        )}

        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate && templates.some(t => t.id === editingTemplate.id) ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>Configure the assessment template details</DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., SOC 2 Readiness Assessment"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingTemplate.description}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe what this assessment covers..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Credit Cost</Label>
                    <Input
                      type="number"
                      value={editingTemplate.creditCost}
                      onChange={e =>
                        setEditingTemplate({
                          ...editingTemplate,
                          creditCost: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editingTemplate.status}
                      onValueChange={(value: any) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          status: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label>Enable AI Analysis</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow AI-powered insights for responses
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={editingTemplate.aiEnabled}
                    onCheckedChange={checked =>
                      setEditingTemplate({
                        ...editingTemplate,
                        aiEnabled: checked,
                      })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={createTemplate.isPending || updateTemplate.isPending}
                onClick={() => {
                  if (!editingTemplate) return;

                  const isEditing = templates.some(t => t.id === editingTemplate.id);

                  if (isEditing) {
                    // Update existing template
                    updateTemplate.mutate(
                      {
                        id: editingTemplate.id,
                        data: {
                          name: editingTemplate.name,
                          description: editingTemplate.description,
                          category: editingTemplate.framework || 'DATA_PRIVACY' as any, // Use existing framework or default
                          creditCost: editingTemplate.creditCost,
                          isActive: editingTemplate.status === 'active',
                        },
                      },
                      {
                        onSuccess: () => {
                          setIsTemplateDialogOpen(false);
                          setEditingTemplate(null);
                        },
                      }
                    );
                  } else {
                    // Create new template
                    createTemplate.mutate(
                      {
                        name: editingTemplate.name,
                        slug: editingTemplate.name.toLowerCase().replace(/\s+/g, '-'),
                        description: editingTemplate.description,
                        category: 'DATA_PRIVACY' as any, // Default category since field is removed from UI
                        creditCost: editingTemplate.creditCost,
                        isActive: editingTemplate.status === 'active',
                      },
                      {
                        onSuccess: () => {
                          setIsTemplateDialogOpen(false);
                          setEditingTemplate(null);
                        },
                      }
                    );
                  }
                }}
              >
                {createTemplate.isPending || updateTemplate.isPending
                  ? 'Saving...'
                  : templates.some(t => t.id === editingTemplate?.id)
                    ? 'Update'
                    : 'Create'}{' '}
                Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Section Dialog */}
        <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Section</DialogTitle>
              <DialogDescription>
                Create a new section for {selectedTemplate?.name}
              </DialogDescription>
            </DialogHeader>
            {editingSection && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Name</Label>
                  <Input
                    value={editingSection.name}
                    onChange={e =>
                      setEditingSection({
                        ...editingSection,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Security Controls"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingSection.description}
                    onChange={e =>
                      setEditingSection({
                        ...editingSection,
                        description: e.target.value,
                      })
                    }
                    placeholder="What does this section assess?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section-weight">Weight (0-100)</Label>
                  <Input
                    id="section-weight"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={(editingSection as any).weight || 1.0}
                    onChange={e => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        setEditingSection({
                          ...editingSection,
                          weight: value,
                        } as any);
                      }
                    }}
                    placeholder="1.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Importance weight for scoring (higher = more important). Sections should sum to 100.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={createSection.isPending}
                onClick={() => {
                  if (!editingSection || !selectedTemplate) return;

                  createSection.mutate(
                    {
                      templateId: selectedTemplate.id,
                      data: {
                        title: editingSection.name,
                        description: editingSection.description,
                        order: editingSection.order,
                        weight: (editingSection as any).weight || 1.0,
                      },
                    },
                    {
                      onSuccess: () => {
                        setIsSectionDialogOpen(false);
                        setEditingSection(null);
                        setSelectedTemplate(null);
                      },
                    }
                  );
                }}
              >
                {createSection.isPending ? 'Adding...' : 'Add Section'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Question Dialog */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion?.id?.startsWith('c') ? 'Edit Question' : 'Add Question'}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion?.id?.startsWith('c') ? 'Update question in' : 'Add a question to'}{' '}
                {editingSection?.name}
              </DialogDescription>
            </DialogHeader>
            {editingQuestion && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea
                    value={editingQuestion.question}
                    onChange={e =>
                      setEditingQuestion({
                        ...editingQuestion,
                        question: e.target.value,
                      })
                    }
                    placeholder="Enter your question..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={editingQuestion.type}
                      onValueChange={(value: any) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                        <SelectItem value="scale">Scale (1-10)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Switch
                      checked={editingQuestion.required}
                      onCheckedChange={checked =>
                        setEditingQuestion({
                          ...editingQuestion,
                          required: checked,
                        })
                      }
                    />
                    <div>
                      <Label>Required</Label>
                      <p className="text-xs text-muted-foreground">User must answer this</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-weight">Weight (0-100)</Label>
                  <Input
                    id="question-weight"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={(editingQuestion as any).weight || 1.0}
                    onChange={e => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        setEditingQuestion({
                          ...editingQuestion,
                          weight: value,
                        } as any);
                      }
                    }}
                    placeholder="1.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Importance weight for scoring (higher = more important). Questions should sum to 100.
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-purple-500/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      AI Analysis Prompt (Optional)
                    </Label>
                    <span
                      className={`text-xs ${
                        (editingQuestion.aiPrompt?.length || 0) > 900
                          ? 'text-red-500 font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {editingQuestion.aiPrompt?.length || 0} / 1000
                    </span>
                  </div>
                  <Textarea
                    value={editingQuestion.aiPrompt || ''}
                    onChange={e =>
                      setEditingQuestion({
                        ...editingQuestion,
                        aiPrompt: e.target.value,
                      })
                    }
                    maxLength={1000}
                    placeholder="Describe what the AI should analyze about this response..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This prompt will guide the AI in analyzing user responses
                  </p>
                  {(editingQuestion.aiPrompt?.length || 0) > 900 && (
                    <p className="text-xs text-red-500">
                      Approaching character limit ({1000 - (editingQuestion.aiPrompt?.length || 0)}{' '}
                      remaining)
                    </p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={createQuestion.isPending || updateQuestion.isPending}
                onClick={() => {
                  if (!editingQuestion || !editingSection) return;

                  const isEditing = editingQuestion.id?.startsWith('c');

                  if (isEditing) {
                    // Update existing question
                    updateQuestion.mutate(
                      {
                        id: editingQuestion.id,
                        data: {
                          text: editingQuestion.question,
                          type: editingQuestion.type.toUpperCase() as any,
                          order: editingQuestion.order,
                          required: editingQuestion.required,
                          aiPromptHint: editingQuestion.aiPrompt,
                          weight: (editingQuestion as any).weight || 1.0,
                        },
                      },
                      {
                        onSuccess: () => {
                          setIsQuestionDialogOpen(false);
                          setEditingQuestion(null);
                          setEditingSection(null);
                        },
                      }
                    );
                  } else {
                    // Create new question
                    createQuestion.mutate(
                      {
                        sectionId: editingSection.id,
                        data: {
                          text: editingQuestion.question,
                          type: editingQuestion.type.toUpperCase() as any,
                          order: editingQuestion.order,
                          required: editingQuestion.required,
                          aiPromptHint: editingQuestion.aiPrompt,
                          weight: (editingQuestion as any).weight || 1.0,
                        },
                      },
                      {
                        onSuccess: () => {
                          setIsQuestionDialogOpen(false);
                          setEditingQuestion(null);
                          setEditingSection(null);
                        },
                      }
                    );
                  }
                }}
              >
                {createQuestion.isPending || updateQuestion.isPending
                  ? editingQuestion?.id?.startsWith('c')
                    ? 'Updating...'
                    : 'Adding...'
                  : editingQuestion?.id?.startsWith('c')
                    ? 'Update Question'
                    : 'Add Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default TemplateManagement;
