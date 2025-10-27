#!/usr/bin/env node
/**
 * Payment Library CLI - Command line interface for payment management
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { z } from 'zod';
import { paymentProvider } from './stripe';
import { subscriptionManager } from './subscriptions';
import { creditManager } from './credits';
import { invoiceManager } from './invoicing';
import { SubscriptionPlan, SubscriptionStatus, InvoiceStatus } from '../../types/database';

const program = new Command();

// Validation schemas
const CreateCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional()
});

const CreateSubscriptionSchema = z.object({
  customerId: z.string().min(1),
  plan: z.nativeEnum(SubscriptionPlan),
  paymentMethodId: z.string().optional(),
  trialPeriodDays: z.number().min(0).optional(),
  metadata: z.record(z.string()).optional()
});

const CreateInvoiceSchema = z.object({
  customerId: z.string().min(1),
  subscriptionId: z.string().optional(),
  amount: z.number().min(0),
  currency: z.string().default('eur'),
  description: z.string().optional(),
  dueDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  autoFinalize: z.boolean().default(true),
  items: z.array(z.object({
    amount: z.number().min(0),
    description: z.string(),
    quantity: z.number().min(1).optional()
  })).optional()
});

// CLI Commands

program
  .name('heliolus-payment')
  .description('Heliolus Platform Payment Management CLI')
  .version('1.0.0');

// Customer commands
const customerCmd = program.command('customer').description('Customer management');

customerCmd
  .command('create')
  .description('Create a new customer')
  .requiredOption('--email <email>', 'Customer email')
  .requiredOption('--name <name>', 'Customer name')
  .option('--description <description>', 'Customer description')
  .option('--metadata <metadata>', 'Customer metadata (JSON)', parseJSON)
  .action(async (options) => {
    try {
      console.log(chalk.blue('Creating customer...'));
      
      const data = CreateCustomerSchema.parse(options);
      const customer = await paymentProvider.createCustomer(data);
      
      console.log(chalk.green('✓ Customer created successfully'));
      console.table({
        ID: customer.id,
        Email: customer.email,
        Name: customer.name,
        'Created At': customer.createdAt.toISOString()
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to create customer:'), getErrorMessage(error));
      process.exit(1);
    }
  });

customerCmd
  .command('get')
  .description('Get customer details')
  .requiredOption('--id <id>', 'Customer ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching customer...'));
      
      const customer = await paymentProvider.getCustomer(options.id);
      
      if (!customer) {
        console.log(chalk.yellow('Customer not found'));
        return;
      }
      
      console.log(chalk.green('✓ Customer found'));
      console.table({
        ID: customer.id,
        Email: customer.email,
        Name: customer.name,
        'Default Payment Method': customer.defaultPaymentMethod || 'None',
        'Created At': customer.createdAt.toISOString()
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to get customer:'), getErrorMessage(error));
      process.exit(1);
    }
  });

customerCmd
  .command('list')
  .description('List customers')
  .option('--limit <limit>', 'Number of customers to fetch', '10')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching customers...'));
      
      const customers = await paymentProvider.listCustomers({ limit: parseInt(options.limit) });
      
      console.log(chalk.green(`✓ Found ${customers.length} customers`));
      
      if (customers.length > 0) {
        const tableData = customers.map(c => ({
          ID: c.id.substring(0, 20) + '...',
          Email: c.email,
          Name: c.name,
          'Created At': c.createdAt.toISOString().split('T')[0]
        }));
        console.table(tableData);
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to list customers:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Subscription commands
const subscriptionCmd = program.command('subscription').description('Subscription management');

subscriptionCmd
  .command('create')
  .description('Create a new subscription')
  .requiredOption('--customer-id <customerId>', 'Customer ID')
  .requiredOption('--plan <plan>', `Subscription plan (${Object.values(SubscriptionPlan).join(', ')})`)
  .option('--payment-method-id <paymentMethodId>', 'Payment method ID')
  .option('--trial-period-days <days>', 'Trial period in days', parseInt)
  .option('--metadata <metadata>', 'Subscription metadata (JSON)', parseJSON)
  .action(async (options) => {
    try {
      console.log(chalk.blue('Creating subscription...'));
      
      const data = CreateSubscriptionSchema.parse(options);
      const subscription = await subscriptionManager.createSubscription(data);
      
      console.log(chalk.green('✓ Subscription created successfully'));
      console.table({
        ID: subscription.id,
        'Customer ID': subscription.customerId,
        Plan: subscription.plan,
        Status: subscription.status,
        'Current Period Start': subscription.currentPeriodStart.toISOString().split('T')[0],
        'Current Period End': subscription.currentPeriodEnd.toISOString().split('T')[0],
        'Trial End': subscription.trialEnd ? subscription.trialEnd.toISOString().split('T')[0] : 'None'
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to create subscription:'), getErrorMessage(error));
      process.exit(1);
    }
  });

subscriptionCmd
  .command('get')
  .description('Get subscription details')
  .requiredOption('--id <id>', 'Subscription ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching subscription...'));
      
      const subscription = await subscriptionManager.getSubscription(options.id);
      
      if (!subscription) {
        console.log(chalk.yellow('Subscription not found'));
        return;
      }
      
      console.log(chalk.green('✓ Subscription found'));
      console.table({
        ID: subscription.id,
        'Customer ID': subscription.customerId,
        Plan: subscription.plan,
        Status: subscription.status,
        'Current Period Start': subscription.currentPeriodStart.toISOString().split('T')[0],
        'Current Period End': subscription.currentPeriodEnd.toISOString().split('T')[0],
        'Trial End': subscription.trialEnd ? subscription.trialEnd.toISOString().split('T')[0] : 'None',
        'Canceled At': subscription.canceledAt ? subscription.canceledAt.toISOString().split('T')[0] : 'None'
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to get subscription:'), getErrorMessage(error));
      process.exit(1);
    }
  });

subscriptionCmd
  .command('list')
  .description('List subscriptions for customer')
  .requiredOption('--customer-id <customerId>', 'Customer ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching subscriptions...'));
      
      const subscriptions = await subscriptionManager.listSubscriptions(options.customerId);
      
      console.log(chalk.green(`✓ Found ${subscriptions.length} subscriptions`));
      
      if (subscriptions.length > 0) {
        const tableData = subscriptions.map(s => ({
          ID: s.id.substring(0, 20) + '...',
          Plan: s.plan,
          Status: s.status,
          'Period End': s.currentPeriodEnd.toISOString().split('T')[0],
          'Created At': s.createdAt.toISOString().split('T')[0]
        }));
        console.table(tableData);
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to list subscriptions:'), getErrorMessage(error));
      process.exit(1);
    }
  });

subscriptionCmd
  .command('cancel')
  .description('Cancel a subscription')
  .requiredOption('--id <id>', 'Subscription ID')
  .option('--immediately', 'Cancel immediately instead of at period end')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Canceling subscription...'));
      
      const subscription = await subscriptionManager.cancelSubscription(options.id, {
        immediately: options.immediately
      });
      
      console.log(chalk.green('✓ Subscription canceled'));
      console.table({
        ID: subscription.id,
        Status: subscription.status,
        'Canceled At': subscription.canceledAt ? subscription.canceledAt.toISOString() : 'At period end'
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to cancel subscription:'), getErrorMessage(error));
      process.exit(1);
    }
  });

subscriptionCmd
  .command('pause')
  .description('Pause a subscription')
  .requiredOption('--id <id>', 'Subscription ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Pausing subscription...'));
      
      const subscription = await subscriptionManager.pauseSubscription(options.id);
      
      console.log(chalk.green('✓ Subscription paused'));
      console.table({
        ID: subscription.id,
        Status: subscription.status
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to pause subscription:'), getErrorMessage(error));
      process.exit(1);
    }
  });

subscriptionCmd
  .command('resume')
  .description('Resume a subscription')
  .requiredOption('--id <id>', 'Subscription ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Resuming subscription...'));
      
      const subscription = await subscriptionManager.resumeSubscription(options.id);
      
      console.log(chalk.green('✓ Subscription resumed'));
      console.table({
        ID: subscription.id,
        Status: subscription.status
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to resume subscription:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Credit commands
const creditCmd = program.command('credits').description('Credit management');

creditCmd
  .command('balance')
  .description('Get credit balance')
  .requiredOption('--subscription-id <subscriptionId>', 'Subscription ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching credit balance...'));
      
      const balance = await creditManager.getBalance(options.subscriptionId);
      
      if (!balance) {
        console.log(chalk.yellow('Subscription not found'));
        return;
      }
      
      console.log(chalk.green('✓ Credit balance'));
      console.table({
        'Subscription ID': balance.subscriptionId,
        Balance: balance.balance,
        Used: balance.used,
        Purchased: balance.purchased,
        Plan: balance.plan,
        'Last Updated': balance.lastUpdated.toISOString()
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to get credit balance:'), getErrorMessage(error));
      process.exit(1);
    }
  });

creditCmd
  .command('add')
  .description('Add credits to subscription')
  .requiredOption('--subscription-id <subscriptionId>', 'Subscription ID')
  .requiredOption('--amount <amount>', 'Amount of credits to add', parseInt)
  .option('--description <description>', 'Description for the transaction')
  .option('--reference <reference>', 'Reference for the transaction')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Adding credits...'));
      
      const result = await creditManager.addCredits({
        subscriptionId: options.subscriptionId,
        amount: options.amount,
        description: options.description,
        reference: options.reference
      });
      
      if (!result.success) {
        console.error(chalk.red('✗ Failed to add credits:'), result.error);
        process.exit(1);
      }
      
      console.log(chalk.green('✓ Credits added successfully'));
      if (result.data) {
        console.table({
          'Transaction ID': result.data.transaction.id,
          Amount: result.data.transaction.amount,
          'New Balance': result.data.balance.balance,
          Description: result.data.transaction.description
        });
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to add credits:'), getErrorMessage(error));
      process.exit(1);
    }
  });

creditCmd
  .command('deduct')
  .description('Deduct credits from subscription')
  .requiredOption('--subscription-id <subscriptionId>', 'Subscription ID')
  .requiredOption('--amount <amount>', 'Amount of credits to deduct', parseInt)
  .option('--description <description>', 'Description for the transaction')
  .option('--reference <reference>', 'Reference for the transaction')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Deducting credits...'));
      
      const result = await creditManager.deductCredits({
        subscriptionId: options.subscriptionId,
        amount: options.amount,
        description: options.description,
        reference: options.reference
      });
      
      if (!result.success) {
        console.error(chalk.red('✗ Failed to deduct credits:'), result.error);
        process.exit(1);
      }
      
      console.log(chalk.green('✓ Credits deducted successfully'));
      if (result.data) {
        console.table({
          'Transaction ID': result.data.transaction.id,
          Amount: Math.abs(result.data.transaction.amount),
          'New Balance': result.data.balance.balance,
          Description: result.data.transaction.description
        });
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to deduct credits:'), getErrorMessage(error));
      process.exit(1);
    }
  });

creditCmd
  .command('history')
  .description('Get credit transaction history')
  .requiredOption('--subscription-id <subscriptionId>', 'Subscription ID')
  .option('--limit <limit>', 'Number of transactions to fetch', '20')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching transaction history...'));
      
      const transactions = await creditManager.getTransactionHistory(
        options.subscriptionId,
        parseInt(options.limit)
      );
      
      console.log(chalk.green(`✓ Found ${transactions.length} transactions`));
      
      if (transactions.length > 0) {
        const tableData = transactions.map(t => ({
          ID: t.id.substring(0, 20) + '...',
          Type: t.type,
          Amount: t.amount,
          Balance: t.balance,
          Description: t.description.substring(0, 40) + (t.description.length > 40 ? '...' : ''),
          Date: t.createdAt.toISOString().split('T')[0]
        }));
        console.table(tableData);
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to get transaction history:'), getErrorMessage(error));
      process.exit(1);
    }
  });

creditCmd
  .command('transfer')
  .description('Transfer credits between subscriptions')
  .requiredOption('--from <fromSubscriptionId>', 'Source subscription ID')
  .requiredOption('--to <toSubscriptionId>', 'Destination subscription ID')
  .requiredOption('--amount <amount>', 'Amount of credits to transfer', parseInt)
  .option('--description <description>', 'Description for the transfer')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Transferring credits...'));
      
      const result = await creditManager.transferCredits(
        options.from,
        options.to,
        options.amount,
        options.description
      );
      
      if (!result.success) {
        console.error(chalk.red('✗ Failed to transfer credits:'), result.error);
        process.exit(1);
      }
      
      console.log(chalk.green('✓ Credits transferred successfully'));
      if (result.data) {
        console.table({
          'From Balance': result.data.fromBalance.balance,
          'To Balance': result.data.toBalance.balance,
          'Amount Transferred': options.amount
        });
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to transfer credits:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Invoice commands
const invoiceCmd = program.command('invoice').description('Invoice management');

invoiceCmd
  .command('create')
  .description('Create a new invoice')
  .requiredOption('--customer-id <customerId>', 'Customer ID')
  .requiredOption('--amount <amount>', 'Invoice amount in cents', parseInt)
  .option('--subscription-id <subscriptionId>', 'Subscription ID')
  .option('--currency <currency>', 'Currency code', 'eur')
  .option('--description <description>', 'Invoice description')
  .option('--due-date <dueDate>', 'Due date (YYYY-MM-DD)')
  .option('--no-auto-finalize', 'Do not auto-finalize the invoice')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Creating invoice...'));
      
      const data = CreateInvoiceSchema.parse({
        ...options,
        autoFinalize: !options.noAutoFinalize
      });
      
      const invoice = await invoiceManager.createInvoice(data);
      
      console.log(chalk.green('✓ Invoice created successfully'));
      console.table({
        ID: invoice.id,
        'Customer ID': invoice.customerId,
        Amount: `${invoice.amount / 100} ${invoice.currency.toUpperCase()}`,
        Status: invoice.status,
        Description: invoice.description || 'No description',
        'Due Date': invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : 'No due date',
        'Created At': invoice.createdAt.toISOString().split('T')[0]
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to create invoice:'), getErrorMessage(error));
      process.exit(1);
    }
  });

invoiceCmd
  .command('get')
  .description('Get invoice details')
  .requiredOption('--id <id>', 'Invoice ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching invoice...'));
      
      const invoice = await invoiceManager.getInvoice(options.id);
      
      if (!invoice) {
        console.log(chalk.yellow('Invoice not found'));
        return;
      }
      
      console.log(chalk.green('✓ Invoice found'));
      console.table({
        ID: invoice.id,
        'Customer ID': invoice.customerId,
        'Subscription ID': invoice.subscriptionId || 'None',
        Amount: `${invoice.amount / 100} ${invoice.currency.toUpperCase()}`,
        Status: invoice.status,
        Description: invoice.description || 'No description',
        'Due Date': invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : 'No due date',
        'Paid At': invoice.paidAt ? invoice.paidAt.toISOString().split('T')[0] : 'Not paid',
        'Created At': invoice.createdAt.toISOString().split('T')[0]
      });
      
      if (invoice.hostedInvoiceUrl) {
        console.log(chalk.cyan('\nHosted Invoice URL:'), invoice.hostedInvoiceUrl);
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to get invoice:'), getErrorMessage(error));
      process.exit(1);
    }
  });

invoiceCmd
  .command('list')
  .description('List invoices for customer')
  .requiredOption('--customer-id <customerId>', 'Customer ID')
  .option('--limit <limit>', 'Number of invoices to fetch', '10')
  .option('--status <status>', `Filter by status (${Object.values(InvoiceStatus).join(', ')})`)
  .option('--subscription-id <subscriptionId>', 'Filter by subscription ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching invoices...'));
      
      const invoices = await invoiceManager.listInvoices(options.customerId, {
        limit: parseInt(options.limit),
        status: options.status,
        subscriptionId: options.subscriptionId
      });
      
      console.log(chalk.green(`✓ Found ${invoices.length} invoices`));
      
      if (invoices.length > 0) {
        const tableData = invoices.map(i => ({
          ID: i.id.substring(0, 20) + '...',
          Amount: `${i.amount / 100} ${i.currency.toUpperCase()}`,
          Status: i.status,
          'Due Date': i.dueDate ? i.dueDate.toISOString().split('T')[0] : 'No due date',
          'Created At': i.createdAt.toISOString().split('T')[0]
        }));
        console.table(tableData);
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to list invoices:'), getErrorMessage(error));
      process.exit(1);
    }
  });

invoiceCmd
  .command('pay')
  .description('Pay an invoice')
  .requiredOption('--id <id>', 'Invoice ID')
  .option('--payment-method-id <paymentMethodId>', 'Payment method ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Paying invoice...'));
      
      const result = await invoiceManager.payInvoice(options.id, options.paymentMethodId);
      
      if (!result.success) {
        console.error(chalk.red('✗ Failed to pay invoice:'), result.error);
        process.exit(1);
      }
      
      console.log(chalk.green('✓ Invoice paid successfully'));
      if (result.data) {
        console.table({
          ID: result.data.id,
          Status: result.data.status,
          'Paid At': result.data.paidAt ? result.data.paidAt.toISOString() : 'Not paid'
        });
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to pay invoice:'), getErrorMessage(error));
      process.exit(1);
    }
  });

invoiceCmd
  .command('void')
  .description('Void an invoice')
  .requiredOption('--id <id>', 'Invoice ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Voiding invoice...'));
      
      const result = await invoiceManager.voidInvoice(options.id);
      
      if (!result.success) {
        console.error(chalk.red('✗ Failed to void invoice:'), result.error);
        process.exit(1);
      }
      
      console.log(chalk.green('✓ Invoice voided successfully'));
      if (result.data) {
        console.table({
          ID: result.data.id,
          Status: result.data.status
        });
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to void invoice:'), getErrorMessage(error));
      process.exit(1);
    }
  });

invoiceCmd
  .command('send')
  .description('Send invoice to customer')
  .requiredOption('--id <id>', 'Invoice ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Sending invoice...'));
      
      const result = await invoiceManager.sendInvoice(options.id);
      
      if (!result.success) {
        console.error(chalk.red('✗ Failed to send invoice:'), result.error);
        process.exit(1);
      }
      
      console.log(chalk.green('✓ Invoice sent successfully'));
    } catch (error) {
      console.error(chalk.red('✗ Failed to send invoice:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Utility functions
function parseJSON(value: string): any {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON: ${value}`);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str))
});

// Parse command line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { program as paymentCli };