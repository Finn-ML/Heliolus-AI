# Revised Pay-Gating Implementation Plan v4.0

**Status:** READY FOR IMPLEMENTATION
**Created:** 2025-10-23
**Priority:** HIGH

---

## 📊 NEW TIER STRUCTURE

### **Freemium (Basic) - FREE**
**What They Get:**
- ✅ Compliance score visible
- ❌ Gap analysis (BLURRED/MOCKED - no OpenAI cost)
- ❌ Strategy matrix (BLURRED/MOCKED - no OpenAI cost)
- ✅ Browse vendors (read-only directory)
- ❌ Vendor AI matching (hidden)
- ✅ Contact vendors directly (no lead tracking)
- **Limit**: 2 assessments TOTAL (lifetime, non-renewable)

**UX Triggers:**
- "Upgrade to see full analysis" - blurred content
- "See AI-matched vendors" - vendor section
- "2 of 2 assessments used" - quota warning

---

### **Premium (Paid) - €599/month or €6,490/year**
**What They Get:**
- ✅ Compliance score (visible)
- ✅ Gap analysis (real OpenAI analysis)
- ✅ Strategy matrix (real OpenAI analysis)
- ✅ Downloadable PDF reports
- ✅ Vendor AI matching (personalized recommendations)
- ✅ Lead tracking for vendor contacts

**Assessment Allocation:**
- **Included**: 2 full assessments per billing cycle
- **Additional**: €299 per assessment (buys enough credits for 1 more)
- **Billing Cycle**: Monthly or Annual
- **Annual Discount**: 10% off = €599 × 12 × 0.9 = €6,490.80/year

**On Upgrade from Freemium:**
- Access to their previous 2 mocked assessments (now with real analysis)
- No loss of data, just unlocked

**Credit Model:**
```
€299 = enough credits for 1 additional assessment
(cost varies per template, but €299 covers most)
```

---

### **Enterprise (Top Tier) - Custom Annual**
**What They Get:**
- ✅ Everything in Premium
- ✅ Unlimited assessments
- ✅ Custom billing cycle
- ✅ Dedicated support

**Admin Capability:**
- Admin can manually add credits to Enterprise accounts
- No self-service purchasing
- Monthly reconciliation and billing

---

## 🏗️ IMPLEMENTATION PHASES

### **Phase 1: Database & Core Logic** (8-10 hours)

#### 1.1 Update Subscription Model

**Add fields for billing cycle:**
```prisma
model Subscription {
  // ... existing fields

  plan           SubscriptionPlan   // FREE, PREMIUM, ENTERPRISE
  billingCycle   BillingCycle?      // MONTHLY, ANNUAL (null = no auto-renew)
  billingEmail   String?

  // Billing dates
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  renewalDate          DateTime?

  // Stripe
  stripeSubscriptionId String?
  stripePriceId        String?    // Links to price object (monthly vs annual)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}
```

#### 1.2 Add Assessment Count Tracking

**New table for tracking Freemium limits:**
```prisma
model UserAssessmentQuota {
  id          String @id @default(cuid())
  userId      String @unique

  // Freemium tracking
  totalAssessmentsCreated  Int @default(0) // Freemium: max 2

  // Premium tracking
  assessmentsThisMonth     Int @default(0) // For billing cycle tracking
  assessmentsUsedThisMonth Int @default(0)

  // Enterprise: unlimited

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

#### 1.3 Create FreemiumContentService

**File:** `/backend/src/services/freemium-content.service.ts`

```typescript
export class FreemiumContentService extends BaseService {
  /**
   * Generate MOCKED blurred gap analysis for Freemium users
   * This is fast and costs nothing (no OpenAI call)
   */
  async generateMockedGapAnalysis(assessment: Assessment): Promise<Gap[]> {
    // Return 3-5 generic "blurred" gaps without actual content
    return [
      {
        id: `mock-gap-${assessment.id}-1`,
        assessmentId: assessment.id,
        category: 'HIDDEN_ANALYSIS',
        title: 'Risk Area 1',
        description: '[UNLOCK PREMIUM TO SEE DETAILS]',
        severity: 'HIGH', // Intentionally generic
        evidence: null,
        remediation: null,
        isRestricted: true,
      },
      {
        id: `mock-gap-${assessment.id}-2`,
        category: 'HIDDEN_ANALYSIS',
        title: 'Risk Area 2',
        description: '[UNLOCK PREMIUM TO SEE DETAILS]',
        severity: 'MEDIUM',
        evidence: null,
        remediation: null,
        isRestricted: true,
      },
      // ... more mock gaps
    ];
  }

