/**
 * Answer Management Service
 * Handles CRUD operations for assessment answers including scoring and status management
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseAnswer,
  AnswerStatus,
  UserRole,
} from '../types/database';

// Validation schemas
const CreateAnswerSchema = z.object({
  assessmentId: z.string().cuid('Invalid assessment ID'),
  questionId: z.string().cuid('Invalid question ID'),
  score: z.number().min(0).max(5),
  explanation: z.string().min(1).max(5000),
  sourceReference: z.string().optional().nullable(),
  status: z.nativeEnum(AnswerStatus).default(AnswerStatus.IN_PROGRESS),
});

const UpdateAnswerSchema = z.object({
  score: z.number().min(0).max(5).optional(),
  explanation: z.string().min(1).max(5000).optional(),
  sourceReference: z.string().optional().nullable(),
  status: z.nativeEnum(AnswerStatus).optional(),
});

const BulkCreateAnswersSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().cuid('Invalid question ID'),
    score: z.number().min(0).max(5),
    explanation: z.string().min(1).max(5000),
    sourceReference: z.string().optional().nullable(),
    status: z.nativeEnum(AnswerStatus).default(AnswerStatus.IN_PROGRESS),
  })),
});

const UpdateAnswerStatusSchema = z.object({
  status: z.nativeEnum(AnswerStatus),
});

export interface AnswerWithDetails extends DatabaseAnswer {
  question: {
    id: string;
    text: string;
    type: string;
    required: boolean;
    categoryTag: string | null;
    weight: number;
    section: {
      id: string;
      title: string;
      order: number;
    };
  };
  assessment: {
    id: string;
    templateId: string;
    organizationId: string;
    status: string;
  };
}

export interface AnswerSummary {
  id: string;
  assessmentId: string;
  questionId: string;
  questionText: string;
  score: number;
  status: AnswerStatus;
  createdAt: Date;
  updatedAt: Date;
}

class AnswerService extends BaseService {
  /**
   * Create a new answer
   */
  async createAnswer(
    assessmentId: string,
    questionId: string,
    score: number,
    explanation: string,
    sourceReference?: string | null,
    status: AnswerStatus = AnswerStatus.IN_PROGRESS,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseAnswer>> {
    try {
      const validatedData = await this.validateInput(CreateAnswerSchema, {
        assessmentId,
        questionId,
        score,
        explanation,
        sourceReference,
        status,
      });

      // Verify assessment exists and user has permission
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          templateId: true,
          status: true,
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      if (
        context?.userId &&
        assessment.userId !== context.userId &&
        context.userRole !== UserRole.ADMIN
      ) {
        const userOrg = await this.prisma.organization.findFirst({
          where: { userId: context.userId },
          select: { id: true },
        });

        if (userOrg?.id !== assessment.organizationId) {
          throw this.createError('Unauthorized to add answers to this assessment', 403, 'UNAUTHORIZED');
        }
      }

      // Verify question belongs to the assessment's template
      const question = await this.prisma.question.findFirst({
        where: {
          id: questionId,
          section: {
            templateId: assessment.templateId,
          },
        },
        select: { id: true },
      });

      if (!question) {
        throw this.createError('Question not found in assessment template', 404, 'QUESTION_NOT_FOUND');
      }

      // Check if answer already exists
      const existingAnswer = await this.prisma.answer.findUnique({
        where: {
          assessmentId_questionId: {
            assessmentId: validatedData.assessmentId,
            questionId: validatedData.questionId,
          },
        },
      });

      let answer: DatabaseAnswer;

      if (existingAnswer) {
        // Update existing answer
        answer = await this.prisma.answer.update({
          where: { id: existingAnswer.id },
          data: {
            score: validatedData.score,
            explanation: validatedData.explanation,
            sourceReference: validatedData.sourceReference,
            status: validatedData.status,
          },
        });
      } else {
        // Create new answer
        answer = await this.prisma.answer.create({
          data: validatedData,
        });
      }

      await this.logAudit(
        {
          action: existingAnswer ? 'ANSWER_UPDATED' : 'ANSWER_CREATED',
          entity: 'Answer',
          entityId: answer.id,
          newValues: {
            assessmentId: answer.assessmentId,
            questionId: answer.questionId,
            score: answer.score,
            status: answer.status,
          },
        },
        context
      );

      this.logger.info(`Answer ${existingAnswer ? 'updated' : 'created'} successfully`, {
        answerId: answer.id,
        assessmentId,
        questionId,
      });

      return this.createResponse(
        true,
        answer,
        `Answer ${existingAnswer ? 'updated' : 'created'} successfully`
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createAnswer');
    }
  }

  /**
   * Update an existing answer
   */
  async updateAnswer(
    answerId: string,
    updates: z.infer<typeof UpdateAnswerSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseAnswer>> {
    try {
      const validatedData = await this.validateInput(UpdateAnswerSchema, updates);

      // Verify answer exists and get assessment details
      const existingAnswer = await this.prisma.answer.findUnique({
        where: { id: answerId },
        include: {
          assessment: {
            select: {
              id: true,
              userId: true,
              organizationId: true,
              status: true,
            },
          },
        },
      });

      if (!existingAnswer) {
        throw this.createError('Answer not found', 404, 'ANSWER_NOT_FOUND');
      }

      // Check permissions
      if (
        context?.userId &&
        existingAnswer.assessment.userId !== context.userId &&
        context.userRole !== UserRole.ADMIN
      ) {
        const userOrg = await this.prisma.organization.findFirst({
          where: { userId: context.userId },
          select: { id: true },
        });

        if (userOrg?.id !== existingAnswer.assessment.organizationId) {
          throw this.createError('Unauthorized to update this answer', 403, 'UNAUTHORIZED');
        }
      }

      // Don't allow updates if assessment is completed
      if (existingAnswer.assessment.status === 'COMPLETED') {
        throw this.createError('Cannot update answers for completed assessment', 400, 'ASSESSMENT_COMPLETED');
      }

      const updatedAnswer = await this.prisma.answer.update({
        where: { id: answerId },
        data: validatedData,
      });

      await this.logAudit(
        {
          action: 'ANSWER_UPDATED',
          entity: 'Answer',
          entityId: answerId,
          oldValues: {
            score: existingAnswer.score,
            status: existingAnswer.status,
          },
          newValues: validatedData,
        },
        context
      );

      this.logger.info('Answer updated successfully', { answerId });

      return this.createResponse(true, updatedAnswer, 'Answer updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateAnswer');
    }
  }

  /**
   * Get all answers for an assessment
   */
  async getAssessmentAnswers(
    assessmentId: string,
    options: QueryOptions & {
      status?: AnswerStatus;
      includeQuestionDetails?: boolean;
    } = {},
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseAnswer[] | AnswerWithDetails[]>> {
    try {
      // Verify assessment exists and user has permission
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: {
          id: true,
          userId: true,
          organizationId: true,
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      if (
        context?.userId &&
        assessment.userId !== context.userId &&
        context.userRole !== UserRole.ADMIN
      ) {
        const userOrg = await this.prisma.organization.findFirst({
          where: { userId: context.userId },
          select: { id: true },
        });

        if (userOrg?.id !== assessment.organizationId) {
          throw this.createError('Unauthorized to view assessment answers', 403, 'UNAUTHORIZED');
        }
      }

      const whereClause: any = { assessmentId };
      if (options.status) {
        whereClause.status = options.status;
      }

      let answers;

      if (options.includeQuestionDetails) {
        answers = await this.prisma.answer.findMany({
          where: whereClause,
          include: {
            question: {
              include: {
                section: {
                  select: {
                    id: true,
                    title: true,
                    order: true,
                  },
                },
              },
            },
            assessment: {
              select: {
                id: true,
                templateId: true,
                organizationId: true,
                status: true,
              },
            },
          },
          orderBy: [
            { question: { section: { order: 'asc' } } },
            { question: { order: 'asc' } },
          ],
        });
      } else {
        answers = await this.prisma.answer.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
        });
      }

      return this.createResponse(true, answers);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getAssessmentAnswers');
    }
  }

  /**
   * Bulk create or update answers
   */
  async bulkCreateAnswers(
    assessmentId: string,
    answers: Array<{
      questionId: string;
      score: number;
      explanation: string;
      sourceReference?: string | null;
      status?: AnswerStatus;
    }>,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseAnswer[]>> {
    try {
      const validatedData = await this.validateInput(BulkCreateAnswersSchema, { answers });

      // Verify assessment exists and user has permission
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          templateId: true,
          status: true,
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      if (
        context?.userId &&
        assessment.userId !== context.userId &&
        context.userRole !== UserRole.ADMIN
      ) {
        const userOrg = await this.prisma.organization.findFirst({
          where: { userId: context.userId },
          select: { id: true },
        });

        if (userOrg?.id !== assessment.organizationId) {
          throw this.createError('Unauthorized to add answers to this assessment', 403, 'UNAUTHORIZED');
        }
      }

      // Don't allow updates if assessment is completed
      if (assessment.status === 'COMPLETED') {
        throw this.createError('Cannot add answers to completed assessment', 400, 'ASSESSMENT_COMPLETED');
      }

      // Verify all questions belong to the assessment's template
      const questionIds = validatedData.answers.map(a => a.questionId);
      const validQuestions = await this.prisma.question.findMany({
        where: {
          id: { in: questionIds },
          section: {
            templateId: assessment.templateId,
          },
        },
        select: { id: true },
      });

      const validQuestionIds = new Set(validQuestions.map(q => q.id));
      const invalidQuestions = questionIds.filter(id => !validQuestionIds.has(id));

      if (invalidQuestions.length > 0) {
        throw this.createError(
          `Invalid questions for this assessment: ${invalidQuestions.join(', ')}`,
          400,
          'INVALID_QUESTIONS'
        );
      }

      // Execute bulk operation in transaction
      const result = await this.executeTransaction(async (tx) => {
        const createdAnswers: DatabaseAnswer[] = [];

        for (const answerData of validatedData.answers) {
          // Check if answer already exists
          const existingAnswer = await tx.answer.findUnique({
            where: {
              assessmentId_questionId: {
                assessmentId,
                questionId: answerData.questionId,
              },
            },
          });

          let answer: DatabaseAnswer;

          if (existingAnswer) {
            // Update existing answer
            answer = await tx.answer.update({
              where: { id: existingAnswer.id },
              data: {
                score: answerData.score,
                explanation: answerData.explanation,
                sourceReference: answerData.sourceReference || null,
                status: answerData.status || AnswerStatus.IN_PROGRESS,
              },
            });
          } else {
            // Create new answer
            answer = await tx.answer.create({
              data: {
                assessmentId,
                questionId: answerData.questionId,
                score: answerData.score,
                explanation: answerData.explanation,
                sourceReference: answerData.sourceReference || null,
                status: answerData.status || AnswerStatus.IN_PROGRESS,
              },
            });
          }

          createdAnswers.push(answer);
        }

        // Update assessment status if needed
        if (assessment.status === 'DRAFT') {
          await tx.assessment.update({
            where: { id: assessmentId },
            data: { status: 'IN_PROGRESS' },
          });
        }

        return createdAnswers;
      });

      await this.logAudit(
        {
          action: 'ANSWERS_BULK_CREATED',
          entity: 'Answer',
          metadata: {
            assessmentId,
            count: result.length,
          },
        },
        context
      );

      this.logger.info('Answers created/updated in bulk successfully', {
        assessmentId,
        count: result.length,
      });

      return this.createResponse(true, result, `${result.length} answers processed successfully`);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'bulkCreateAnswers');
    }
  }

  /**
   * Update answer status
   */
  async updateAnswerStatus(
    answerId: string,
    status: AnswerStatus,
    context?: ServiceContext
  ): Promise<ApiResponse<DatabaseAnswer>> {
    try {
      const validatedData = await this.validateInput(UpdateAnswerStatusSchema, { status });

      // Verify answer exists and get assessment details
      const existingAnswer = await this.prisma.answer.findUnique({
        where: { id: answerId },
        include: {
          assessment: {
            select: {
              id: true,
              userId: true,
              organizationId: true,
              status: true,
            },
          },
        },
      });

      if (!existingAnswer) {
        throw this.createError('Answer not found', 404, 'ANSWER_NOT_FOUND');
      }

      // Check permissions
      if (
        context?.userId &&
        existingAnswer.assessment.userId !== context.userId &&
        context.userRole !== UserRole.ADMIN
      ) {
        const userOrg = await this.prisma.organization.findFirst({
          where: { userId: context.userId },
          select: { id: true },
        });

        if (userOrg?.id !== existingAnswer.assessment.organizationId) {
          throw this.createError('Unauthorized to update this answer', 403, 'UNAUTHORIZED');
        }
      }

      const updatedAnswer = await this.prisma.answer.update({
        where: { id: answerId },
        data: { status: validatedData.status },
      });

      await this.logAudit(
        {
          action: 'ANSWER_STATUS_UPDATED',
          entity: 'Answer',
          entityId: answerId,
          oldValues: { status: existingAnswer.status },
          newValues: { status: validatedData.status },
        },
        context
      );

      this.logger.info('Answer status updated successfully', {
        answerId,
        oldStatus: existingAnswer.status,
        newStatus: status,
      });

      return this.createResponse(true, updatedAnswer, 'Answer status updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateAnswerStatus');
    }
  }

  /**
   * Get answer with full details
   */
  async getAnswerWithDetails(
    answerId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<AnswerWithDetails>> {
    try {
      const answer = await this.prisma.answer.findUnique({
        where: { id: answerId },
        include: {
          question: {
            include: {
              section: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                },
              },
            },
          },
          assessment: {
            select: {
              id: true,
              templateId: true,
              organizationId: true,
              status: true,
              userId: true,
            },
          },
        },
      });

      if (!answer) {
        throw this.createError('Answer not found', 404, 'ANSWER_NOT_FOUND');
      }

      // Check permissions
      if (
        context?.userId &&
        answer.assessment.userId !== context.userId &&
        context.userRole !== UserRole.ADMIN
      ) {
        const userOrg = await this.prisma.organization.findFirst({
          where: { userId: context.userId },
          select: { id: true },
        });

        if (userOrg?.id !== answer.assessment.organizationId) {
          throw this.createError('Unauthorized to view this answer', 403, 'UNAUTHORIZED');
        }
      }

      return this.createResponse(true, answer as AnswerWithDetails);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getAnswerWithDetails');
    }
  }

  /**
   * Get answer statistics for an assessment
   */
  async getAssessmentAnswerStats(
    assessmentId: string,
    context?: ServiceContext
  ): Promise<ApiResponse<{
    totalQuestions: number;
    totalAnswered: number;
    completedAnswers: number;
    incompleteAnswers: number;
    inProgressAnswers: number;
    averageScore: number;
    completionPercentage: number;
  }>> {
    try {
      // Verify assessment exists and user has permission
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          template: {
            include: {
              sections: {
                include: {
                  questions: {
                    where: { required: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!assessment) {
        throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      // Check permissions
      if (
        context?.userId &&
        assessment.userId !== context.userId &&
        context.userRole !== UserRole.ADMIN
      ) {
        const userOrg = await this.prisma.organization.findFirst({
          where: { userId: context.userId },
          select: { id: true },
        });

        if (userOrg?.id !== assessment.organizationId) {
          throw this.createError('Unauthorized to view assessment statistics', 403, 'UNAUTHORIZED');
        }
      }

      // Count total required questions
      let totalQuestions = 0;
      assessment.template.sections.forEach(section => {
        totalQuestions += section.questions.length;
      });

      // Get answer statistics
      const answers = await this.prisma.answer.findMany({
        where: { assessmentId },
        select: {
          status: true,
          score: true,
        },
      });

      const totalAnswered = answers.length;
      const completedAnswers = answers.filter(a => a.status === AnswerStatus.COMPLETE).length;
      const incompleteAnswers = answers.filter(a => a.status === AnswerStatus.INCOMPLETE).length;
      const inProgressAnswers = answers.filter(a => a.status === AnswerStatus.IN_PROGRESS).length;

      const averageScore = answers.length > 0
        ? answers.reduce((sum, a) => sum + a.score, 0) / answers.length
        : 0;

      const completionPercentage = totalQuestions > 0
        ? (completedAnswers / totalQuestions) * 100
        : 0;

      return this.createResponse(true, {
        totalQuestions,
        totalAnswered,
        completedAnswers,
        incompleteAnswers,
        inProgressAnswers,
        averageScore: Math.round(averageScore * 100) / 100,
        completionPercentage: Math.round(completionPercentage),
      });
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getAssessmentAnswerStats');
    }
  }
}

// Export singleton instance
export const answerService = new AnswerService();