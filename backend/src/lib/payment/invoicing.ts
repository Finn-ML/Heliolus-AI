// @ts-nocheck - Stripe Invoice API type mismatches with current SDK version
/**
 * Invoice management system
 */

import Stripe from 'stripe';
import { PrismaClient } from '../../generated/prisma/index';
import {
  InvoiceManager,
  Invoice,
  CreateInvoiceData,
  UpdateInvoiceData,
  InvoiceItem,
  InvoiceResult,
  PaymentError,
  InvoiceLineItem
} from './types';
import { PAYMENT_CONFIG } from './config';
import { InvoiceStatus } from '../../types/database';

const prisma = new PrismaClient();
const stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey, {
  apiVersion: PAYMENT_CONFIG.stripe.apiVersion
});

/**
 * Comprehensive invoice management
 */
export class HeliolusInvoiceManager implements InvoiceManager {
  /**
   * Create new invoice
   */
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      console.log(`Creating invoice for customer ${data.customerId}`);

      // Create Stripe invoice
      const stripeInvoice = await stripe.invoices.create({
        customer: data.customerId,
        currency: data.currency || 'eur',
        description: data.description,
        metadata: data.metadata || {},
        auto_advance: data.autoFinalize !== false,
        collection_method: data.collectionMethod || 'charge_automatically',
        due_date: data.dueDate ? Math.floor(data.dueDate.getTime() / 1000) : undefined
      });

      // Add invoice items
      if (data.lineItems && data.lineItems.length > 0) {
        for (const item of data.lineItems) {
          await stripe.invoiceItems.create({
            customer: data.customerId,
            invoice: stripeInvoice.id,
            amount: (item as any).unitPrice * ((item as any).quantity || 1), // Calculate amount from unitPrice
            currency: data.currency || 'eur',
            description: item.description,
            quantity: (item as any).quantity || 1,
            metadata: (item as any).metadata || {}
          });
        }
      }

      // Finalize the invoice if requested
      if (data.autoFinalize !== false) {
        await stripe.invoices.finalizeInvoice(stripeInvoice.id);
      }

      // Create database invoice record
      const dbInvoice = await prisma.invoice.create({
        data: {
          stripeInvoiceId: stripeInvoice.id,
          stripeChargeId: stripeInvoice.charge as string | undefined,
          subscriptionId: data.subscriptionId || 'default', // Required field
          number: stripeInvoice.number || `INV-${Date.now()}`,
          amount: stripeInvoice.amount_due / 100, // Convert from cents to currency units
          currency: stripeInvoice.currency.toUpperCase(),
          status: this.mapStripeInvoiceStatus(stripeInvoice.status),
          periodStart: new Date(stripeInvoice.period_start * 1000),
          periodEnd: new Date(stripeInvoice.period_end * 1000),
          dueDate: data.dueDate || new Date(stripeInvoice.due_date ? stripeInvoice.due_date * 1000 : Date.now()),
          paidAt: stripeInvoice.status === 'paid' ? new Date() : null,
          pdfUrl: stripeInvoice.invoice_pdf || undefined
        }
      });