  /**
   * Generate MOCKED blurred strategy matrix for Freemium
   */
  async generateMockedStrategyMatrix(assessment: Assessment): Promise<StrategyMatrix> {
    return {
      id: `mock-matrix-${assessment.id}`,
      assessmentId: assessment.id,
      matrix: [
        { x: 'Low', y: 'Low', items: ['[DETAILS HIDDEN]'] },
        { x: 'High', y: 'High', items: ['[DETAILS HIDDEN]'] },
      ],
      summary: 'Upgrade to Premium to see personalized strategy recommendations',
      isRestricted: true,
    };
  }

  /**
   * Check if user should see real or mocked analysis
   */
  async shouldGenerateRealAnalysis(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true },
    });

    return subscription?.plan !== SubscriptionPlan.FREE;
  }
}
```

#### 1.4 Create Admin Credit Service

**File:** `/backend/src/services/admin-credit.service.ts`

```typescript
export class AdminCreditService extends BaseService {
  /**
   * Admin manually add credits to user account (Enterprise)
   */
  async addCreditsToUser(
    userId: string,
    amount: number,
    reason: string,
    context: ServiceContext
  ): Promise<CreditTransaction> {
    this.requireAdmin(context);

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw this.createError('User subscription not found', 404);
    }

    const newBalance = subscription.creditsBalance + amount;

    const transaction = await this.prisma.creditTransaction.create({
      data: {
        subscriptionId: subscription.id,
        type: TransactionType.ADMIN_GRANT,
        amount,
        balance: newBalance,
        description: reason,
        metadata: {
          grantedBy: context.userId,
          grantReason: reason,
        },
      },
    });

    // Update subscription balance
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        creditsBalance: newBalance,
      },
    });

    await this.logAudit({
      action: 'CREDITS_GRANTED',
      entity: 'User',
      entityId: userId,
      metadata: { amount, reason },
    }, context);

    return transaction;
  }

  /**
   * Get credit transaction history for user
   */
  async getUserCreditHistory(userId: string): Promise<CreditTransaction[]> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw this.createError('User subscription not found', 404);
    }

    return this.prisma.creditTransaction.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

#### 1.5 Update Assessment Service

**Key changes in `/backend/src/services/assessment.service.ts`:**

```typescript
// When user creates assessment, check Freemium quota
async createAssessment(input: CreateAssessmentInput, context: ServiceContext) {
  const user = await this.prisma.user.findUnique({
    where: { id: context.userId },
    include: { subscription: true },
  });

  // Check if Freemium user exceeded limit
  if (user.subscription.plan === SubscriptionPlan.FREE) {
    const quota = await this.prisma.userAssessmentQuota.findUnique({
      where: { userId: context.userId },
    });

    if (quota && quota.totalAssessmentsCreated >= 2) {
      throw this.createError(
        'Free users can create maximum 2 assessments. Upgrade to Premium for unlimited access.',
        402,
        'FREEMIUM_QUOTA_EXCEEDED'
      );
    }
  }

  // Create assessment...
  const assessment = await this.prisma.assessment.create({ ... });

  // Update quota if Freemium
  if (user.subscription.plan === SubscriptionPlan.FREE) {
    await this.prisma.userAssessmentQuota.update({
      where: { userId: context.userId },
      data: { totalAssessmentsCreated: { increment: 1 } },
    });
  }

  return assessment;
}

// When getting assessment results
async getAssessmentResults(assessmentId: string, context: ServiceContext) {
  const assessment = await this.prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      user: true,
      template: true,
      answers: true,
      gaps: true,
      risks: true,
    },
  });

  const user = await this.prisma.user.findUnique({
    where: { id: assessment.userId },
    include: { subscription: true },
  });

  // If Freemium: return mocked gaps/strategy instead of real ones
  if (user.subscription.plan === SubscriptionPlan.FREE) {
    const freemiumContentService = new FreemiumContentService(this.prisma, this.logger);

    // Replace gaps with mocked ones
    assessment.gaps = await freemiumContentService.generateMockedGapAnalysis(assessment);

    // Mark strategy as restricted
    if (assessment.aiStrategyMatrix) {
      assessment.aiStrategyMatrix.isRestricted = true;
      assessment.aiStrategyMatrix.content = '[UNLOCK PREMIUM TO SEE]';
    }

    return {
      ...assessment,
      isRestricted: true,
      restrictionReason: 'Upgrade to Premium to see full analysis',
    };
  }

  // For Premium/Enterprise: return real analysis
  return assessment;
}
```

