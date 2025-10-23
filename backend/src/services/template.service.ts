/**
 * Template Management Service
 * Handles CRUD operations for assessment templates, sections, and questions
 * Supports hierarchical template structure with AI prompt hints and scoring rules
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseTemplate,
  DatabaseSection,
  DatabaseQuestion,
  TemplateCategory,
  QuestionType,
  UserRole,
} from '../types/database';

// Validation schemas
const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  slug: z.string().min(1, 'Template slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  category: z.nativeEnum(TemplateCategory),
  description: z.string().min(1, 'Description is required').max(1000),
  version: z.string().default('1.0'),
  isActive: z.boolean().default(true),
  scoringCriteria: z.any().optional(), // JSON field
  aiPrompts: z.any().optional(), // JSON field
});

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  version: z.string().optional(),
  isActive: z.boolean().optional(),
  scoringCriteria: z.any().optional(), // JSON field
  aiPrompts: z.any().optional(), // JSON field
});

const CreateSectionSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  title: z.string().min(1, 'Section title is required').max(200),
  description: z.string().optional(),
  order: z.number().min(0),
  weight: z.number().default(1.0).optional(),
});

const CreateQuestionSchema = z.object({
  sectionId: z.string().cuid('Invalid section ID'),
  text: z.string().min(1, 'Question text is required').max(1000),
  type: z.nativeEnum(QuestionType),
  order: z.number().min(0),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  helpText: z.string().optional(),
  aiPromptHint: z.string().optional(),
  scoringRules: z.any().optional(), // JSON field
  validation: z.any().optional(), // JSON field
  categoryTag: z.string().optional(),
  weight: z.number().default(1.0).optional(),
});

const BulkCreateQuestionsSchema = z.object({
  questions: z.array(CreateQuestionSchema),
});

export interface TemplateWithStructure extends DatabaseTemplate {
  sections: Array<DatabaseSection & {
    questions: DatabaseQuestion[];
  }>;
  _count: {
    sections: number;
    questions?: number;
  };
  estimatedMinutes: number;
  instructions?: string;
}

export interface QuestionWithSection extends DatabaseQuestion {
  section: {
    id: string;
    title: string;
    templateId: string;
  };
}

export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  categoryCounts: Record<string, number>;
  averageQuestions: number;
  averageMinutes: number;
}

export class TemplateService extends BaseService {
  /**
   * Create a new assessment template
   */
  async createTemplate(
    data: z.infer<typeof CreateTemplateSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseTemplate>> {
    try {
      const validatedData = await this.validateInput(CreateTemplateSchema, data);

      // Only admins can create templates
      this.requirePermission(context, [UserRole.ADMIN]);

      // Check if slug already exists
      const existingTemplate = await this.prisma.template.findUnique({
        where: { slug: validatedData.slug },
        select: { id: true },
      });

      if (existingTemplate) {
        throw this.createError('Template slug already exists', 409, 'SLUG_EXISTS');
      }

      const template = await this.prisma.template.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          category: validatedData.category,
          description: validatedData.description,
          version: validatedData.version,
          isActive: validatedData.isActive,
          scoringCriteria: validatedData.scoringCriteria || undefined,
          aiPrompts: validatedData.aiPrompts || undefined,
          createdBy: context?.userId!,
        },
      });

      await this.logAudit(
        {
          action: 'TEMPLATE_CREATED',
          entity: 'Template',
          entityId: template.id,
          newValues: {
            name: template.name,
            category: template.category,
            slug: template.slug,
          },
        },
        context
      );

      this.logger.info('Template created successfully', {
        templateId: template.id,
        name: template.name,
        category: template.category,
      });

      return this.createResponse(true, template, 'Template created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createTemplate');
    }
  }

  /**
   * Get template by ID with full structure
   */
  async getTemplateById(
    id: string,
    includeInactive: boolean = false,
    context?: ServiceContext
  ): Promise<ApiResponse<TemplateWithStructure>> {
    try {
      const whereClause: any = { id };
      if (!includeInactive) {
        whereClause.isActive = true;
      }

      const template = await this.prisma.template.findUnique({
        where: whereClause,
        include: {
          sections: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      if (!template) {
        throw this.createError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
      }

      // Calculate total questions count
      const totalQuestions = template.sections.reduce(
        (total, section) => total + section.questions.length,
        0
      );

      const templateWithCount = {
        ...template,
        _count: {
          ...template._count,
          questions: totalQuestions,
        },
      };

      return this.createResponse(true, templateWithCount);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getTemplateById');
    }
  }

  /**
   * Get template by slug with full structure
   */
  async getTemplateBySlug(
    slug: string,
    includeInactive: boolean = false,
    context?: ServiceContext
  ): Promise<ApiResponse<TemplateWithStructure>> {
    try {
      const whereClause: any = { slug };
      if (!includeInactive) {
        whereClause.isActive = true;
      }

      const template = await this.prisma.template.findUnique({
        where: whereClause,
        include: {
          sections: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      if (!template) {
        throw this.createError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
      }

      // Calculate total questions count
      const totalQuestions = template.sections.reduce(
        (total, section) => total + section.questions.length,
        0
      );

      const templateWithCount = {
        ...template,
        _count: {
          ...template._count,
          questions: totalQuestions,
        },
      };

      return this.createResponse(true, templateWithCount);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getTemplateBySlug');
    }
  }

  /**
   * List templates with pagination and filtering
   */
  async listTemplates(
    options: QueryOptions & {
      category?: TemplateCategory;
      includeInactive?: boolean;
      search?: string;
    } = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<TemplateWithStructure>>> {
    try {
      const queryOptions = this.buildQueryOptions(options);

      // Add template-specific filters
      if (options.category) {
        queryOptions.where.category = options.category;
      }

      if (!options.includeInactive) {
        queryOptions.where.isActive = true;
      }

      if (options.search) {
        queryOptions.where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { tags: { has: options.search } },
        ];
      }

      const [templates, total] = await Promise.all([
        this.prisma.template.findMany({
          ...queryOptions,
          include: {
            sections: {
              include: {
                questions: {
                  select: { id: true }, // Only count, don't fetch full questions
                },
              },
            },
            _count: {
              select: {
                sections: true,
              },
            },
          },
        }),
        this.prisma.template.count({ where: queryOptions.where }),
      ]);

      // Transform to include question counts
      const templatesWithCounts = templates.map(template => {
        const totalQuestions = template.sections.reduce(
          (total, section) => total + section.questions.length,
          0
        );

        return {
          ...template,
          sections: template.sections.map(section => ({
            ...section,
            questions: [], // Don't return full questions in list view
          })),
          _count: {
            ...template._count,
            questions: totalQuestions,
          },
        };
      });

      const paginatedResponse = this.createPaginatedResponse(
        templatesWithCounts,
        total,
        options.page || 1,
        options.limit || 10
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'listTemplates');
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: z.infer<typeof UpdateTemplateSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseTemplate>> {
    try {
      const validatedData = await this.validateInput(UpdateTemplateSchema, data);

      // Only admins can update templates
      this.requirePermission(context, [UserRole.ADMIN]);

      const existingTemplate = await this.prisma.template.findUnique({
        where: { id },
        select: { id: true, name: true, version: true },
      });

      if (!existingTemplate) {
        throw this.createError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
      }

      const updatedTemplate = await this.prisma.template.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          version: validatedData.version,
          isActive: validatedData.isActive,
          scoringCriteria: validatedData.scoringCriteria || undefined,
          aiPrompts: validatedData.aiPrompts || undefined,
        },
      });

      await this.logAudit(
        {
          action: 'TEMPLATE_UPDATED',
          entity: 'Template',
          entityId: id,
          oldValues: { name: existingTemplate.name, version: existingTemplate.version },
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Template updated successfully', { templateId: id });

      return this.createResponse(true, updatedTemplate, 'Template updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateTemplate');
    }
  }

  /**
   * Delete template (soft delete by setting isActive to false)
   */
  async deleteTemplate(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      // Only admins can delete templates
      this.requirePermission(context, [UserRole.ADMIN]);

      const existingTemplate = await this.prisma.template.findUnique({
        where: { id },
        select: { id: true, name: true, isActive: true },
      });

      if (!existingTemplate) {
        throw this.createError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
      }

      if (!existingTemplate.isActive) {
        throw this.createError('Template already deleted', 400, 'TEMPLATE_ALREADY_DELETED');
      }

      // Check if template is being used in any assessments
      const assessmentCount = await this.prisma.assessment.count({
        where: { templateId: id },
      });

      if (assessmentCount > 0) {
        throw this.createError(
          `Cannot delete template: ${assessmentCount} assessments are using this template`,
          400,
          'TEMPLATE_IN_USE',
          { assessmentCount }
        );
      }

      await this.prisma.template.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      await this.logAudit(
        {
          action: 'TEMPLATE_DELETED',
          entity: 'Template',
          entityId: id,
          oldValues: { name: existingTemplate.name, isActive: true },
          newValues: { isActive: false },
        },
        context
      );

      this.logger.info('Template deleted successfully', { templateId: id });

      return this.createResponse(true, undefined, 'Template deleted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteTemplate');
    }
  }

  /**
   * Create template section
   */
  async createSection(
    data: z.infer<typeof CreateSectionSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseSection>> {
    try {
      const validatedData = await this.validateInput(CreateSectionSchema, data);

      // Only admins can modify templates
      this.requirePermission(context, [UserRole.ADMIN]);

      // Verify template exists
      const template = await this.prisma.template.findUnique({
        where: { id: validatedData.templateId },
        select: { id: true, isActive: true },
      });

      if (!template) {
        throw this.createError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
      }

      if (!template.isActive) {
        throw this.createError('Cannot modify inactive template', 400, 'TEMPLATE_INACTIVE');
      }

      const section = await this.prisma.section.create({
        data: {
          templateId: validatedData.templateId,
          title: validatedData.title,
          description: validatedData.description || null,
          order: validatedData.order,
          weight: validatedData.weight || 1.0,
        },
      });

      await this.logAudit(
        {
          action: 'TEMPLATE_SECTION_CREATED',
          entity: 'Section',
          entityId: section.id,
          newValues: {
            templateId: section.templateId,
            title: section.title,
            order: section.order,
          },
        },
        context
      );

      this.logger.info('Template section created successfully', {
        sectionId: section.id,
        templateId: validatedData.templateId,
      });

      return this.createResponse(true, section, 'Section created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createSection');
    }
  }

  /**
   * Create template question
   */
  async createQuestion(
    data: z.infer<typeof CreateQuestionSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseQuestion>> {
    try {
      const validatedData = await this.validateInput(CreateQuestionSchema, data);

      // Only admins can modify templates
      this.requirePermission(context, [UserRole.ADMIN]);

      // Verify section exists and template is active
      const section = await this.prisma.section.findUnique({
        where: { id: validatedData.sectionId },
        include: {
          template: { select: { id: true, isActive: true } },
        },
      });

      if (!section) {
        throw this.createError('Section not found', 404, 'SECTION_NOT_FOUND');
      }

      if (!section.template.isActive) {
        throw this.createError('Cannot modify inactive template', 400, 'TEMPLATE_INACTIVE');
      }

      const question = await this.prisma.question.create({
        data: {
          sectionId: validatedData.sectionId,
          text: validatedData.text,
          type: validatedData.type,
          order: validatedData.order,
          required: validatedData.required,
          options: validatedData.options || [],
          helpText: validatedData.helpText || null,
          aiPromptHint: validatedData.aiPromptHint || null,
          scoringRules: validatedData.scoringRules || undefined,
          validation: validatedData.validation || undefined,
          categoryTag: validatedData.categoryTag || null,
          weight: validatedData.weight || 1.0,
        },
      });

      await this.logAudit(
        {
          action: 'TEMPLATE_QUESTION_CREATED',
          entity: 'Question',
          entityId: question.id,
          newValues: {
            sectionId: question.sectionId,
            text: question.text,
            type: question.type,
            order: question.order,
          },
        },
        context
      );

      this.logger.info('Template question created successfully', {
        questionId: question.id,
        sectionId: validatedData.sectionId,
      });

      return this.createResponse(true, question, 'Question created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createQuestion');
    }
  }

  /**
   * Bulk create questions for a section
   */
  async bulkCreateQuestions(
    data: z.infer<typeof BulkCreateQuestionsSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseQuestion[]>> {
    try {
      const validatedData = await this.validateInput(BulkCreateQuestionsSchema, data);

      // Only admins can modify templates
      this.requirePermission(context, [UserRole.ADMIN]);

      if (validatedData.questions.length === 0) {
        throw this.createError('No questions provided', 400, 'NO_QUESTIONS');
      }

      // Verify all questions belong to the same section and it's active
      const sectionIds = [...new Set(validatedData.questions.map(q => q.sectionId))];
      if (sectionIds.length > 1) {
        throw this.createError('All questions must belong to the same section', 400, 'MIXED_SECTIONS');
      }

      const section = await this.prisma.section.findUnique({
        where: { id: sectionIds[0] },
        include: {
          template: { select: { id: true, isActive: true } },
        },
      });

      if (!section) {
        throw this.createError('Section not found', 404, 'SECTION_NOT_FOUND');
      }

      if (!section.template.isActive) {
        throw this.createError('Cannot modify inactive template', 400, 'TEMPLATE_INACTIVE');
      }

      const result = await this.executeTransaction(async (tx) => {
        const questions = [];
        
        for (const questionData of validatedData.questions) {
          const question = await tx.question.create({
            data: {
              sectionId: questionData.sectionId,
              text: questionData.text,
              type: questionData.type,
              order: questionData.order,
              required: questionData.required,
              options: questionData.options || [],
              helpText: questionData.helpText || null,
              aiPromptHint: questionData.aiPromptHint || null,
              scoringRules: questionData.scoringRules || undefined,
              validation: questionData.validation || undefined,
              categoryTag: questionData.categoryTag || null,
              weight: questionData.weight || 1.0,
            },
          });
          questions.push(question);
        }

        return questions;
      });

      await this.logAudit(
        {
          action: 'TEMPLATE_QUESTIONS_BULK_CREATED',
          entity: 'Question',
          metadata: {
            sectionId: sectionIds[0],
            count: result.length,
          },
        },
        context
      );

      this.logger.info('Template questions created in bulk successfully', {
        sectionId: sectionIds[0],
        count: result.length,
      });

      return this.createResponse(true, result, `${result.length} questions created successfully`);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'bulkCreateQuestions');
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(
    context?: ServiceContext
  ): Promise<ApiResponse<TemplateStats>> {
    try {
      const [totalCount, activeCount, templates] = await Promise.all([
        this.prisma.template.count(),
        this.prisma.template.count({ where: { isActive: true } }),
        this.prisma.template.findMany({
          select: {
            category: true,
            _count: {
              select: { sections: true },
            },
          },
        }),
      ]);

      const categoryCounts: Record<string, number> = {};
      let totalMinutes = 0;
      let totalQuestions = 0;

      templates.forEach(template => {
        // Count categories
        categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
        
        // Sum minutes
        
        // Count questions (this is a simplified count, might need adjustment based on actual schema)
        // We'll need to do a proper count query for questions
      });

      // Get actual question counts
      const questionCount = await this.prisma.question.count();

      const stats: TemplateStats = {
        totalTemplates: totalCount,
        activeTemplates: activeCount,
        categoryCounts,
        averageQuestions: templates.length > 0 ? questionCount / templates.length : 0,
        averageMinutes: 0, // Not tracked in new schema
      };

      return this.createResponse(true, stats);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getTemplateStats');
    }
  }

  /**
   * Search questions across templates
   */
  async searchQuestions(
    query: string,
    templateId?: string,
    context?: ServiceContext
  ): Promise<ApiResponse<QuestionWithSection[]>> {
    try {
      if (!query || query.length < 3) {
        throw this.createError('Query must be at least 3 characters long', 400, 'QUERY_TOO_SHORT');
      }

      const whereClause: any = {
        OR: [
          { text: { contains: query, mode: 'insensitive' } },
          { helpText: { contains: query, mode: 'insensitive' } },
        ],
        section: {
          template: { isActive: true },
        },
      };

      if (templateId) {
        whereClause.section.template.id = templateId;
      }

      const questions = await this.prisma.question.findMany({
        where: whereClause,
        include: {
          section: {
            select: {
              id: true,
              title: true,
              templateId: true,
            },
          },
        },
        orderBy: [
          { section: { order: 'asc' } },
          { order: 'asc' },
        ],
        take: 50, // Limit results
      });

      return this.createResponse(true, questions);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'searchQuestions');
    }
  }
}