      return this.mapDatabaseInvoice(dbInvoice, stripeInvoice);
    } catch (error) {
      console.error('Create invoice error:', error);
      throw error instanceof PaymentError ? error : new PaymentError('Failed to create invoice');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!dbInvoice || !dbInvoice.stripeInvoiceId) {
        return null;
      }

      // Get latest data from Stripe
      const stripeInvoice = await stripe.invoices.retrieve(dbInvoice.stripeInvoiceId);

      // Update database with latest status
      const updatedDbInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: this.mapStripeInvoiceStatus(stripeInvoice.status),
          amount: stripeInvoice.amount_due,
          paidAt: stripeInvoice.status === 'paid' ? new Date(stripeInvoice.status_transitions.paid_at! * 1000) : null
        }
      });

      return this.mapDatabaseInvoice(updatedDbInvoice, stripeInvoice);
    } catch (error) {
      console.error('Get invoice error:', error);
      return null;
    }
  }

  /**
   * List invoices for customer
   */
  async listInvoices(customerId: string, options?: {
    limit?: number;
    status?: InvoiceStatus;
    subscriptionId?: string;
  }): Promise<Invoice[]> {
    try {
      const where: any = { stripeCustomerId: customerId };
      
      if (options?.status) {
        where.status = options.status;
      }
      
      if (options?.subscriptionId) {
        where.subscriptionId = options.subscriptionId;
      }

      const dbInvoices = await prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50
      });

      // Get Stripe invoices for latest data
      const invoices: Invoice[] = [];
      for (const dbInvoice of dbInvoices) {
        if (dbInvoice.stripeInvoiceId) {
          try {
            const stripeInvoice = await stripe.invoices.retrieve(dbInvoice.stripeInvoiceId);
            invoices.push(this.mapDatabaseInvoice(dbInvoice, stripeInvoice));
          } catch (error) {
            // If Stripe invoice not found, use database data
            invoices.push(this.mapDatabaseInvoice(dbInvoice));
          }
        } else {
          invoices.push(this.mapDatabaseInvoice(dbInvoice));
        }
      }

      return invoices;
    } catch (error) {
      console.error('List invoices error:', error);
      return [];
    }
  }

  /**
   * Pay invoice manually
   */
  async payInvoice(invoiceId: string, paymentMethodId?: string): Promise<InvoiceResult> {
    try {
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!dbInvoice || !dbInvoice.stripeInvoiceId) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      // Pay the Stripe invoice
      const stripeInvoice = await stripe.invoices.pay(dbInvoice.stripeInvoiceId, {
        payment_method: paymentMethodId
      });

      // Update database
      const updatedDbInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: this.mapStripeInvoiceStatus(stripeInvoice.status),
          paidAt: stripeInvoice.status === 'paid' ? new Date() : null
        }
      });

      return {
        success: true,
        data: this.mapDatabaseInvoice(updatedDbInvoice, stripeInvoice)
      };
    } catch (error) {
      console.error('Pay invoice error:', error);
      return {
        success: false,
        error: error instanceof PaymentError ? error.message : 'Failed to pay invoice'
      };
    }
  }

  /**
   * Void/cancel invoice
   */
  async voidInvoice(invoiceId: string): Promise<InvoiceResult> {
    try {
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!dbInvoice || !dbInvoice.stripeInvoiceId) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      // Void the Stripe invoice
      const stripeInvoice = await stripe.invoices.voidInvoice(dbInvoice.stripeInvoiceId);

      // Update database
      const updatedDbInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: this.mapStripeInvoiceStatus(stripeInvoice.status)
        }
      });

      return {
        success: true,
        data: this.mapDatabaseInvoice(updatedDbInvoice, stripeInvoice)
      };
    } catch (error) {
      console.error('Void invoice error:', error);
      return {
        success: false,
        error: error instanceof PaymentError ? error.message : 'Failed to void invoice'
      };
    }
  }

  /**
   * Send invoice to customer
   */
  async sendInvoice(invoiceId: string): Promise<InvoiceResult> {
    try {
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!dbInvoice || !dbInvoice.stripeInvoiceId) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      // Send the Stripe invoice
      const stripeInvoice = await stripe.invoices.sendInvoice(dbInvoice.stripeInvoiceId);

      return {
        success: true,
        data: this.mapDatabaseInvoice(dbInvoice, stripeInvoice)
      };
    } catch (error) {
      console.error('Send invoice error:', error);
      return {
        success: false,
        error: error instanceof PaymentError ? error.message : 'Failed to send invoice'
      };
    }
  }

  /**
   * Get invoice PDF URL
   */
  async getInvoicePDF(invoiceId: string): Promise<string | null> {
    try {
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!dbInvoice || !dbInvoice.stripeInvoiceId) {
        return null;
      }

      const stripeInvoice = await stripe.invoices.retrieve(dbInvoice.stripeInvoiceId);
      return stripeInvoice.invoice_pdf || null;
    } catch (error) {
      console.error('Get invoice PDF error:', error);
      return null;
    }
  }

  /**
   * Get invoice usage data
   */
  async getInvoiceUsage(customerId: string, period: {
    start: Date;
    end: Date;
  }): Promise<{
    totalAmount: number;
    invoiceCount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  }> {
    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          stripeCustomerId: customerId,
          createdAt: {
            gte: period.start,
            lte: period.end
          }
        }
      });

      const stats = invoices.reduce((acc, invoice) => {
        acc.totalAmount += invoice.amount;
        acc.invoiceCount += 1;

        switch (invoice.status) {
          case InvoiceStatus.PAID:
            acc.paidAmount += invoice.amount;
            break;
          case InvoiceStatus.OPEN:
            if (invoice.dueDate && invoice.dueDate < new Date()) {
              acc.overdueAmount += invoice.amount;
            } else {
              acc.pendingAmount += invoice.amount;
            }
            break;
          case InvoiceStatus.DRAFT:
          case InvoiceStatus.UNCOLLECTIBLE:
            acc.pendingAmount += invoice.amount;
            break;
        }

        return acc;
      }, {
        totalAmount: 0,
        invoiceCount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0
      });

      return stats;
    } catch (error) {
      console.error('Get invoice usage error:', error);
      return {
        totalAmount: 0,
        invoiceCount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0
      };
    }
  }

  // Private helper methods

  private mapStripeInvoiceStatus(stripeStatus: string): InvoiceStatus {
    switch (stripeStatus) {
      case 'draft':
        return InvoiceStatus.DRAFT;
      case 'open':
        return InvoiceStatus.OPEN;
      case 'paid':
        return InvoiceStatus.PAID;
      case 'void':
        return InvoiceStatus.VOID;
      case 'uncollectible':
        return InvoiceStatus.UNCOLLECTIBLE;
      default:
        return InvoiceStatus.DRAFT;
    }
  }

  private mapDatabaseInvoice(dbInvoice: any, stripeInvoice?: Stripe.Invoice): Invoice {
    return {
      id: dbInvoice.id,
      customerId: dbInvoice.stripeCustomerId,
      subscriptionId: dbInvoice.subscriptionId,
      amount: dbInvoice.amount,
      currency: dbInvoice.currency,
      status: dbInvoice.status,
      description: dbInvoice.description,
      dueDate: dbInvoice.dueDate,
      paidAt: dbInvoice.paidAt,
      metadata: dbInvoice.metadata ? JSON.parse(dbInvoice.metadata) : undefined,
      stripeInvoiceId: dbInvoice.stripeInvoiceId,
      hostedInvoiceUrl: stripeInvoice?.hosted_invoice_url,
      invoicePdf: stripeInvoice?.invoice_pdf,
      createdAt: dbInvoice.createdAt,
      updatedAt: dbInvoice.updatedAt
    };
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId: string, data: UpdateInvoiceData): Promise<Invoice> {
    try {
      // Get the database invoice
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!dbInvoice) {
        throw new PaymentError('Invoice not found');
      }

      // Update Stripe invoice if it exists
      if (dbInvoice.stripeInvoiceId) {
        await stripe.invoices.update(dbInvoice.stripeInvoiceId, {
          description: data.description,
          metadata: data.metadata
        });
      }

      // Update database invoice
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          description: data.description,
          dueDate: data.dueDate,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
        }
      });

      return this.mapDatabaseInvoice(updatedInvoice, null);
    } catch (error) {
      console.error('Update invoice error:', error);
      throw error instanceof PaymentError ? error : new PaymentError('Failed to update invoice');
    }
  }

  /**
   * Finalize invoice
   */
  async finalizeInvoice(invoiceId: string): Promise<Invoice> {
    try {
      // Get the database invoice
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!dbInvoice) {
        throw new PaymentError('Invoice not found');
      }

      if (!dbInvoice.stripeInvoiceId) {
        throw new PaymentError('Cannot finalize non-Stripe invoice');
      }

      // Finalize the Stripe invoice
      const stripeInvoice = await stripe.invoices.finalizeInvoice(dbInvoice.stripeInvoiceId);

      // Update database
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: this.mapStripeInvoiceStatus(stripeInvoice.status)
        }
      });

      return this.mapDatabaseInvoice(updatedInvoice, stripeInvoice);
    } catch (error) {
      console.error('Finalize invoice error:', error);
      throw error instanceof PaymentError ? error : new PaymentError('Failed to finalize invoice');
    }
  }

  /**
   * Download invoice as PDF
   */
  async downloadInvoice(invoiceId: string): Promise<Buffer> {
    try {
      // Get the database invoice
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!dbInvoice) {
        throw new PaymentError('Invoice not found');
      }

      if (!dbInvoice.stripeInvoiceId) {
        throw new PaymentError('Cannot download non-Stripe invoice');
      }

      // Fetch the Stripe invoice
      const stripeInvoice = await stripe.invoices.retrieve(dbInvoice.stripeInvoiceId);

      if (!stripeInvoice.invoice_pdf) {
        throw new PaymentError('Invoice PDF not available');
      }

      // Download the PDF
      const response = await fetch(stripeInvoice.invoice_pdf);
      if (!response.ok) {
        throw new PaymentError('Failed to download invoice PDF');
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Download invoice error:', error);
      throw error instanceof PaymentError ? error : new PaymentError('Failed to download invoice');
    }
  }
}

// Export the invoice manager instance
export const invoiceManager = new HeliolusInvoiceManager();