---

### **Phase 2: Pricing & Billing Service** (6-8 hours)

#### 2.1 Update Subscription Service

**File:** `/backend/src/services/subscription.service.ts`

Key changes:
```typescript
// Define pricing tiers
const PRICING = {
  PREMIUM_MONTHLY: {
    price: 59900, // €599 in cents
    currency: 'eur',
    billingCycle: 'month',
  },
  PREMIUM_ANNUAL: {
    price: 649080, // €6490.80 (10% discount)
    currency: 'eur',
    billingCycle: 'year',
  },
  ADDITIONAL_ASSESSMENT: {
    price: 29900, // €299 per assessment
    currency: 'eur',
  },
};

// Create subscription with billing cycle
async createSubscription(
  userId: string,
  plan: SubscriptionPlan,
  billingCycle?: BillingCycle
): Promise<Subscription> {
  const now = new Date();
  const periodEnd = billingCycle === 'ANNUAL'
    ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  return this.prisma.subscription.create({
    data: {
      userId,
      plan,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      creditsBalance: this.getInitialCredits(plan),
    },
  });
}

// Get initial credits based on plan
private getInitialCredits(plan: SubscriptionPlan): number {
  switch (plan) {
    case SubscriptionPlan.FREE:
      return 0;
    case SubscriptionPlan.PREMIUM:
      return 100; // Enough for ~2 assessments initially
    case SubscriptionPlan.ENTERPRISE:
      return 0; // Admin grants as needed
    default:
      return 0;
  }
}

// Purchase additional assessment (€299 = credits for 1 assessment)
async purchaseAdditionalAssessment(
  userId: string,
  stripePriceId: string
): Promise<{ success: boolean; creditsAdded: number }> {
  const subscription = await this.prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw this.createError('Subscription not found', 404);
  }

  // In real Stripe: payment processed and webhook confirms
  // For now: assume payment succeeded and add credits

  const creditsToAdd = 50; // €299 = 50 credits (enough for 1 assessment)

  await this.prisma.subscription.update({
    where: { userId },
    data: {
      creditsBalance: { increment: creditsToAdd },
      creditsPurchased: { increment: creditsToAdd },
    },
  });

  // Record transaction
  await this.prisma.creditTransaction.create({
    data: {
      subscriptionId: subscription.id,
      type: TransactionType.PURCHASE,
      amount: creditsToAdd,
      balance: subscription.creditsBalance + creditsToAdd,
      description: 'Purchased additional assessment credits',
      metadata: {
        amount: 29900, // €299 in cents
        stripePriceId,
      },
    },
  });

  return { success: true, creditsAdded };
}
```

#### 2.2 Create Billing Service

**File:** `/backend/src/services/billing.service.ts`

```typescript
export class BillingService extends BaseService {
  /**
   * Process monthly/annual renewal
   * Called by webhook or scheduled task
   */
  async processSubscriptionRenewal(subscriptionId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || !subscription.billingCycle) {
      return; // Not a recurring subscription
    }

    // Generate invoice
    const invoice = await this.generateInvoice(subscription);

    // Process Stripe charge (in real implementation)
    // const charge = await this.stripe.charges.create({ ... });

    // Update subscription period
    const now = new Date();
    const nextPeriodEnd = subscription.billingCycle === 'ANNUAL'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: now,
        currentPeriodEnd: nextPeriodEnd,
        renewalDate: nextPeriodEnd,
      },
    });

    // Reset monthly assessment count if needed
    if (subscription.billingCycle === 'MONTHLY') {
      await this.prisma.userAssessmentQuota.update({
        where: { userId: subscription.userId },
        data: { assessmentsUsedThisMonth: 0 },
      });
    }
  }

  /**
   * Generate invoice for billing cycle
   */
  private async generateInvoice(subscription: Subscription): Promise<Invoice> {
    const amount = subscription.billingCycle === 'ANNUAL' ? 649080 : 59900;

    return this.prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: `draft-${Date.now()}`, // Real Stripe ID in production
        amount: amount / 100,
        currency: 'EUR',
        status: InvoiceStatus.DRAFT,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        dueDate: new Date(subscription.currentPeriodEnd.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    });
  }
}
```

