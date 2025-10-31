/**
 * Payment library types and interfaces
 */

import { SubscriptionPlan, SubscriptionStatus, TransactionType, InvoiceStatus } from '../../types/database';

// Core payment interfaces
export interface PaymentProvider {
  createCustomer(data: CreateCustomerData): Promise<Customer>;
  updateCustomer(customerId: string, data: UpdateCustomerData): Promise<Customer>;
  deleteCustomer(customerId: string): Promise<boolean>;
  createPaymentMethod(customerId: string, data: PaymentMethodData): Promise<PaymentMethod>;
  attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<PaymentMethod>;
  createPaymentIntent(data: PaymentIntentData): Promise<PaymentIntent>;
  confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;
}

export interface SubscriptionManager {
  createSubscription(data: CreateSubscriptionData): Promise<Subscription>;
  updateSubscription(subscriptionId: string, data: UpdateSubscriptionData): Promise<Subscription>;
  cancelSubscription(subscriptionId: string, options?: CancelOptions): Promise<Subscription>;
  pauseSubscription(subscriptionId: string): Promise<Subscription>;
  resumeSubscription(subscriptionId: string): Promise<Subscription>;
  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  listSubscriptions(customerId: string): Promise<Subscription[]>;
}

export interface CreditManager {
  purchaseCredits(userId: string, packageType: string): Promise<CreditTransaction>;
  addCredits(userId: string, amount: number, reason: string): Promise<CreditTransaction>;
  deductCredits(userId: string, amount: number, reason: string): Promise<CreditTransaction>;
  getBalance(userId: string): Promise<number>;
  getTransactionHistory(userId: string, limit?: number): Promise<CreditTransaction[]>;
}

export interface InvoiceManager {
  createInvoice(data: CreateInvoiceData): Promise<Invoice>;
  updateInvoice(invoiceId: string, data: UpdateInvoiceData): Promise<Invoice>;
  finalizeInvoice(invoiceId: string): Promise<Invoice>;
  payInvoice(invoiceId: string): Promise<Invoice>;
  voidInvoice(invoiceId: string): Promise<Invoice>;
  sendInvoice(invoiceId: string): Promise<boolean>;
  downloadInvoice(invoiceId: string): Promise<Buffer>;
}

// Data structures
export interface Customer {
  id: string;
  email: string;
  name?: string;
  description?: string;
  metadata?: Record<string, string>;
  defaultPaymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  customerId: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  customerId: string;
  paymentMethodId?: string;
  clientSecret: string;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  defaultPaymentMethod?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  subscriptionId?: string;
  type: TransactionType;
  amount: number; // Positive for credit, negative for debit
  balance: number; // Balance after transaction
  description: string;
  metadata?: Record<string, any>;
  paymentIntentId?: string;
  assessmentId?: string;
  createdAt: Date;
}

// Credit-specific data types
export interface CreditBalance {
  subscriptionId: string;
  balance: number;
  used: number;
  purchased: number;
  plan: SubscriptionPlan;
  lastUpdated: Date;
}

export interface AddCreditsData {
  userId: string;
  amount: number;
  reason: string;
  subscriptionId?: string;
  assessmentId?: string;
}

export interface DeductCreditsData {
  userId: string;
  amount: number;
  reason: string;
  assessmentId?: string;
}

export type CreditTransactionData = CreditTransaction;

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  tax?: number;
  total: number;
  dueDate: Date;
  paidAt?: Date;
  description?: string;
  lineItems: InvoiceLineItem[];
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  metadata?: Record<string, string>;
}

// Alias for backward compatibility
export type InvoiceItem = InvoiceLineItem;

// Input data types
export interface CreateCustomerData {
  email: string;
  name?: string;
  description?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

export interface UpdateCustomerData {
  email?: string;
  name?: string;
  description?: string;
  defaultPaymentMethod?: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethodData {
  type: 'card' | 'bank_account' | 'sepa_debit';
  card?: {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    address?: Address;
  };
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface PaymentIntentData {
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, string>;
  automaticPaymentMethods?: boolean;
}

export interface CreateSubscriptionData {
  customerId: string;
  plan: SubscriptionPlan;
  paymentMethodId?: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionData {
  plan?: SubscriptionPlan;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface CancelOptions {
  immediately?: boolean;
  reason?: string;
  feedback?: string;
}

export interface CreateInvoiceData {
  customerId: string;
  subscriptionId?: string;
  description?: string;
  lineItems: Omit<InvoiceLineItem, 'id' | 'amount'>[];
  dueDate?: Date;
  metadata?: Record<string, string>;
}

export interface UpdateInvoiceData {
  description?: string;
  metadata?: Record<string, string>;
  dueDate?: Date;
}

// Result types
export interface PaymentResult {
  success: boolean;
  data?: any;
  error?: string;
  paymentIntent?: PaymentIntent;
  requiresAction?: boolean;
  clientSecret?: string;
}

export interface SubscriptionResult {
  success: boolean;
  data?: Subscription;
  error?: string;
  message?: string;
}

export interface CreditResult {
  success: boolean;
  data?: CreditTransaction;
  error?: string;
  balance?: number;
}

export interface InvoiceResult {
  success: boolean;
  data?: Invoice;
  error?: string;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string;
    idempotency_key?: string;
  };
}

export interface WebhookHandler {
  handleEvent(event: WebhookEvent): Promise<void>;
  validateSignature(payload: string, signature: string): boolean;
}

// Configuration types
export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  apiVersion: string;
  timeout: number;
}

export interface SubscriptionConfig {
  plans: Record<string, {
    price: number;
    credits: number;
    features: string[];
  }>;
  trialPeriodDays: number;
  gracePeriodDays: number;
}

export interface CreditConfig {
  bonusCredits: {
    firstPurchase: number;
    referral: number;
    loyaltyThreshold: number;
  };
  packages: Record<string, {
    credits: number;
    price: number;
  }>;
}

export interface InvoicingConfig {
  daysUntilDue: number;
  lateFeePercentage: number;
  currency: string;
  taxRate: number;
}

// Error types
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public type: 'api_error' | 'authentication_error' | 'card_error' | 'invalid_request_error' | 'rate_limit_error',
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class SubscriptionError extends PaymentError {
  constructor(message: string) {
    super(message, 'SUBSCRIPTION_ERROR', 'api_error', 400);
    this.name = 'SubscriptionError';
  }
}

export class CreditError extends PaymentError {
  constructor(message: string) {
    super(message, 'CREDIT_ERROR', 'api_error', 400);
    this.name = 'CreditError';
  }
}

export class InvoiceError extends PaymentError {
  constructor(message: string) {
    super(message, 'INVOICE_ERROR', 'api_error', 400);
    this.name = 'InvoiceError';
  }
}

export class InsufficientCreditsError extends CreditError {
  constructor(required: number, available: number) {
    super(`Insufficient credits: ${required} required, ${available} available`, 'INSUFFICIENT_CREDITS');
    this.name = 'InsufficientCreditsError';
  }
}

export class InvalidPaymentMethodError extends PaymentError {
  constructor(message: string = 'Invalid payment method') {
    super(message, 'INVALID_PAYMENT_METHOD', 'card_error', 402);
    this.name = 'InvalidPaymentMethodError';
  }
}

export class PaymentRequiredError extends PaymentError {
  constructor(message: string = 'Payment required') {
    super(message, 'PAYMENT_REQUIRED', 'api_error', 402);
    this.name = 'PaymentRequiredError';
  }
}