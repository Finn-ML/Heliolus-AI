/**
 * Mock Logging Middleware for Development
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export interface RequestContext {
  correlationId: string;
  startTime: number;
  clientIp: string;
  userAgent?: string;
}

export async function loggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Basic logging - just log the request
  request.log.info({
    method: request.method,
    url: request.url,
    ip: request.ip,
  }, 'Request received');
}

export function logSecurityEvent(
  request: FastifyRequest,
  event: string,
  details: any = {}
): void {
  request.log.warn({
    securityEvent: event,
    ...details,
  }, 'Security event logged');
}

export function logPerformanceMetric(
  request: FastifyRequest,
  metric: string,
  value: number,
  unit: string = 'ms'
): void {
  request.log.info({
    performanceMetric: metric,
    value,
    unit,
  }, 'Performance metric logged');
}