---

### **Phase 3: API Endpoints** (4-6 hours)

#### 3.1 Assessment Routes - Quota Check

**File:** `/backend/src/routes/assessment.routes.ts`

```typescript
// POST /v1/assessments - Create assessment
fastify.post('/', {
  preHandler: [authMiddleware],
  schema: {
    body: z.object({
      templateId: z.string(),
      organizationId: z.string(),
    }),
  }
}, async (request, reply) => {
  try {
    const assessment = await assessmentService.createAssessment({
      templateId: request.body.templateId,
      organizationId: request.body.organizationId,
      userId: request.user.id,
    }, { userId: request.user.id, userRole: request.user.role });

    return reply.send({ success: true, data: assessment });
  } catch (error) {
    if (error.code === 'FREEMIUM_QUOTA_EXCEEDED') {
      return reply.code(402).send({
        success: false,
        error: error.message,
        code: 'FREEMIUM_QUOTA_EXCEEDED',
        upgradeUrl: '/pricing?upgrade=premium',
      });
    }
    throw error;
  }
});
```

#### 3.2 Admin Credit Routes

**File:** `/backend/src/routes/admin.routes.ts` (new endpoints)

```typescript
// POST /v1/admin/users/:userId/credits - Grant credits
fastify.post('/users/:userId/credits', {
  preHandler: [authMiddleware, rbacMiddleware(['ADMIN'])],
  schema: {
    params: z.object({ userId: z.string() }),
    body: z.object({
      amount: z.number().min(1),
      reason: z.string(),
    }),
  }
}, async (request, reply) => {
  const transaction = await adminCreditService.addCreditsToUser(
    request.params.userId,
    request.body.amount,
    request.body.reason,
    { userId: request.user.id, userRole: request.user.role }
  );

  return reply.send({ success: true, data: transaction });
});

// GET /v1/admin/users/:userId/credits - Credit history
fastify.get('/users/:userId/credits', {
  preHandler: [authMiddleware, rbacMiddleware(['ADMIN'])],
}, async (request, reply) => {
  const history = await adminCreditService.getUserCreditHistory(request.params.userId);
  return reply.send({ success: true, data: history });
});
```

#### 3.3 Subscription Routes - Billing Cycles

**File:** `/backend/src/routes/subscription.routes.ts` (update)

```typescript
// POST /v1/subscriptions/:userId/upgrade - Change plan
fastify.post('/:userId/upgrade', {
  preHandler: [authMiddleware],
  schema: {
    params: z.object({ userId: z.string() }),
    body: z.object({
      plan: z.enum(['PREMIUM']),
      billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
      stripePaymentMethodId: z.string(),
    }),
  }
}, async (request, reply) => {
  // In real implementation:
  // 1. Create Stripe subscription with price object (monthly vs annual)
  // 2. Update local subscription record
  // 3. Send confirmation email

  const subscription = await subscriptionService.createSubscription(
    request.params.userId,
    request.body.plan,
    request.body.billingCycle
  );

  return reply.send({ success: true, data: subscription });
});

// POST /v1/subscriptions/:userId/purchase-assessment - Buy additional assessment
fastify.post('/:userId/purchase-assessment', {
  preHandler: [authMiddleware],
  schema: {
    params: z.object({ userId: z.string() }),
    body: z.object({
      stripePriceId: z.string(),
    }),
  }
}, async (request, reply) => {
  const result = await subscriptionService.purchaseAdditionalAssessment(
    request.params.userId,
    request.body.stripePriceId
  );

  return reply.send({ success: true, data: result });
});

// GET /v1/subscriptions/:userId/billing-info - Get subscription details
fastify.get('/:userId/billing-info', {
  preHandler: [authMiddleware],
}, async (request, reply) => {
  const subscription = await this.prisma.subscription.findUnique({
    where: { userId: request.params.userId },
    select: {
      plan: true,
      billingCycle: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      creditsBalance: true,
      stripeSubscriptionId: true,
    },
  });

  return reply.send({ success: true, data: subscription });
});
```

