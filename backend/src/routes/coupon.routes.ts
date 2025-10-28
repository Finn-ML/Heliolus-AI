/**
 * Coupon Management Routes (Admin)
 * API endpoints for managing discount coupons
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole, asyncHandler, authenticationMiddleware } from '../middleware';
import { CouponService } from '../services/coupon.service';

const couponService = new CouponService();

export default async function couponRoutes(server: FastifyInstance) {
  // Apply authentication and admin role check to all routes
  server.addHook('onRequest', authenticationMiddleware);
  server.addHook('preHandler', requireRole('ADMIN'));

  // GET /coupons - List all coupons
  server.get(
    '/',
    {
      schema: {
        description: 'List all discount coupons',
        tags: ['coupons'],
        querystring: {
          type: 'object',
          properties: {
            activeOnly: { type: 'boolean' },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
      const { activeOnly, page, limit } = request.query as any;

      const result = await couponService.listCoupons({
        activeOnly: activeOnly === 'true',
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      });

      if (!result.success || !result.data) {
        return reply.code(500).send({
          success: false,
          message: result.message || 'Failed to fetch coupons',
        });
      }

      reply.send({
        success: true,
        data: result.data.data,
        pagination: result.data.pagination,
      });
    })
  );

  // GET /coupons/:id - Get a specific coupon
  server.get(
    '/:id',
    {
      schema: {
        description: 'Get a specific coupon by ID',
        tags: ['coupons'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      const result = await couponService.getCouponById(id);

      if (!result.success || !result.data) {
        return reply.code(404).send({
          success: false,
          message: 'Coupon not found',
        });
      }

      reply.send({
        success: true,
        data: result.data,
      });
    })
  );

  // POST /coupons - Create a new coupon
  server.post(
    '/',
    {
      schema: {
        description: 'Create a new discount coupon',
        tags: ['coupons'],
        body: {
          type: 'object',
          required: ['code', 'discountType', 'discountValue'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] },
            discountValue: { type: 'number' },
            currency: { type: 'string' },
            validFrom: { type: 'string', format: 'date-time' },
            validUntil: { type: 'string', format: 'date-time' },
            maxRedemptions: { type: 'integer' },
            applicablePlans: { type: 'array', items: { type: 'string' } },
            minimumAmount: { type: 'number' },
            newCustomersOnly: { type: 'boolean' },
            durationInMonths: { type: 'integer' },
            isActive: { type: 'boolean' },
            createInStripe: { type: 'boolean' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
      const data = request.body as any;

      // Convert date strings to Date objects
      if (data.validFrom) data.validFrom = new Date(data.validFrom);
      if (data.validUntil) data.validUntil = new Date(data.validUntil);

      const result = await couponService.createCoupon(data, {
        userId: request.user?.id || 'system',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (!result.success || !result.data) {
        return reply.code(400).send({
          success: false,
          message: result.message || 'Failed to create coupon',
        });
      }

      reply.code(201).send({
        success: true,
        data: result.data,
        message: 'Coupon created successfully',
      });
    })
  );

  // PUT /coupons/:id - Update a coupon
  server.put(
    '/:id',
    {
      schema: {
        description: 'Update an existing coupon',
        tags: ['coupons'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            validUntil: { type: 'string', format: 'date-time' },
            maxRedemptions: { type: 'integer' },
            isActive: { type: 'boolean' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const data = request.body as any;

      // Convert date strings to Date objects
      if (data.validUntil) data.validUntil = new Date(data.validUntil);

      const result = await couponService.updateCoupon(id, data, {
        userId: request.user?.id || 'system',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (!result.success || !result.data) {
        return reply.code(400).send({
          success: false,
          message: result.message || 'Failed to update coupon',
        });
      }

      reply.send({
        success: true,
        data: result.data,
        message: 'Coupon updated successfully',
      });
    })
  );

  // DELETE /coupons/:id - Delete (deactivate) a coupon
  server.delete(
    '/:id',
    {
      schema: {
        description: 'Delete (deactivate) a coupon',
        tags: ['coupons'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      const result = await couponService.deleteCoupon(id, {
        userId: request.user?.id || 'system',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (!result.success) {
        return reply.code(400).send({
          success: false,
          message: result.message || 'Failed to delete coupon',
        });
      }

      reply.send({
        success: true,
        message: 'Coupon deleted successfully',
      });
    })
  );

  // POST /coupons/validate - Validate a coupon code (public endpoint, no admin auth)
  server.post(
    '/validate',
    {
      preHandler: [], // Remove admin auth for this endpoint
      schema: {
        description: 'Validate a coupon code',
        tags: ['coupons'],
        body: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
            planSlug: { type: 'string' },
            amount: { type: 'number' },
            isNewCustomer: { type: 'boolean' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
      const data = request.body as any;

      const result = await couponService.validateCoupon(data);

      if (!result.success || !result.data) {
        return reply.code(400).send({
          success: false,
          message: result.message || 'Failed to validate coupon',
        });
      }

      reply.send({
        success: true,
        data: result.data,
      });
    })
  );

  // GET /coupons/code/:code - Get a coupon by code
  server.get(
    '/code/:code',
    {
      schema: {
        description: 'Get a specific coupon by code',
        tags: ['coupons'],
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
          },
        },
      },
    },
    asyncHandler(async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      const { code } = request.params;

      const result = await couponService.getCouponByCode(code);

      if (!result.success || !result.data) {
        return reply.code(404).send({
          success: false,
          message: 'Coupon not found',
        });
      }

      reply.send({
        success: true,
        data: result.data,
      });
    })
  );
}
