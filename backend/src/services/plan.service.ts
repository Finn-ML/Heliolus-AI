/**
 * Plan Management Service
 * Handles CRUD operations for subscription plans with Stripe integration
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import { ApiResponse, PaginatedResponse, QueryOptions } from '../types/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Validation Schemas
const CreatePlanSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0),
  annualPrice: z.number().min(0),
  currency: z.string().default('USD'),
  monthlyCredits: z.number().int().min(-1).default(0), // -1 = unlimited
  assessmentCredits: z.number().int().min(-1).default(0), // -1 = unlimited
  maxAssessments: z.number().int().min(-1).default(0), // -1 = unlimited
  maxUsers: z.number().int().refine(val => val === -1 || val >= 1, {
    message: "maxUsers must be -1 (unlimited) or >= 1"
  }).default(1),
  features: z.array(z.string()).optional(),
  trialDays: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  createInStripe: z.boolean().default(true),
});

const UpdatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0).optional(),
  annualPrice: z.number().min(0).optional(),
  monthlyCredits: z.number().int().min(-1).optional(), // -1 = unlimited
  assessmentCredits: z.number().int().min(-1).optional(), // -1 = unlimited
  maxAssessments: z.number().int().min(-1).optional(), // -1 = unlimited
  maxUsers: z.number().int().refine(val => val === -1 || val >= 1, {
    message: "maxUsers must be -1 (unlimited) or >= 1"
  }).optional(),
  features: z.array(z.string()).optional(),
  trialDays: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  syncToStripe: z.boolean().default(false),
});

export class PlanService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Create a new plan with optional Stripe integration
   */
  async createPlan(
    data: z.infer<typeof CreatePlanSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<any>> {
    const validated = CreatePlanSchema.parse(data);

    try {
      let stripeProductId: string | undefined;
      let stripeMonthlyPriceId: string | undefined;
      let stripeAnnualPriceId: string | undefined;

      // Create product and prices in Stripe if requested
      if (validated.createInStripe && (validated.monthlyPrice > 0 || validated.annualPrice > 0)) {
        try {
          // Create Stripe Product
          const product = await stripe.products.create({
            name: validated.name,
            description: validated.description || undefined,
            metadata: {
              slug: validated.slug,
              managed_by: 'heliolus_plan_service',
            },
          });
          stripeProductId = product.id;

          // Create Monthly Price if applicable
          if (validated.monthlyPrice > 0) {
            const monthlyPrice = await stripe.prices.create({
              product: stripeProductId,
              unit_amount: Math.round(validated.monthlyPrice * 100), // Convert to cents
              currency: validated.currency.toLowerCase(),
              recurring: {
                interval: 'month',
                trial_period_days: validated.trialDays > 0 ? validated.trialDays : undefined,
              },
              metadata: {
                plan_slug: validated.slug,
                billing_cycle: 'monthly',
              },
            });
            stripeMonthlyPriceId = monthlyPrice.id;
          }

          // Create Annual Price if applicable
          if (validated.annualPrice > 0) {
            const annualPrice = await stripe.prices.create({
              product: stripeProductId,
              unit_amount: Math.round(validated.annualPrice * 100), // Convert to cents
              currency: validated.currency.toLowerCase(),
              recurring: {
                interval: 'year',
                trial_period_days: validated.trialDays > 0 ? validated.trialDays : undefined,
              },
              metadata: {
                plan_slug: validated.slug,
                billing_cycle: 'annual',
              },
            });
            stripeAnnualPriceId = annualPrice.id;
          }

          this.logger.info('Stripe product and prices created', {
            productId: stripeProductId,
            monthlyPriceId: stripeMonthlyPriceId,
            annualPriceId: stripeAnnualPriceId,
          });
        } catch (stripeError) {
          this.logger.error('Failed to create Stripe product/prices', { error: stripeError });
          throw this.createError('Failed to create plan in Stripe', 500, 'STRIPE_ERROR');
        }
      }

      // Create plan in database
      const plan = await this.prisma.plan.create({
        data: {
          slug: validated.slug,
          name: validated.name,
          description: validated.description,
          monthlyPrice: validated.monthlyPrice,
          annualPrice: validated.annualPrice,
          currency: validated.currency,
          stripeProductId,
          stripeMonthlyPriceId,
          stripeAnnualPriceId,
          monthlyCredits: validated.monthlyCredits,
          assessmentCredits: validated.assessmentCredits,
          maxAssessments: validated.maxAssessments,
          maxUsers: validated.maxUsers,
          features: validated.features || [],
          trialDays: validated.trialDays,
          isActive: validated.isActive,
          isPublic: validated.isPublic,
          displayOrder: validated.displayOrder,
        },
      });

      await this.logAudit(
        {
          action: 'PLAN_CREATED',
          entity: 'Plan',
          entityId: plan.id,
          newValues: plan,
        },
        context
      );

      return this.createSuccessResponse(plan, 'Plan created successfully');
    } catch (error: any) {
      this.logger.error('Error creating plan', { error, data: validated });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to create plan', 500, 'CREATE_PLAN_FAILED');
    }
  }

  /**
   * Update an existing plan
   */
  async updatePlan(
    id: string,
    data: z.infer<typeof UpdatePlanSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<any>> {
    let validated;
    try {
      validated = UpdatePlanSchema.parse(data);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const errorMessages = error.issues.map((issue: any) =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join('; ');
        throw this.createError(
          `Validation failed: ${errorMessages}`,
          400,
          'VALIDATION_ERROR',
          error.issues
        );
      }
      throw error;
    }

    try {
      // Get existing plan
      const existingPlan = await this.prisma.plan.findUnique({
        where: { id },
      });

      if (!existingPlan) {
        throw this.createError('Plan not found', 404, 'PLAN_NOT_FOUND');
      }

      // Update Stripe if price changed and syncToStripe is true
      if (validated.syncToStripe && existingPlan.stripeProductId) {
        try {
          // Update product name/description if changed
          if (validated.name || validated.description !== undefined) {
            await stripe.products.update(existingPlan.stripeProductId, {
              name: validated.name,
              description: validated.description || undefined,
            });
          }

          // Note: Stripe prices are immutable. To change prices, you need to create new price objects
          // and archive the old ones. This is typically handled separately in production systems.
          if (validated.monthlyPrice !== undefined || validated.annualPrice !== undefined) {
            this.logger.warn('Price update requested but Stripe prices are immutable', {
              planId: id,
              note: 'Create new prices and archive old ones manually in Stripe dashboard',
            });
          }
        } catch (stripeError) {
          this.logger.error('Failed to update Stripe product', { error: stripeError });
          // Continue with database update even if Stripe update fails
        }
      }

      // Update plan in database
      const updatedPlan = await this.prisma.plan.update({
        where: { id },
        data: {
          name: validated.name,
          description: validated.description,
          monthlyPrice: validated.monthlyPrice,
          annualPrice: validated.annualPrice,
          monthlyCredits: validated.monthlyCredits,
          assessmentCredits: validated.assessmentCredits,
          maxAssessments: validated.maxAssessments,
          maxUsers: validated.maxUsers,
          features: validated.features,
          trialDays: validated.trialDays,
          isActive: validated.isActive,
          isPublic: validated.isPublic,
          displayOrder: validated.displayOrder,
        },
      });

      await this.logAudit(
        {
          action: 'PLAN_UPDATED',
          entity: 'Plan',
          entityId: id,
          oldValues: existingPlan,
          newValues: updatedPlan,
        },
        context
      );

      return this.createSuccessResponse(updatedPlan, 'Plan updated successfully');
    } catch (error: any) {
      this.logger.error('Error updating plan', { error, id, data: validated });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to update plan', 500, 'UPDATE_PLAN_FAILED');
    }
  }

  /**
   * Get a plan by ID
   */
  async getPlanById(id: string): Promise<ApiResponse<any>> {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id },
      });

      if (!plan) {
        throw this.createError('Plan not found', 404, 'PLAN_NOT_FOUND');
      }

      return this.createSuccessResponse(plan);
    } catch (error: any) {
      this.logger.error('Error getting plan', { error, id });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to get plan', 500, 'GET_PLAN_FAILED');
    }
  }

  /**
   * Get a plan by slug
   */
  async getPlanBySlug(slug: string): Promise<ApiResponse<any>> {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { slug },
      });

      if (!plan) {
        throw this.createError('Plan not found', 404, 'PLAN_NOT_FOUND');
      }

      return this.createSuccessResponse(plan);
    } catch (error: any) {
      this.logger.error('Error getting plan by slug', { error, slug });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to get plan', 500, 'GET_PLAN_FAILED');
    }
  }

  /**
   * List all plans with filtering
   */
  async listPlans(options?: {
    activeOnly?: boolean;
    publicOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (options?.activeOnly) where.isActive = true;
      if (options?.publicOnly) where.isPublic = true;

      const [plans, total] = await Promise.all([
        this.prisma.plan.findMany({
          where,
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        this.prisma.plan.count({ where }),
      ]);

      return this.createSuccessResponse({
        data: plans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      this.logger.error('Error listing plans', { error, options });
      throw this.createError('Failed to list plans', 500, 'LIST_PLANS_FAILED');
    }
  }

  /**
   * Delete a plan (soft delete by deactivating)
   */
  async deletePlan(id: string, context?: ServiceContext): Promise<ApiResponse<void>> {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id },
      });

      if (!plan) {
        throw this.createError('Plan not found', 404, 'PLAN_NOT_FOUND');
      }

      // Soft delete by deactivating
      await this.prisma.plan.update({
        where: { id },
        data: { isActive: false, isPublic: false },
      });

      await this.logAudit(
        {
          action: 'PLAN_DELETED',
          entity: 'Plan',
          entityId: id,
          oldValues: plan,
        },
        context
      );

      return this.createSuccessResponse(undefined, 'Plan deleted successfully');
    } catch (error: any) {
      this.logger.error('Error deleting plan', { error, id });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to delete plan', 500, 'DELETE_PLAN_FAILED');
    }
  }
}