---

### **Phase 4: Frontend Integration** (8-10 hours)

#### 4.1 Assessment Creation - Quota Warning

**File:** `/frontend/src/pages/AssessmentTemplates.tsx` (update)

```typescript
export function AssessmentTemplates() {
  const { data: subscription } = useQuery({
    queryKey: ['subscription', 'info'],
    queryFn: async () => {
      const res = await api.get('/v1/subscriptions/billing-info');
      return res.data.data;
    }
  });

  const { data: quota } = useQuery({
    queryKey: ['user', 'assessment-quota'],
    queryFn: async () => {
      const res = await api.get('/v1/user/assessment-quota');
      return res.data.data;
    }
  });

  const handleSelectTemplate = (templateId: string) => {
    // Check if Freemium user reached limit
    if (subscription.plan === 'FREE' && quota.totalAssessmentsCreated >= 2) {
      return (
        <UpgradePrompt
          title="Assessment Limit Reached"
          message="Free users can create maximum 2 assessments"
          plan="PREMIUM"
          price="€599/month"
          onUpgrade={() => navigate('/pricing?upgrade=premium')}
        />
      );
    }

    // Proceed with assessment creation
    // ...
  };

  return (
    <>
      {subscription.plan === 'FREE' && (
        <QuotaWarning
          used={quota.totalAssessmentsCreated}
          total={2}
          message={`${2 - quota.totalAssessmentsCreated} assessments remaining`}
        />
      )}

      {/* Template selection UI */}
    </>
  );
}
```

#### 4.2 Assessment Results - Freemium Blurred Content

**File:** `/frontend/src/pages/AssessmentResults.tsx` (update)

```typescript
export function AssessmentResults({ assessmentId }: Props) {
  const { data: results } = useQuery({
    queryKey: ['assessment', assessmentId, 'results'],
    queryFn: async () => {
      const res = await api.get(`/v1/assessments/${assessmentId}/results`);
      return res.data.data;
    }
  });

  return (
    <>
      {/* Always show compliance score */}
      <ComplianceScore score={results.riskScore} />

      {results.isRestricted ? (
        // FREEMIUM: Show blurred content
        <>
          <BlurredSection title="Gap Analysis">
            <p className="text-gray-500">
              Upgrade to Premium to see detailed gap analysis
            </p>
            <UpgradeButton price="€599/month" />
          </BlurredSection>

          <BlurredSection title="Strategy Matrix">
            <p className="text-gray-500">
              Upgrade to Premium to see personalized recommendations
            </p>
            <UpgradeButton price="€599/month" />
          </BlurredSection>

          <VendorBrowse vendors={results.vendors} matching={null} />
        </>
      ) : (
        // PREMIUM/ENTERPRISE: Show full content
        <>
          <GapAnalysis gaps={results.gaps} />
          <StrategyMatrix matrix={results.aiStrategyMatrix} />
          <VendorMatching matches={results.vendorMatches} />
          <DownloadReport assessmentId={assessmentId} />
        </>
      )}
    </>
  );
}
```

#### 4.3 Pricing Page - Tier Comparison

**File:** `/frontend/src/pages/Pricing.tsx` (create/update)

