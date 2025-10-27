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
  creditCost: z.number().int().min(0).optional(),
  scoringCriteria: z.any().optional(), // JSON field
  aiPrompts: z.any().optional(), // JSON field
});

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  version: z.string().optional(),
  isActive: z.boolean().optional(),
  creditCost: z.number().int().min(0).optional(),
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

const UpdateSectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  order: z.number().min(0).optional(),
  weight: z.number().min(0).max(100).optional(),
});

const UpdateQuestionSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  type: z.nativeEnum(QuestionType).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  helpText: z.string().optional(),
  aiPromptHint: z.string().max(1000).optional(),
  weight: z.number().min(0).max(100).optional(),
  order: z.number().min(0).optional(),
  categoryTag: z.string().optional(),
  scoringRules: z.any().optional(),
  validation: z.any().optional(),
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
          creditCost: validatedData.creditCost,
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
          creditCost: validatedData.creditCost,
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
   * Update section
   */
  async updateSection(
    id: string,
    data: z.infer<typeof UpdateSectionSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseSection>> {
    try {
      const validatedData = await this.validateInput(UpdateSectionSchema, data);

      // Only admins can modify templates
      this.requirePermission(context, [UserRole.ADMIN]);

      // Verify section exists and get template
      const section = await this.prisma.section.findUnique({
        where: { id },
        include: { template: { select: { id: true, isActive: true } } },
      });

      if (!section) {
        throw this.createError('Section not found', 404, 'SECTION_NOT_FOUND');
      }

      if (!section.template.isActive) {
        throw this.createError('Cannot modify inactive template', 400, 'TEMPLATE_INACTIVE');
      }

      // Update section
      const updatedSection = await this.prisma.section.update({
        where: { id },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          order: validatedData.order,
          weight: validatedData.weight,
        },
      });

      await this.logAudit(
        {
          action: 'TEMPLATE_SECTION_UPDATED',
          entity: 'Section',
          entityId: id,
          oldValues: { title: section.title, weight: section.weight, order: section.order },
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Section updated successfully', { sectionId: id });

      return this.createResponse(true, updatedSection, 'Section updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateSection');
    }
  }

  /**
   * Delete section
   */
  async deleteSection(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      // Only admins can modify templates
      this.requirePermission(context, [UserRole.ADMIN]);

      // Verify section exists and get template + question count
      const section = await this.prisma.section.findUnique({
        where: { id },
        include: {
          template: { select: { id: true, isActive: true } },
          _count: { select: { questions: true } },
        },
      });

      if (!section) {
        throw this.createError('Section not found', 404, 'SECTION_NOT_FOUND');
      }

      if (!section.template.isActive) {
        throw this.createError('Cannot modify inactive template', 400, 'TEMPLATE_INACTIVE');
      }

      // Delete section (cascade to questions handled by Prisma schema)
      await this.prisma.section.delete({ where: { id } });

      await this.logAudit(
        {
          action: 'TEMPLATE_SECTION_DELETED',
          entity: 'Section',
          entityId: id,
          oldValues: { title: section.title, questionCount: section._count.questions },
        },
        context
      );

      this.logger.info('Section deleted successfully', { sectionId: id, cascadedQuestions: section._count.questions });

      return this.createResponse(true, undefined, `Section and ${section._count.questions} questions deleted successfully`);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteSection');
    }
  }

  /**
   * Update question
   */
  async updateQuestion(
    id: string,
    data: z.infer<typeof UpdateQuestionSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseQuestion>> {
    try {
      const validatedData = await this.validateInput(UpdateQuestionSchema, data);

      // Only admins can modify templates
      this.requirePermission(context, [UserRole.ADMIN]);

      // Verify question exists and get template via section
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          section: {
            include: { template: { select: { id: true, isActive: true } } },
          },
        },
      });

      if (!question) {
        throw this.createError('Question not found', 404, 'QUESTION_NOT_FOUND');
      }

      if (!question.section.template.isActive) {
        throw this.createError('Cannot modify inactive template', 400, 'TEMPLATE_INACTIVE');
      }

      // Update question
      const updatedQuestion = await this.prisma.question.update({
        where: { id },
        data: {
          text: validatedData.text,
          type: validatedData.type,
          required: validatedData.required,
          options: validatedData.options,
          helpText: validatedData.helpText,
          aiPromptHint: validatedData.aiPromptHint,
          weight: validatedData.weight,
          order: validatedData.order,
          categoryTag: validatedData.categoryTag,
          scoringRules: validatedData.scoringRules,
          validation: validatedData.validation,
        },
      });

      await this.logAudit(
        {
          action: 'TEMPLATE_QUESTION_UPDATED',
          entity: 'Question',
          entityId: id,
          oldValues: { text: question.text, weight: question.weight, order: question.order },
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Question updated successfully', { questionId: id });

      return this.createResponse(true, updatedQuestion, 'Question updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateQuestion');
    }
  }

  /**
   * Delete question
   */
  async deleteQuestion(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      // Only admins can modify templates
      this.requirePermission(context, [UserRole.ADMIN]);

      // Verify question exists and get template via section
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          section: {
            include: { template: { select: { id: true, isActive: true } } },
          },
        },
      });

      if (!question) {
        throw this.createError('Question not found', 404, 'QUESTION_NOT_FOUND');
      }

      if (!question.section.template.isActive) {
        throw this.createError('Cannot modify inactive template', 400, 'TEMPLATE_INACTIVE');
      }

      // Delete question
      await this.prisma.question.delete({ where: { id } });

      await this.logAudit(
        {
          action: 'TEMPLATE_QUESTION_DELETED',
          entity: 'Question',
          entityId: id,
          oldValues: { text: question.text, sectionId: question.sectionId },
        },
        context
      );

      this.logger.info('Question deleted successfully', { questionId: id });

      return this.createResponse(true, undefined, 'Question deleted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteQuestion');
    }
  }

  /**
   * Get comprehensive template statistics
   */
  async getTemplateStats(
    context?: ServiceContext
  ): Promise<ApiResponse<any>> {
    try {
      // Basic counts
      const [totalCount, activeCount, templates] = await Promise.all([
        this.prisma.template.count(),
        this.prisma.template.count({ where: { isActive: true } }),
        this.prisma.template.findMany({
          select: {
            id: true,
            name: true,
            category: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                sections: true,
                assessments: true,
              },
            },
          },
        }),
      ]);

      // Category distribution
      const categoryCounts: Record<string, number> = {};
      templates.forEach(template => {
        categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
      });

      // Total questions count
      const questionCount = await this.prisma.question.count();

      // Get assessment statistics per template
      const assessmentStats = await this.prisma.assessment.groupBy({
        by: ['templateId', 'status'],
        _count: true,
      });

      // Calculate template usage and completion rates
      const templateUsage: Record<string, { total: number; completed: number }> = {};
      assessmentStats.forEach(stat => {
        if (!templateUsage[stat.templateId]) {
          templateUsage[stat.templateId] = { total: 0, completed: 0 };
        }
        templateUsage[stat.templateId].total += stat._count;
        if (stat.status === 'COMPLETED') {
          templateUsage[stat.templateId].completed += stat._count;
        }
      });

      // Get average completion times for completed assessments
      const completionTimes = await this.prisma.assessment.groupBy({
        by: ['templateId'],
        where: {
          status: 'COMPLETED',
          completedAt: { not: null },
        },
        _avg: {
          // Note: We'd need a computed field for duration in minutes
          // For now, we'll skip this or calculate it client-side
        },
      });

      // Calculate most and least popular templates
      const templatesWithUsage = templates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        usageCount: templateUsage[t.id]?.total || 0,
        completionRate: templateUsage[t.id]
          ? (templateUsage[t.id].completed / templateUsage[t.id].total) * 100
          : 0,
        isActive: t.isActive,
        sectionCount: t._count.sections,
        createdAt: t.createdAt,
      }));

      // Sort by usage
      const sortedByUsage = [...templatesWithUsage].sort((a, b) => b.usageCount - a.usageCount);
      const mostPopular = sortedByUsage.slice(0, 5);
      const leastUsed = sortedByUsage.slice(-5).reverse();

      // Calculate health indicators
      const needsAttention = templatesWithUsage.filter(t => {
        const hasLowCompletion = t.usageCount > 0 && t.completionRate < 50;
        const hasNoRecentUsage = t.usageCount === 0 &&
          new Date(t.createdAt).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
        return hasLowCompletion || hasNoRecentUsage;
      });

      // Template performance metrics
      const performanceMetrics = templatesWithUsage.map(t => ({
        templateId: t.id,
        templateName: t.name,
        category: t.category,
        totalUses: t.usageCount,
        completionRate: t.completionRate,
        isActive: t.isActive,
        sectionCount: t.sectionCount,
      }));

      const stats = {
        // Basic counts
        totalTemplates: totalCount,
        activeTemplates: activeCount,
        categoryCounts,
        averageQuestions: templates.length > 0 ? Math.round(questionCount / templates.length) : 0,

        // Usage statistics
        totalAssessments: Object.values(templateUsage).reduce((sum, t) => sum + t.total, 0),
        completedAssessments: Object.values(templateUsage).reduce((sum, t) => sum + t.completed, 0),
        averageCompletionRate: templatesWithUsage.length > 0
          ? templatesWithUsage.reduce((sum, t) => sum + t.completionRate, 0) / templatesWithUsage.length
          : 0,

        // Popular templates
        mostPopularTemplates: mostPopular,
        leastUsedTemplates: leastUsed,

        // Health indicators
        templatesNeedingAttention: needsAttention.length,
        needsAttentionList: needsAttention.slice(0, 5), // Top 5 that need attention

        // Performance metrics
        performanceMetrics: performanceMetrics.sort((a, b) => a.completionRate - b.completionRate).slice(0, 10),
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

  /**
   * Toggle library flag for section or question
   */
  async toggleLibraryFlag(
    type: 'section' | 'question',
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<any>> {
    try {
      // Only admins can manage library
      this.requirePermission(context, [UserRole.ADMIN]);

      if (type === 'section') {
        const section = await this.prisma.section.findUnique({
          where: { id },
        });

        if (!section) {
          throw this.createError('Section not found', 404, 'SECTION_NOT_FOUND');
        }

        const updated = await this.prisma.section.update({
          where: { id },
          data: { isLibrary: !(section as any).isLibrary },
        });

        await this.logAudit(
          {
            action: (section as any).isLibrary ? 'SECTION_REMOVED_FROM_LIBRARY' : 'SECTION_MARKED_LIBRARY',
            entity: 'Section',
            entityId: id,
          },
          context
        );

        return this.createResponse(
          true,
          updated,
          `Section ${(updated as any).isLibrary ? 'added to' : 'removed from'} library`
        );
      } else {
        const question = await this.prisma.question.findUnique({
          where: { id },
        });

        if (!question) {
          throw this.createError('Question not found', 404, 'QUESTION_NOT_FOUND');
        }

        const updated = await this.prisma.question.update({
          where: { id },
          data: { isLibrary: !(question as any).isLibrary },
        });

        await this.logAudit(
          {
            action: (question as any).isLibrary ? 'QUESTION_REMOVED_FROM_LIBRARY' : 'QUESTION_MARKED_LIBRARY',
            entity: 'Question',
            entityId: id,
          },
          context
        );

        return this.createResponse(
          true,
          updated,
          `Question ${(updated as any).isLibrary ? 'added to' : 'removed from'} library`
        );
      }
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'toggleLibraryFlag');
    }
  }

  /**
   * Get library sections with pagination
   */
  async getLibrarySections(
    filters?: { search?: string; page?: number; limit?: number },
    context?: ServiceContext
  ): Promise<ApiResponse<any[]>> {
    try {
      this.requirePermission(context, [UserRole.ADMIN]);

      const page = filters?.page || 1;
      const limit = Math.min(filters?.limit || 50, 100);
      const skip = (page - 1) * limit;

      const where: any = { isLibrary: true };

      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const sections = await this.prisma.section.findMany({
        where,
        include: {
          template: {
            select: { id: true, name: true, category: true },
          },
          _count: { select: { questions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return this.createResponse(true, sections, `Found ${sections.length} library sections`);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getLibrarySections');
    }
  }

  /**
   * Get library questions with pagination
   */
  async getLibraryQuestions(
    filters?: { search?: string; categoryTag?: string; page?: number; limit?: number },
    context?: ServiceContext
  ): Promise<ApiResponse<any[]>> {
    try {
      this.requirePermission(context, [UserRole.ADMIN]);

      const page = filters?.page || 1;
      const limit = Math.min(filters?.limit || 50, 100);
      const skip = (page - 1) * limit;

      const where: any = { isLibrary: true };

      if (filters?.search) {
        where.OR = [
          { text: { contains: filters.search, mode: 'insensitive' } },
          { helpText: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.categoryTag) {
        where.categoryTag = filters.categoryTag;
      }

      const questions = await this.prisma.question.findMany({
        where,
        include: {
          section: {
            include: {
              template: {
                select: { id: true, name: true, category: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return this.createResponse(true, questions, `Found ${questions.length} library questions`);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getLibraryQuestions');
    }
  }

  /**
   * Copy section or question from library
   */
  async copyFromLibrary(
    type: 'section' | 'question',
    sourceId: string,
    targetId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<any>> {
    try {
      this.requirePermission(context, [UserRole.ADMIN]);

      if (type === 'section') {
        const source = await this.prisma.section.findUnique({
          where: { id: sourceId },
          include: { questions: true },
        });

        if (!source) {
          throw this.createError('Source section not found', 404, 'SECTION_NOT_FOUND');
        }

        if (!(source as any).isLibrary) {
          throw this.createError('Section is not in library', 400, 'NOT_LIBRARY_ITEM');
        }

        // Get next order
        const maxOrder = await this.prisma.section.findFirst({
          where: { templateId: targetId },
          orderBy: { order: 'desc' },
        });

        const newSection = await this.prisma.section.create({
          data: {
            templateId: targetId,
            title: source.title,
            description: source.description,
            weight: source.weight,
            regulatoryPriority: source.regulatoryPriority,
            order: (maxOrder?.order || 0) + 1,
            isRequired: source.isRequired,
            isLibrary: false,
          },
        });

        // Copy questions
        if (source.questions.length > 0) {
          await this.prisma.question.createMany({
            data: source.questions.map((q, idx) => ({
              sectionId: newSection.id,
              text: q.text,
              type: q.type,
              required: q.required,
              options: q.options,
              validation: q.validation,
              helpText: q.helpText,
              order: idx + 1,
              categoryTag: q.categoryTag,
              tags: q.tags,
              weight: q.weight,
              isFoundational: q.isFoundational,
              aiPromptHint: q.aiPromptHint,
              scoringRules: q.scoringRules,
              isLibrary: false,
            })),
          });
        }

        await this.logAudit(
          {
            action: 'SECTION_COPIED_FROM_LIBRARY',
            entity: 'Section',
            entityId: newSection.id,
            metadata: { sourceId, targetTemplateId: targetId },
          },
          context
        );

        return this.createResponse(true, newSection, 'Section copied from library');
      } else {
        const source = await this.prisma.question.findUnique({
          where: { id: sourceId },
        });

        if (!source) {
          throw this.createError('Source question not found', 404, 'QUESTION_NOT_FOUND');
        }

        if (!(source as any).isLibrary) {
          throw this.createError('Question is not in library', 400, 'NOT_LIBRARY_ITEM');
        }

        const maxOrder = await this.prisma.question.findFirst({
          where: { sectionId: targetId },
          orderBy: { order: 'desc' },
        });

        const newQuestion = await this.prisma.question.create({
          data: {
            sectionId: targetId,
            text: source.text,
            type: source.type,
            required: source.required,
            options: source.options,
            validation: source.validation,
            helpText: source.helpText,
            order: (maxOrder?.order || 0) + 1,
            categoryTag: source.categoryTag,
            tags: source.tags,
            weight: source.weight,
            isFoundational: source.isFoundational,
            aiPromptHint: source.aiPromptHint,
            scoringRules: source.scoringRules,
            isLibrary: false,
          },
        });

        await this.logAudit(
          {
            action: 'QUESTION_COPIED_FROM_LIBRARY',
            entity: 'Question',
            entityId: newQuestion.id,
            metadata: { sourceId, targetSectionId: targetId },
          },
          context
        );

        return this.createResponse(true, newQuestion, 'Question copied from library');
      }
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'copyFromLibrary');
    }
  }
}