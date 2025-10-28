/**
 * Coupon Management Service
 * Handles CRUD operations for discount coupons with Stripe integration
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import { ApiResponse, PaginatedResponse } from '../types/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Validation Schemas
const CreateCouponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/),
  name: z.string().optional(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().min(0),
  currency: z.string().default('USD'),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  maxRedemptions: z.number().int().min(1).optional(),
  applicablePlans: z.array(z.string()).default([]),
  minimumAmount: z.number().min(0).optional(),
  newCustomersOnly: z.boolean().default(false),
  durationInMonths: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
  createInStripe: z.boolean().default(true),
});

const UpdateCouponSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  validUntil: z.date().optional(),
  maxRedemptions: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  planSlug: z.string().optional(),
  amount: z.number().min(0).optional(),
  isNewCustomer: z.boolean().default(false),
});

export class CouponService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Create a new coupon with optional Stripe integration
   */
  async createCoupon(
    data: z.infer<typeof CreateCouponSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<any>> {
    const validated = CreateCouponSchema.parse(data);

    try {
      let stripeCouponId: string | undefined;

      // Create coupon in Stripe if requested
      if (validated.createInStripe) {
        try {
          const stripeParams: Stripe.CouponCreateParams = {
            id: validated.code, // Use our code as the Stripe coupon ID
            name: validated.name || validated.code,
            metadata: {
              managed_by: 'heliolus_coupon_service',
            },
          };

          // Set discount amount or percentage
          if (validated.discountType === 'PERCENTAGE') {
            stripeParams.percent_off = validated.discountValue;
          } else {
            stripeParams.amount_off = Math.round(validated.discountValue * 100); // Convert to cents
            stripeParams.currency = validated.currency.toLowerCase();
          }

          // Set duration
          if (validated.durationInMonths) {
            stripeParams.duration = 'repeating';
            stripeParams.duration_in_months = validated.durationInMonths;
          } else {
            stripeParams.duration = 'forever';
          }

          // Set redemption limit
          if (validated.maxRedemptions) {
            stripeParams.max_redemptions = validated.maxRedemptions;
          }

          // Set expiry
          if (validated.validUntil) {
            stripeParams.redeem_by = Math.floor(validated.validUntil.getTime() / 1000);
          }

          const stripeCoupon = await stripe.coupons.create(stripeParams);
          stripeCouponId = stripeCoupon.id;

          this.logger.info('Stripe coupon created', { couponId: stripeCouponId });
        } catch (stripeError: any) {
          this.logger.error('Failed to create Stripe coupon', { error: stripeError });
          throw this.createError(
            `Failed to create coupon in Stripe: ${stripeError.message}`,
            500,
            'STRIPE_ERROR'
          );
        }
      }

      // Create coupon in database
      const coupon = await this.prisma.coupon.create({
        data: {
          code: validated.code,
          name: validated.name,
          description: validated.description,
          stripeCouponId,
          discountType: validated.discountType,
          discountValue: validated.discountValue,
          currency: validated.currency,
          validFrom: validated.validFrom || new Date(),
          validUntil: validated.validUntil,
          maxRedemptions: validated.maxRedemptions,
          applicablePlans: validated.applicablePlans,
          minimumAmount: validated.minimumAmount,
          newCustomersOnly: validated.newCustomersOnly,
          durationInMonths: validated.durationInMonths,
          isActive: validated.isActive,
        },
      });

      await this.logAudit(
        {
          action: 'COUPON_CREATED',
          entity: 'Coupon',
          entityId: coupon.id,
          newValues: coupon,
        },
        context
      );

      return this.createSuccessResponse(coupon, 'Coupon created successfully');
    } catch (error: any) {
      this.logger.error('Error creating coupon', { error, data: validated });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to create coupon', 500, 'CREATE_COUPON_FAILED');
    }
  }

  /**
   * Update an existing coupon
   */
  async updateCoupon(
    id: string,
    data: z.infer<typeof UpdateCouponSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<any>> {
    const validated = UpdateCouponSchema.parse(data);

    try {
      const existingCoupon = await this.prisma.coupon.findUnique({
        where: { id },
      });

      if (!existingCoupon) {
        throw this.createError('Coupon not found', 404, 'COUPON_NOT_FOUND');
      }

      // Note: Stripe coupons cannot be modified after creation
      // Only metadata can be updated
      if (existingCoupon.stripeCouponId && (validated.name || validated.description)) {
        try {
          await stripe.coupons.update(existingCoupon.stripeCouponId, {
            name: validated.name || undefined,
            metadata: {
              description: validated.description || '',
            },
          });
        } catch (stripeError) {
          this.logger.error('Failed to update Stripe coupon metadata', { error: stripeError });
          // Continue with database update even if Stripe update fails
        }
      }

      // Update coupon in database
      const updatedCoupon = await this.prisma.coupon.update({
        where: { id },
        data: {
          name: validated.name,
          description: validated.description,
          validUntil: validated.validUntil,
          maxRedemptions: validated.maxRedemptions,
          isActive: validated.isActive,
        },
      });

      await this.logAudit(
        {
          action: 'COUPON_UPDATED',
          entity: 'Coupon',
          entityId: id,
          oldValues: existingCoupon,
          newValues: updatedCoupon,
        },
        context
      );

      return this.createSuccessResponse(updatedCoupon, 'Coupon updated successfully');
    } catch (error: any) {
      this.logger.error('Error updating coupon', { error, id, data: validated });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to update coupon', 500, 'UPDATE_COUPON_FAILED');
    }
  }

  /**
   * Get a coupon by ID
   */
  async getCouponById(id: string): Promise<ApiResponse<any>> {
    try {
      const coupon = await this.prisma.coupon.findUnique({
        where: { id },
      });

      if (!coupon) {
        throw this.createError('Coupon not found', 404, 'COUPON_NOT_FOUND');
      }

      return this.createSuccessResponse(coupon);
    } catch (error: any) {
      this.logger.error('Error getting coupon', { error, id });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to get coupon', 500, 'GET_COUPON_FAILED');
    }
  }

  /**
   * Get a coupon by code
   */
  async getCouponByCode(code: string): Promise<ApiResponse<any>> {
    try {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        throw this.createError('Coupon not found', 404, 'COUPON_NOT_FOUND');
      }

      return this.createSuccessResponse(coupon);
    } catch (error: any) {
      this.logger.error('Error getting coupon by code', { error, code });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to get coupon', 500, 'GET_COUPON_FAILED');
    }
  }

  /**
   * List all coupons with filtering
   */
  async listCoupons(options?: {
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (options?.activeOnly) {
        where.isActive = true;
        where.OR = [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ];
      }

      const [coupons, total] = await Promise.all([
        this.prisma.coupon.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.coupon.count({ where }),
      ]);

      return this.createSuccessResponse({
        data: coupons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      this.logger.error('Error listing coupons', { error, options });
      throw this.createError('Failed to list coupons', 500, 'LIST_COUPONS_FAILED');
    }
  }

  /**
   * Validate a coupon for use
   */
  async validateCoupon(
    data: z.infer<typeof ValidateCouponSchema>
  ): Promise<ApiResponse<{
    valid: boolean;
    coupon?: any;
    reason?: string;
    discountAmount?: number;
  }>> {
    const validated = ValidateCouponSchema.parse(data);

    try {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: validated.code.toUpperCase() },
      });

      if (!coupon) {
        return this.createSuccessResponse({
          valid: false,
          reason: 'Coupon not found',
        });
      }

      // Check if active
      if (!coupon.isActive) {
        return this.createSuccessResponse({
          valid: false,
          coupon,
          reason: 'Coupon is not active',
        });
      }

      // Check validity period
      const now = new Date();
      if (coupon.validFrom && coupon.validFrom > now) {
        return this.createSuccessResponse({
          valid: false,
          coupon,
          reason: 'Coupon is not yet valid',
        });
      }
      if (coupon.validUntil && coupon.validUntil < now) {
        return this.createSuccessResponse({
          valid: false,
          coupon,
          reason: 'Coupon has expired',
        });
      }

      // Check redemption limit
      if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
        return this.createSuccessResponse({
          valid: false,
          coupon,
          reason: 'Coupon redemption limit reached',
        });
      }

      // Check new customer restriction
      if (coupon.newCustomersOnly && !validated.isNewCustomer) {
        return this.createSuccessResponse({
          valid: false,
          coupon,
          reason: 'Coupon is only valid for new customers',
        });
      }

      // Check applicable plans
      if (validated.planSlug && coupon.applicablePlans.length > 0) {
        if (!coupon.applicablePlans.includes(validated.planSlug)) {
          return this.createSuccessResponse({
            valid: false,
            coupon,
            reason: 'Coupon is not applicable to this plan',
          });
        }
      }

      // Check minimum amount
      if (validated.amount && coupon.minimumAmount) {
        if (validated.amount < Number(coupon.minimumAmount)) {
          return this.createSuccessResponse({
            valid: false,
            coupon,
            reason: `Minimum purchase amount of ${coupon.currency} ${coupon.minimumAmount} required`,
          });
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (validated.amount) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (validated.amount * Number(coupon.discountValue)) / 100;
        } else {
          discountAmount = Number(coupon.discountValue);
        }
      }

      return this.createSuccessResponse({
        valid: true,
        coupon,
        discountAmount,
      });
    } catch (error: any) {
      this.logger.error('Error validating coupon', { error, data: validated });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to validate coupon', 500, 'VALIDATE_COUPON_FAILED');
    }
  }

  /**
   * Redeem a coupon (increment redemption count)
   */
  async redeemCoupon(code: string, context?: ServiceContext): Promise<ApiResponse<any>> {
    try {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        throw this.createError('Coupon not found', 404, 'COUPON_NOT_FOUND');
      }

      const updatedCoupon = await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          timesRedeemed: { increment: 1 },
        },
      });

      await this.logAudit(
        {
          action: 'COUPON_REDEEMED',
          entity: 'Coupon',
          entityId: coupon.id,
          metadata: { code, timesRedeemed: updatedCoupon.timesRedeemed },
        },
        context
      );

      return this.createSuccessResponse(updatedCoupon);
    } catch (error: any) {
      this.logger.error('Error redeeming coupon', { error, code });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to redeem coupon', 500, 'REDEEM_COUPON_FAILED');
    }
  }

  /**
   * Delete a coupon (deactivate)
   */
  async deleteCoupon(id: string, context?: ServiceContext): Promise<ApiResponse<void>> {
    try {
      const coupon = await this.prisma.coupon.findUnique({
        where: { id },
      });

      if (!coupon) {
        throw this.createError('Coupon not found', 404, 'COUPON_NOT_FOUND');
      }

      // Deactivate in database
      await this.prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });

      // Delete from Stripe if applicable
      if (coupon.stripeCouponId) {
        try {
          await stripe.coupons.del(coupon.stripeCouponId);
        } catch (stripeError) {
          this.logger.error('Failed to delete Stripe coupon', { error: stripeError });
          // Continue even if Stripe deletion fails
        }
      }

      await this.logAudit(
        {
          action: 'COUPON_DELETED',
          entity: 'Coupon',
          entityId: id,
          oldValues: coupon,
        },
        context
      );

      return this.createSuccessResponse(undefined, 'Coupon deleted successfully');
    } catch (error: any) {
      this.logger.error('Error deleting coupon', { error, id });
      if (error.code && error.message) throw error;
      throw this.createError('Failed to delete coupon', 500, 'DELETE_COUPON_FAILED');
    }
  }
}