```typescript
export function PricingPage() {
  const { user } = useAuth();
  const { data: subscription } = useQuery({
    queryKey: ['subscription', 'info'],
    queryFn: async () => api.get('/v1/subscriptions/billing-info').then(r => r.data.data)
  });

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* FREEMIUM */}
      <PricingCard
        name="Freemium"
        price="Free"
        features={[
          '✅ Compliance Score',
          '❌ Gap Analysis (Blurred)',
          '❌ Strategy Matrix (Blurred)',
          '✅ Vendor Browse',
          '❌ Vendor Matching',
          '📊 2 Assessments Total',
          '❌ Downloadable Reports',
        ]}
        cta={subscription?.plan === 'FREE' ? 'Current Plan' : 'Downgrade'}
        ctaDisabled={subscription?.plan === 'FREE'}
      />

      {/* PREMIUM */}
      <PricingCard
        name="Premium"
        price="€599/month"
        subtext="or €6,490/year (save 10%)"
        features={[
          '✅ Compliance Score',
          '✅ Gap Analysis (Full)',
          '✅ Strategy Matrix (Full)',
          '✅ Vendor Browse',
          '✅ Vendor Matching (AI)',
          '📊 2 Assessments Included',
          '✅ Additional: €299 each',
          '✅ Downloadable Reports',
          '✅ Lead Tracking',
        ]}
        cta={subscription?.plan === 'PREMIUM' ? 'Current Plan' : 'Upgrade Now'}
        ctaDisabled={subscription?.plan === 'PREMIUM'}
        onSelect={() => navigate('/checkout?plan=premium&cycle=monthly')}
        highlighted
      />

      {/* ENTERPRISE */}
      <PricingCard
        name="Enterprise"
        price="Custom"
        subtext="Annual Plans"
        features={[
          '✅ Everything in Premium',
          '🚀 Unlimited Assessments',
          '🎯 Custom Billing',
          '🤝 Dedicated Support',
          '👨‍💼 Account Manager',
          '📊 Advanced Analytics',
        ]}
        cta="Contact Sales"
        onSelect={() => window.open('mailto:sales@heliolus.com')}
      />
    </div>
  );
}
```

#### 4.4 Admin Panel - Credit Management

**File:** `/frontend/src/pages/admin/UserManagement.tsx` (update)

```typescript
export function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  const grantCredits = useMutation({
    mutationFn: async () => {
      await api.post(`/v1/admin/users/${selectedUser}/credits`, {
        amount: parseInt(creditAmount),
        reason: creditReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setCreditAmount('');
      setCreditReason('');
      toast.success('Credits granted successfully');
    }
  });

  return (
    <>
      <Table>
        {/* User list with subscription info */}
      </Table>

      {selectedUser && (
        <CreditGrantPanel
          userId={selectedUser}
          amount={creditAmount}
          onAmountChange={setCreditAmount}
          reason={creditReason}
          onReasonChange={setCreditReason}
          onGrant={() => grantCredits.mutate()}
        />
      )}
    </>
  );
}
```

---

### **Phase 5: Testing & Validation** (4-6 hours)

#### 5.1 Integration Tests

**File:** `/backend/tests/integration/freemium-gating.test.ts`

```typescript
describe('Freemium Gating', () => {
  it('should allow Freemium user to create 2 assessments', async () => {
    // Create first assessment
    const assessment1 = await createAssessment('user-1', 'template-1');
    expect(assessment1.success).toBe(true);

    // Create second assessment
    const assessment2 = await createAssessment('user-1', 'template-1');
    expect(assessment2.success).toBe(true);

    // Try third assessment
    const assessment3 = await createAssessment('user-1', 'template-1');
    expect(assessment3.success).toBe(false);
    expect(assessment3.error.code).toBe('FREEMIUM_QUOTA_EXCEEDED');
  });

  it('should return mocked gaps for Freemium users', async () => {
    const results = await getAssessmentResults('freemium-assessment-id');

    expect(results.gaps).toHaveLength(3);
    expect(results.gaps[0].description).toContain('UNLOCK PREMIUM');
    expect(results.isRestricted).toBe(true);
  });

  it('should return real gaps for Premium users', async () => {
    const results = await getAssessmentResults('premium-assessment-id');

    expect(results.gaps.length).toBeGreaterThan(0);
    expect(results.gaps[0].remediation).toBeTruthy();
    expect(results.isRestricted).toBe(false);
  });

  it('should admin can grant credits to Enterprise user', async () => {
    const transaction = await grantCreditsToUser(
      'admin-user',
      'enterprise-user',
      50,
      'Monthly allocation'
    );

    expect(transaction.success).toBe(true);
    expect(transaction.amount).toBe(50);
    expect(transaction.type).toBe('ADMIN_GRANT');
  });

  it('should Premium user can purchase additional assessment', async () => {
    const result = await purchaseAdditionalAssessment('premium-user-id', 'price_xyz');

    expect(result.success).toBe(true);
    expect(result.creditsAdded).toBe(50); // Enough for 1 assessment
  });
});
```

