/**
 * Payment Library for Heliolus Platform
 * Stripe integration for subscriptions, credits, and payment processing
 */

// Real Stripe implementation (enabled for sandbox testing)
export * from './types';
export * from './stripe';
export * from './subscriptions';
export * from './credits';
export * from './invoicing';
export * from './webhooks';

// Compatibility layer for existing code
export * from './compat';

// Keep mock exports available for testing
export * as MockPayment from './mock';

// Re-export configuration
export { PAYMENT_CONFIG } from './config';