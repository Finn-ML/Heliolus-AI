/**
 * Stripe payment provider implementation
 */

import Stripe from 'stripe';
import { z } from 'zod';
import {
  PaymentProvider,
  Customer,
  PaymentMethod,
  PaymentIntent,
  CreateCustomerData,
  UpdateCustomerData,
  PaymentMethodData,
  PaymentIntentData,
  PaymentError
} from './types';

// Get Stripe config directly from environment to avoid circular dependency
const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_',
  apiVersion: '2024-11-20.acacia' as const,
  timeout: 30000
};

// Validation schemas
const CreateCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  description: z.string().optional(),
  paymentMethodId: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional()
});

const PaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  customerId: z.string(),
  paymentMethodId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  automaticPaymentMethods: z.boolean().optional()
});

/**
 * Stripe payment provider implementation
 */
export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true
    });
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      const validData = CreateCustomerSchema.parse(data);

      const stripeCustomer = await this.stripe.customers.create({
        email: validData.email,
        name: validData.name,
        description: validData.description,
        metadata: validData.metadata as Stripe.MetadataParam || {},
        ...(validData.paymentMethodId && {
          payment_method: validData.paymentMethodId,
          invoice_settings: {
            default_payment_method: validData.paymentMethodId
          }
        })
      });

      return this.mapStripeCustomer(stripeCustomer);
    } catch (error) {
      console.error('Create customer error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(customerId: string, data: UpdateCustomerData): Promise<Customer> {
    try {
      const stripeCustomer = await this.stripe.customers.update(customerId, {
        email: data.email,
        name: data.name,
        description: data.description,
        metadata: data.metadata,
        ...(data.defaultPaymentMethod && {
          invoice_settings: {
            default_payment_method: data.defaultPaymentMethod
          }
        })
      });

      return this.mapStripeCustomer(stripeCustomer);
    } catch (error) {
      console.error('Update customer error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      const result = await this.stripe.customers.del(customerId);
      return result.deleted || false;
    } catch (error) {
      console.error('Delete customer error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(customerId: string, data: PaymentMethodData): Promise<PaymentMethod> {
    try {
      // Map our payment method types to Stripe's expected types
      const stripeType = data.type === 'bank_account' ? 'us_bank_account' : 
                        data.type === 'sepa_debit' ? 'sepa_debit' : 'card';
      
      const stripePaymentMethod = await this.stripe.paymentMethods.create({
        type: stripeType as any,
        card: data.type === 'card' ? {
          number: data.card!.number,
          exp_month: data.card!.expMonth,
          exp_year: data.card!.expYear,
          cvc: data.card!.cvc
        } : undefined,
        billing_details: data.billingDetails ? {
          name: data.billingDetails.name,
          email: data.billingDetails.email,
          address: data.billingDetails.address ? {
            line1: data.billingDetails.address.line1,
            line2: data.billingDetails.address.line2,
            city: data.billingDetails.address.city,
            state: data.billingDetails.address.state,
            postal_code: data.billingDetails.address.postalCode,
            country: data.billingDetails.address.country
          } : undefined
        } : undefined
      });

      // Attach to customer
      await this.attachPaymentMethod(stripePaymentMethod.id, customerId);

      return this.mapStripePaymentMethod(stripePaymentMethod, customerId);
    } catch (error) {
      console.error('Create payment method error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<PaymentMethod> {
    try {
      const stripePaymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      return this.mapStripePaymentMethod(stripePaymentMethod, customerId);
    } catch (error) {
      console.error('Attach payment method error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<PaymentIntent> {
    try {
      const validData = PaymentIntentSchema.parse(data);

      const stripePaymentIntent = await this.stripe.paymentIntents.create({
        amount: validData.amount,
        currency: validData.currency,
        customer: validData.customerId,
        payment_method: validData.paymentMethodId,
        description: validData.description,
        metadata: validData.metadata as Stripe.MetadataParam || {},
        ...(validData.automaticPaymentMethods && {
          automatic_payment_methods: {
            enabled: true
          }
        }),
        setup_future_usage: 'off_session' // For saving payment methods
      });

      return this.mapStripePaymentIntent(stripePaymentIntent);
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const stripePaymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return this.mapStripePaymentIntent(stripePaymentIntent);
    } catch (error) {
      console.error('Confirm payment intent error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const stripePaymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        limit: 10
      });

      return stripePaymentMethods.data.map(pm => this.mapStripePaymentMethod(pm, customerId));
    } catch (error) {
      console.error('Get customer payment methods error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Detach payment method
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return true;
    } catch (error) {
      console.error('Detach payment method error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Get payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const stripePaymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return this.mapStripePaymentIntent(stripePaymentIntent);
    } catch (error) {
      console.error('Get payment intent error:', error);
      throw this.handleStripeError(error);
    }
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const stripePaymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      return this.mapStripePaymentIntent(stripePaymentIntent);
    } catch (error) {
      console.error('Cancel payment intent error:', error);
      throw this.handleStripeError(error);
    }
  }

  // Private helper methods

  private mapStripeCustomer(stripeCustomer: Stripe.Customer): Customer {
    return {
      id: stripeCustomer.id,
      email: stripeCustomer.email!,
      name: stripeCustomer.name || undefined,
      description: stripeCustomer.description || undefined,
      metadata: stripeCustomer.metadata || {},
      defaultPaymentMethod: typeof stripeCustomer.invoice_settings?.default_payment_method === 'string'
        ? stripeCustomer.invoice_settings.default_payment_method
        : undefined,
      createdAt: new Date(stripeCustomer.created * 1000),
      updatedAt: new Date() // Stripe doesn't provide updated timestamp
    };
  }

  private mapStripePaymentMethod(stripePaymentMethod: Stripe.PaymentMethod, customerId: string): PaymentMethod {
    return {
      id: stripePaymentMethod.id,
      type: stripePaymentMethod.type as 'card' | 'bank_account' | 'sepa_debit',
      card: stripePaymentMethod.card ? {
        brand: stripePaymentMethod.card.brand,
        last4: stripePaymentMethod.card.last4,
        expMonth: stripePaymentMethod.card.exp_month,
        expYear: stripePaymentMethod.card.exp_year
      } : undefined,
      customerId,
      isDefault: false, // Would need to check against customer's default payment method
      createdAt: new Date(stripePaymentMethod.created * 1000)
    };
  }

  private mapStripePaymentIntent(stripePaymentIntent: Stripe.PaymentIntent): PaymentIntent {
    return {
      id: stripePaymentIntent.id,
      amount: stripePaymentIntent.amount,
      currency: stripePaymentIntent.currency,
      status: stripePaymentIntent.status as PaymentIntent['status'],
      customerId: stripePaymentIntent.customer as string,
      paymentMethodId: stripePaymentIntent.payment_method as string,
      clientSecret: stripePaymentIntent.client_secret!,
      description: stripePaymentIntent.description || undefined,
      metadata: stripePaymentIntent.metadata || {},
      createdAt: new Date(stripePaymentIntent.created * 1000),
      updatedAt: new Date() // Stripe doesn't provide updated timestamp
    };
  }

  private handleStripeError(error: any): PaymentError {
    if (error instanceof Stripe.errors.StripeError) {
      let errorType: PaymentError['type'] = 'api_error';
      
      if (error instanceof Stripe.errors.StripeCardError) {
        errorType = 'card_error';
      } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        errorType = 'invalid_request_error';
      } else if (error instanceof Stripe.errors.StripeAuthenticationError) {
        errorType = 'authentication_error';
      } else if (error instanceof Stripe.errors.StripeRateLimitError) {
        errorType = 'rate_limit_error';
      }

      return new PaymentError(
        error.message,
        error.code || 'unknown_error',
        errorType,
        error.statusCode || 400
      );
    }

    if (error instanceof z.ZodError) {
      return new PaymentError(
        `Validation error: ${error.issues[0].message}`,
        'validation_error',
        'invalid_request_error',
        400
      );
    }

    return new PaymentError(
      'An unexpected error occurred',
      'unknown_error',
      'api_error',
      500
    );
  }
}

// Export the Stripe provider instance
export const stripeProvider = new StripeProvider();
export const paymentProvider = stripeProvider; // Alias for backward compatibility