#### 5.2 Manual QA Checklist

- [ ] **Freemium User Experience**
  - [ ] Can create 1st assessment (shows "1 of 2 used")
  - [ ] Can create 2nd assessment (shows "2 of 2 used")
  - [ ] Can't create 3rd assessment (shows upgrade prompt)
  - [ ] Sees blurred gaps/strategy
  - [ ] Can browse but not match vendors
  - [ ] Sees "Upgrade to Premium" buttons throughout

- [ ] **Premium User Experience**
  - [ ] Sees full gaps/strategy (real OpenAI)
  - [ ] Sees vendor matching
  - [ ] Can download reports
  - [ ] Can purchase additional assessment for €299
  - [ ] Monthly/Annual billing toggle works
  - [ ] Annual gives 10% discount

- [ ] **Enterprise User Experience**
  - [ ] Can create unlimited assessments
  - [ ] Gets credits manually from admin
  - [ ] No concerns about quotas

- [ ] **Admin Panel**
  - [ ] Can grant credits to any user
  - [ ] Can view credit transaction history
  - [ ] Credit grants appear in user account

- [ ] **Upgrade Flow**
  - [ ] Freemium user upgrades → existing assessments unlocked
  - [ ] Can switch between monthly/annual pricing
  - [ ] Stripe integration working (mock or real)

---

## 📊 DATABASE CHANGES SUMMARY

### New/Updated Models:
```prisma
// NEW
model UserAssessmentQuota {
  userId: String @unique
  totalAssessmentsCreated: Int
  assessmentsThisMonth: Int
  assessmentsUsedThisMonth: Int
}

// UPDATED
model Subscription {
  + billingCycle: BillingCycle? (MONTHLY | ANNUAL)
  + billingEmail: String?
  + currentPeriodStart: DateTime
  + currentPeriodEnd: DateTime
  + renewalDate: DateTime?
  + stripePriceId: String?
}

// NEW ENUM
enum BillingCycle {
  MONTHLY
  ANNUAL
}

// UPDATED in CreditTransaction
TransactionType {
  + ADMIN_GRANT
}
```

---

## 💰 PRICING SUMMARY

| Feature | Freemium | Premium (Mo) | Premium (Yr) | Enterprise |
|---------|----------|--------------|--------------|-----------|
| **Price** | Free | €599 | €6,490 (10% off) | Custom |
| **Compliance Score** | ✅ | ✅ | ✅ | ✅ |
| **Gap Analysis** | ❌ Blurred | ✅ Real | ✅ Real | ✅ Real |
| **Strategy Matrix** | ❌ Blurred | ✅ Real | ✅ Real | ✅ Real |
| **Reports** | ❌ | ✅ | ✅ | ✅ |
| **Vendor Matching** | ❌ | ✅ | ✅ | ✅ |
| **Assessments** | 2 Total | 2 incl + €299/ea | 2 incl + €299/ea | Unlimited |
| **Billing Cycle** | N/A | Monthly | Annual | Custom |

---

## 🚀 IMPLEMENTATION SEQUENCE

1. **Phase 1**: Database + Services (8-10 hrs)
   - Add schema fields
   - Create FreemiumContentService
   - Create AdminCreditService
   - Update AssessmentService

2. **Phase 2**: Billing Services (6-8 hrs)
   - Update SubscriptionService
   - Create BillingService
   - Stripe integration stubs

3. **Phase 3**: API Routes (4-6 hrs)
   - Assessment quota endpoints
   - Admin credit endpoints
   - Subscription billing endpoints

4. **Phase 4**: Frontend (8-10 hrs)
   - Assessment creation with quota check
   - Assessment results with blurred content
   - Pricing page with tier comparison
   - Admin credit management UI

5. **Phase 5**: Testing (4-6 hrs)
   - Integration tests
   - Manual QA
   - Smoke tests

**Total Estimated Time**: 30-40 hours development

---

**Status:** ✅ Ready for Implementation
**Next Step:** Confirm this plan, then begin Phase 1

