# Pay-Gating Implementation Plan for Template v3.0

**Document Version:** 1.0
**Created:** 2025-10-20
**Status:** PLANNING
**Priority:** HIGH

---

## 📋 Executive Summary

This document outlines the implementation plan for integrating pay-gating (Stripe-based subscription and credit system) with the newly deployed Financial Crime Template v3.0. The plan ensures v3.0 assessments are properly monetized while maintaining backward compatibility with v2.0.

---

## 🎯 Objectives

1. **Implement per-template pricing** - Different templates have different credit costs
2. **Enforce credit checks** before v3.0 assessment completion
3. **Support freemium restrictions** - Limit free users appropriately
4. **Maintain backward compatibility** - v2.0 assessments continue working
5. **Enable dynamic pricing** - Admin can adjust costs via UI
6. **Track revenue per template** - Analytics and reporting

---

## 📊 Current State Analysis

### Existing Infrastructure ✅

#### 1. **Subscription System** (`subscription.service.ts`)
- ✅ Stripe integration complete
- ✅ Three plans: FREE, PREMIUM, ENTERPRISE
- ✅ Credit system operational
- ✅ Credit deduction/addition working

**Current Plan Configuration:**
```typescript
[SubscriptionPlan.FREE]: {
  price: 0,
  creditsPerMonth: 1,
  assessmentsPerMonth: 1,
  documentsPerMonth: 5,
  credits: 1
}

[SubscriptionPlan.PREMIUM]: {
  price: 599 EUR,
  creditsPerMonth: 50,
  assessmentsPerMonth: 10,
  documentsPerMonth: 50,
  credits: 50
}

[SubscriptionPlan.ENTERPRISE]: {
  price: 1999 EUR,
  creditsPerMonth: 200,
  assessmentsPerMonth: -1, // Unlimited
  documentsPerMonth: -1,
  credits: 200
}
```

#### 2. **Freemium Service** (`freemium.service.ts`)
- ✅ Subscription tier restrictions implemented
- ✅ Credit limit checking working
- ✅ Content filtering for free users
- ❌ **ISSUE:** Uses fixed `creditsPerAssessment` regardless of template

**Current Credit Costs (Hard-coded):**
- FREE: 5 credits per assessment
- PAID: 5 credits per assessment
- PREMIUM: 3 credits per assessment

#### 3. **Assessment Service** (`assessment.service.ts`)
- ✅ Credit deduction on assessment completion
- ✅ Credit check before completion
- ❌ **ISSUE:** Uses `limitations.creditsPerAssessment` (not per-template)

**Current Flow:**
```typescript
// Line 582 - Fixed cost per subscription tier
const creditsRequired = limitations.creditsPerAssessment;

// Should be:
const creditsRequired = await this.getTemplateCost(assessment.templateId);
```

#### 4. **Database Schema** (`schema.prisma`)
- ❌ **MISSING:** No `creditCost` field on Template model
- ✅ Template model has: slug, version, tags, estimatedMinutes
- ✅ Assessment model tracks creditsUsed

#### 5. **Frontend Admin UI**
- ✅ Template Costs page exists (`TemplateCosts.tsx`)
- ❌ Currently using mock data (not connected to backend)
- ✅ Supports bulk pricing adjustments
- ✅ Shows usage statistics and revenue

---

## 🚨 Gaps Identified

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 1 | No `creditCost` field in Template schema | ⚠️ CRITICAL | P0 |
| 2 | Assessment service uses fixed cost per tier | ⚠️ HIGH | P0 |
| 3 | No per-template cost configuration API | ⚠️ HIGH | P0 |
| 4 | TemplateCosts admin UI not connected | 🟡 MEDIUM | P1 |
| 5 | No template cost seeding for v3.0 | 🟡 MEDIUM | P1 |
| 6 | No frontend pricing display for users | 🟡 MEDIUM | P1 |
| 7 | No v2.0 → v3.0 migration cost transparency | 🟢 LOW | P2 |
| 8 | No bulk credit purchase flow for v3.0 | 🟢 LOW | P2 |

---

## 💰 Proposed v3.0 Pricing Strategy

### **Recommended Credit Cost: 75 credits**

**Rationale:**
- v2.0 cost: 50 credits (24 questions)
- v3.0 has 90 questions (3.75× more)
- v3.0 has weighted scoring (more complex AI analysis)
- v3.0 takes 90 minutes vs ~30 minutes for v2.0
- **Pricing:** 50% increase (less than question count increase to encourage adoption)

### **Pricing Tiers Impact:**

| Plan | Monthly Credits | v2.0 Assessments | v3.0 Assessments | Effective Cost |
|------|----------------|-----------------|-----------------|----------------|
| **FREE** | 1 | 0 assessments | 0 assessments | Need to upgrade |
| **PREMIUM** | 50 | 1 assessment | 0.67 assessments | €599/month = €898 per v3.0 |
| **ENTERPRISE** | 200 | 4 assessments | 2.67 assessments | €1999/month = €750 per v3.0 |

### **Alternative Pricing Options:**

#### Option A: **Conservative (50 credits)** - Same as v2.0
- ✅ Easier adoption
- ✅ Premium users can complete 1 full v3.0 assessment
- ❌ Undervalues 3.75× more content
- ❌ Lower revenue per assessment

#### Option B: **Moderate (75 credits)** - RECOMMENDED
- ✅ Balanced pricing that reflects added value
- ✅ Encourages enterprise plan for serious users
- ✅ 50% premium over v2.0 (fair for 3.75× content)
- ⚠️ Premium users need 1.5 months credits for one v3.0

#### Option C: **Premium (100 credits)** - High value
- ✅ Reflects true enterprise-grade nature
- ✅ Higher revenue per assessment
- ❌ May deter adoption
- ❌ Premium users need 2 months of credits

#### Option D: **Dynamic Tiered Pricing**
```typescript
v3.0 Credit Cost by Subscription:
- FREE: Not available (upgrade required)
- PREMIUM: 85 credits (slight premium)
- ENTERPRISE: 65 credits (volume discount)
```

### **Recommendation:** Start with **Option B (75 credits)** with ability to adjust based on:
- User feedback
- Completion rates
- Revenue targets
- Competitive analysis

---

## 🏗️ Implementation Plan

### **Phase 1: Database Schema & Core Logic** (Priority: P0)
**Estimated Time:** 4-6 hours

#### 1.1 Add `creditCost` Field to Template Model

**Schema Change:**
```prisma
model Template {
  // ... existing fields

  // Pricing
  creditCost        Int?     @default(50)  // Credits required to complete assessment
  baseCost          Int?     @default(40)  // Base assessment cost
  aiCost            Int?     @default(10)  // AI analysis cost
  allowFreemium     Boolean  @default(true) // Allow free tier access
  minimumPlan       SubscriptionPlan? // Minimum plan required (null = any)

  // ... rest of fields
}
```

**Migration Steps:**
```bash
# 1. Create migration
npx prisma migrate dev --name add_template_pricing

# 2. Seed existing templates with costs
# - v2.0 Financial Crime: 50 credits
# - v3.0 Financial Crime: 75 credits (new)
# - Trade Compliance: 60 credits
```

#### 1.2 Create Template Pricing Service

**File:** `/backend/src/services/template-pricing.service.ts`

```typescript
import { BaseService, ServiceContext } from './base.service';
import { SubscriptionPlan } from '../types/database';

export interface TemplatePricingConfig {
  basePrice: number;
  aiPrice: number;
  totalPrice: number;
  tierPricing?: {
    [SubscriptionPlan.FREE]?: number;
    [SubscriptionPlan.PREMIUM]?: number;
    [SubscriptionPlan.ENTERPRISE]?: number;
  };
  allowFreemium: boolean;
  minimumPlan?: SubscriptionPlan;
}

export class TemplatePricingService extends BaseService {
  /**
   * Get credit cost for a template
   */
  async getTemplateCost(
    templateId: string,
    userPlan?: SubscriptionPlan
  ): Promise<number> {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      select: {
        creditCost: true,
        baseCost: true,
        aiCost: true,
        minimumPlan: true
      }
    });

    if (!template) {
      throw this.createError('Template not found', 404);
    }

    // Check minimum plan requirement
    if (template.minimumPlan && userPlan) {
      const planHierarchy = {
        [SubscriptionPlan.FREE]: 0,
        [SubscriptionPlan.PREMIUM]: 1,
        [SubscriptionPlan.ENTERPRISE]: 2
      };

      if (planHierarchy[userPlan] < planHierarchy[template.minimumPlan]) {
        throw this.createError(
          `This template requires ${template.minimumPlan} plan or higher`,
          403,
          'PLAN_UPGRADE_REQUIRED'
        );
      }
    }

    return template.creditCost || (template.baseCost + template.aiCost) || 50;
  }

  /**
   * Update template pricing (admin only)
   */
  async updateTemplatePricing(
    templateId: string,
    pricing: {
      creditCost?: number;
      baseCost?: number;
      aiCost?: number;
      allowFreemium?: boolean;
      minimumPlan?: SubscriptionPlan;
    },
    context: ServiceContext
  ): Promise<void> {
    this.requireAdmin(context);

    await this.prisma.template.update({
      where: { id: templateId },
      data: pricing
    });

    await this.logAudit({
      action: 'TEMPLATE_PRICING_UPDATED',
      entity: 'Template',
      entityId: templateId,
      metadata: pricing
    }, context);
  }

  /**
   * Get all template pricing configurations
   */
  async getAllTemplatePricing(): Promise<TemplatePricingConfig[]> {
    const templates = await this.prisma.template.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        creditCost: true,
        baseCost: true,
        aiCost: true,
        allowFreemium: true,
        minimumPlan: true,
        _count: {
          select: { assessments: true }
        }
      }
    });

    return templates.map(t => ({
      basePrice: t.baseCost || 40,
      aiPrice: t.aiCost || 10,
      totalPrice: t.creditCost || 50,
      allowFreemium: t.allowFreemium,
      minimumPlan: t.minimumPlan || undefined
    }));
  }
}
```

#### 1.3 Update Assessment Service to Use Template Pricing

**File:** `/backend/src/services/assessment.service.ts`

**Changes:**
```typescript
// Replace line 582
// OLD:
const creditsRequired = limitations.creditsPerAssessment;

// NEW:
const template = await this.prisma.template.findUnique({
  where: { id: assessment.templateId },
  select: { creditCost: true, minimumPlan: true }
});

const creditsRequired = template?.creditCost || 50;

// Check minimum plan requirement
if (template?.minimumPlan) {
  const userSubscription = await this.prisma.subscription.findUnique({
    where: { userId: assessment.userId },
    select: { plan: true }
  });

  const planHierarchy = {
    [SubscriptionPlan.FREE]: 0,
    [SubscriptionPlan.PREMIUM]: 1,
    [SubscriptionPlan.ENTERPRISE]: 2
  };

  const userPlanLevel = planHierarchy[userSubscription?.plan || SubscriptionPlan.FREE];
  const requiredPlanLevel = planHierarchy[template.minimumPlan];

  if (userPlanLevel < requiredPlanLevel) {
    throw this.createError(
      `This template requires ${template.minimumPlan} plan. Please upgrade your subscription.`,
      403,
      'PLAN_UPGRADE_REQUIRED'
    );
  }
}
```

---

### **Phase 2: API Endpoints** (Priority: P0)
**Estimated Time:** 3-4 hours

#### 2.1 Template Pricing Routes

**File:** `/backend/src/routes/template.routes.ts` (Add to existing file)

```typescript
// GET /v1/templates/:id/pricing - Get template pricing
fastify.get('/:id/pricing', {
  schema: {
    params: z.object({
      id: z.string().cuid()
    }),
    response: {
      200: z.object({
        success: z.boolean(),
        data: z.object({
          templateId: z.string(),
          templateName: z.string(),
          creditCost: z.number(),
          baseCost: z.number(),
          aiCost: z.number(),
          allowFreemium: z.boolean(),
          minimumPlan: z.nativeEnum(SubscriptionPlan).optional(),
          userCanAccess: z.boolean(),
          upgradeRequired: z.boolean(),
          upgradeMessage: z.string().optional()
        })
      })
    }
  }
}, async (request, reply) => {
  const templatePricingService = new TemplatePricingService(prisma, logger);
  const { id } = request.params;
  const userId = request.user?.id;

  const template = await prisma.template.findUnique({
    where: { id },
    include: { _count: { select: { assessments: true } } }
  });

  if (!template) {
    return reply.code(404).send({ success: false, error: 'Template not found' });
  }

  // Get user subscription if authenticated
  let userPlan = SubscriptionPlan.FREE;
  let userCanAccess = true;
  let upgradeRequired = false;
  let upgradeMessage = undefined;

  if (userId) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true }
    });
    userPlan = subscription?.plan || SubscriptionPlan.FREE;

    // Check access
    if (template.minimumPlan) {
      const planHierarchy = {
        [SubscriptionPlan.FREE]: 0,
        [SubscriptionPlan.PREMIUM]: 1,
        [SubscriptionPlan.ENTERPRISE]: 2
      };

      if (planHierarchy[userPlan] < planHierarchy[template.minimumPlan]) {
        userCanAccess = false;
        upgradeRequired = true;
        upgradeMessage = `This template requires ${template.minimumPlan} plan or higher`;
      }
    }
  }

  return reply.send({
    success: true,
    data: {
      templateId: template.id,
      templateName: template.name,
      creditCost: template.creditCost || 50,
      baseCost: template.baseCost || 40,
      aiCost: template.aiCost || 10,
      allowFreemium: template.allowFreemium,
      minimumPlan: template.minimumPlan,
      userCanAccess,
      upgradeRequired,
      upgradeMessage
    }
  });
});

// PATCH /v1/admin/templates/:id/pricing - Update template pricing (admin only)
fastify.patch('/:id/pricing', {
  preHandler: [authMiddleware, rbacMiddleware(['ADMIN'])],
  schema: {
    params: z.object({
      id: z.string().cuid()
    }),
    body: z.object({
      creditCost: z.number().min(0).optional(),
      baseCost: z.number().min(0).optional(),
      aiCost: z.number().min(0).optional(),
      allowFreemium: z.boolean().optional(),
      minimumPlan: z.nativeEnum(SubscriptionPlan).optional()
    })
  }
}, async (request, reply) => {
  const templatePricingService = new TemplatePricingService(prisma, logger);
  const { id } = request.params;

  await templatePricingService.updateTemplatePricing(
    id,
    request.body,
    { userId: request.user.id, userRole: request.user.role }
  );

  return reply.send({ success: true, message: 'Template pricing updated' });
});

// GET /v1/admin/templates/pricing - Get all template pricing (admin)
fastify.get('/pricing', {
  preHandler: [authMiddleware, rbacMiddleware(['ADMIN'])],
}, async (request, reply) => {
  const templates = await prisma.template.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      version: true,
      creditCost: true,
      baseCost: true,
      aiCost: true,
      allowFreemium: true,
      minimumPlan: true,
      isActive: true,
      _count: {
        select: { assessments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const templatesWithRevenue = templates.map(t => ({
    ...t,
    totalCost: t.creditCost || (t.baseCost + t.aiCost) || 50,
    usageCount: t._count.assessments,
    revenue: t._count.assessments * (t.creditCost || 50)
  }));

  return reply.send({ success: true, data: templatesWithRevenue });
});
```

---

### **Phase 3: Seed v3.0 Pricing** (Priority: P1)
**Estimated Time:** 1 hour

**File:** `/backend/prisma/seed-v3-pricing.ts`

```typescript
import { PrismaClient, SubscriptionPlan } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function seedV3Pricing() {
  console.log('💰 Seeding template pricing...');

  // Update v2.0 Financial Crime template
  const v2Template = await prisma.template.update({
    where: { slug: 'financial-crime-compliance' },
    data: {
      creditCost: 50,
      baseCost: 40,
      aiCost: 10,
      allowFreemium: false, // Require paid plan
      minimumPlan: SubscriptionPlan.PREMIUM
    }
  });
  console.log('✅ Updated v2.0 Financial Crime pricing: 50 credits');

  // Update v3.0 Financial Crime template
  const v3Template = await prisma.template.update({
    where: { slug: 'financial-crime-compliance-v3' },
    data: {
      creditCost: 75,
      baseCost: 60,
      aiCost: 15,
      allowFreemium: false, // Enterprise template
      minimumPlan: SubscriptionPlan.PREMIUM
    }
  });
  console.log('✅ Updated v3.0 Financial Crime pricing: 75 credits');

  // Update Trade Compliance template
  const tradeTemplate = await prisma.template.update({
    where: { slug: 'trade-compliance-assessment' },
    data: {
      creditCost: 60,
      baseCost: 48,
      aiCost: 12,
      allowFreemium: false,
      minimumPlan: SubscriptionPlan.PREMIUM
    }
  });
  console.log('✅ Updated Trade Compliance pricing: 60 credits');

  console.log('\n✅ Template pricing seeded successfully!');
}

seedV3Pricing()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run:**
```bash
npx tsx backend/prisma/seed-v3-pricing.ts
```

---

### **Phase 4: Frontend Integration** (Priority: P1)
**Estimated Time:** 6-8 hours

#### 4.1 Connect TemplateCosts Admin Page to Backend

**File:** `/frontend/src/pages/admin/TemplateCosts.tsx`

**Changes:**
```typescript
// Replace mock data with API call
const { data: templateCosts, isLoading, refetch } = useQuery({
  queryKey: ['admin', 'templates', 'pricing'],
  queryFn: async () => {
    const response = await api.get('/v1/admin/templates/pricing');
    return response.data.data;
  }
});

// Update save handler
const handleSaveTemplate = async () => {
  if (editingTemplate) {
    await api.patch(`/v1/admin/templates/${editingTemplate.id}/pricing`, {
      creditCost: editingTemplate.totalCost,
      baseCost: editingTemplate.baseCost,
      aiCost: editingTemplate.aiCost
    });

    refetch();
    setEditingTemplate(null);
  }
};
```

#### 4.2 Create User-Facing Pricing Display Component

**File:** `/frontend/src/components/TemplatePricingCard.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Lock, Zap, Check } from 'lucide-react';

interface TemplatePricingCardProps {
  templateName: string;
  creditCost: number;
  estimatedMinutes: number;
  userCanAccess: boolean;
  upgradeRequired: boolean;
  upgradeMessage?: string;
  minimumPlan?: string;
}

export const TemplatePricingCard = ({
  templateName,
  creditCost,
  estimatedMinutes,
  userCanAccess,
  upgradeRequired,
  upgradeMessage,
  minimumPlan
}: TemplatePricingCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{templateName}</h4>
          <p className="text-sm text-muted-foreground">
            {estimatedMinutes} minutes • {creditCost} credits
          </p>
        </div>

        {upgradeRequired ? (
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-orange-500" />
            <Badge variant="outline" className="border-orange-500">
              {minimumPlan} Required
            </Badge>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="border-green-500">
              Available
            </Badge>
          </div>
        )}
      </div>

      {upgradeRequired && upgradeMessage && (
        <p className="mt-2 text-sm text-orange-600">
          {upgradeMessage}
        </p>
      )}
    </Card>
  );
};
```

#### 4.3 Update Assessment Template Selection Page

**File:** `/frontend/src/pages/AssessmentTemplates.tsx`

**Add pricing display:**
```typescript
// Fetch template pricing
const { data: templatePricing } = useQuery({
  queryKey: ['template', 'pricing', template.id],
  queryFn: async () => {
    const response = await api.get(`/v1/templates/${template.id}/pricing`);
    return response.data.data;
  }
});

// Display pricing
<TemplatePricingCard
  templateName={template.name}
  creditCost={templatePricing?.creditCost || 50}
  estimatedMinutes={template.estimatedMinutes || 60}
  userCanAccess={templatePricing?.userCanAccess || false}
  upgradeRequired={templatePricing?.upgradeRequired || false}
  upgradeMessage={templatePricing?.upgradeMessage}
  minimumPlan={templatePricing?.minimumPlan}
/>
```

#### 4.4 Add Upgrade Prompt Component

**File:** `/frontend/src/components/UpgradePrompt.tsx`

```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  templateName: string;
  requiredPlan: string;
  creditCost: number;
  onUpgrade: () => void;
}

export const UpgradePrompt = ({
  templateName,
  requiredPlan,
  creditCost,
  onUpgrade
}: UpgradePromptProps) => {
  return (
    <Alert className="border-primary">
      <Sparkles className="h-4 w-4" />
      <AlertTitle>Upgrade Required</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          The <strong>{templateName}</strong> requires a <strong>{requiredPlan}</strong> plan
          and costs <strong>{creditCost} credits</strong> to complete.
        </p>
        <div className="flex gap-2">
          <Button onClick={onUpgrade} className="w-full">
            Upgrade to {requiredPlan}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
```

---

### **Phase 5: Testing & Validation** (Priority: P1)
**Estimated Time:** 4 hours

#### 5.1 Create Integration Tests

**File:** `/backend/tests/integration/template-pricing.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, SubscriptionPlan } from '../../src/generated/prisma';
import { TemplatePricingService } from '../../src/services/template-pricing.service';

describe('Template Pricing Integration', () => {
  let prisma: PrismaClient;
  let pricingService: TemplatePricingService;

  beforeAll(async () => {
    prisma = new PrismaClient();
    pricingService = new TemplatePricingService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Template Cost Retrieval', () => {
    it('should get v3.0 template cost', async () => {
      const cost = await pricingService.getTemplateCost(
        'v3-template-id',
        SubscriptionPlan.PREMIUM
      );

      expect(cost).toBe(75);
    });

    it('should reject free user for v3.0 template', async () => {
      await expect(
        pricingService.getTemplateCost(
          'v3-template-id',
          SubscriptionPlan.FREE
        )
      ).rejects.toThrow('requires PREMIUM plan');
    });

    it('should allow enterprise user for v3.0 template', async () => {
      const cost = await pricingService.getTemplateCost(
        'v3-template-id',
        SubscriptionPlan.ENTERPRISE
      );

      expect(cost).toBe(75);
    });
  });

  describe('Credit Deduction', () => {
    it('should deduct correct credits for v3.0 assessment', async () => {
      // Test that completing v3.0 assessment deducts 75 credits
      // ... test implementation
    });
  });

  describe('Admin Pricing Updates', () => {
    it('should allow admin to update template pricing', async () => {
      await pricingService.updateTemplatePricing(
        'test-template-id',
        { creditCost: 100 },
        { userId: 'admin-id', userRole: 'ADMIN' }
      );

      const cost = await pricingService.getTemplateCost('test-template-id');
      expect(cost).toBe(100);
    });

    it('should reject non-admin pricing updates', async () => {
      await expect(
        pricingService.updateTemplatePricing(
          'test-template-id',
          { creditCost: 100 },
          { userId: 'user-id', userRole: 'USER' }
        )
      ).rejects.toThrow();
    });
  });
});
```

#### 5.2 Manual Testing Checklist

- [ ] **Free user attempts v3.0 assessment**
  - Should see upgrade prompt
  - Should not be able to complete assessment
  - Error message should be clear

- [ ] **Premium user with sufficient credits completes v3.0**
  - 75 credits deducted
  - Assessment completes successfully
  - Credit transaction logged

- [ ] **Premium user with insufficient credits attempts v3.0**
  - Clear error message
  - Prompted to purchase credits or wait for monthly refresh
  - Can upgrade to Enterprise

- [ ] **Enterprise user completes v3.0**
  - 75 credits deducted
  - No issues with credit availability

- [ ] **Admin updates template pricing**
  - Changes reflected immediately
  - New assessments use new pricing
  - Existing completed assessments show original cost

- [ ] **Template pricing API responses**
  - Correct costs returned
  - User access checks work
  - Upgrade messages displayed correctly

---

## 📈 Success Metrics

### **Implementation Success**
- [ ] Schema migration completed successfully
- [ ] All integration tests passing
- [ ] Admin can configure pricing via UI
- [ ] Users see accurate pricing before starting assessment
- [ ] Credit deductions match template costs
- [ ] Revenue tracking functional

### **Business Metrics** (Track post-launch)
- v3.0 assessment completion rate
- v3.0 revenue vs v2.0 revenue
- Upgrade rate (Free → Premium for v3.0 access)
- Average credits per user (Premium vs Enterprise)
- Template cost adjustments needed based on feedback

---

## 🚀 Deployment Plan

### **Pre-Deployment**
1. ✅ Complete Phase 1 (Schema & Core Logic)
2. ✅ Complete Phase 2 (API Endpoints)
3. ✅ Complete Phase 3 (Seed Pricing)
4. ✅ Run all integration tests
5. ✅ Manual QA testing

### **Deployment**
1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Template Pricing**
   ```bash
   npx tsx backend/prisma/seed-v3-pricing.ts
   ```

3. **Deploy Backend**
   - Build and deploy backend with new pricing logic
   - Verify API endpoints working

4. **Deploy Frontend**
   - Build and deploy frontend with pricing UI
   - Verify template selection shows pricing

5. **Smoke Tests**
   - Complete one v3.0 assessment as Premium user
   - Verify credit deduction
   - Check admin pricing page

### **Post-Deployment**
1. **Monitor Errors**
   - Credit deduction failures
   - Plan upgrade errors
   - Pricing display issues

2. **Track Metrics**
   - v3.0 usage vs v2.0
   - Upgrade conversions
   - Revenue per template

3. **User Communication**
   - Email announcement of v3.0 availability
   - Pricing transparency (75 credits)
   - Upgrade path for free users

---

## 🛡️ Risk Mitigation

### **Risk 1: Users surprised by higher cost**
**Mitigation:**
- Show pricing clearly before starting assessment
- Display "Estimated: 90 minutes, 75 credits" prominently
- Offer comparison with v2.0 ("3× more comprehensive")

### **Risk 2: Credit deduction fails mid-assessment**
**Mitigation:**
- Check credits BEFORE assessment starts
- Lock credits at start (prevent concurrent deductions)
- Rollback on failure

### **Risk 3: Admin sets incorrect pricing**
**Mitigation:**
- Confirmation dialog for bulk changes
- Audit log of all pricing changes
- Ability to revert to previous pricing

### **Risk 4: Free users frustrated by v3.0 lock**
**Mitigation:**
- Clear upgrade path with benefits
- Keep v2.0 available for free users
- Offer trial Enterprise for v3.0 testing

---

## 📝 Documentation Updates

### **User Documentation**
- [ ] Update pricing page with v3.0 costs
- [ ] Create "Template Comparison" guide (v2.0 vs v3.0)
- [ ] Document credit purchase options
- [ ] FAQ: "Why does v3.0 cost more?"

### **Admin Documentation**
- [ ] How to update template pricing
- [ ] How to bulk adjust all template costs
- [ ] Revenue reporting and analytics
- [ ] Template cost optimization strategies

### **Developer Documentation**
- [ ] Template pricing service API reference
- [ ] Integration guide for new templates
- [ ] Testing guide for pricing changes

---

## 🎯 Future Enhancements (Post-MVP)

### **Dynamic Pricing**
- Discount for bulk assessments
- Seasonal pricing adjustments
- Early adopter pricing for new templates
- Volume discounts for Enterprise

### **Credit Packages**
- Buy 100 credits for $X
- Buy 500 credits with 10% discount
- Buy 1000 credits with 20% discount

### **Template Bundles**
- "Compliance Starter Pack" (v2.0 + Trade) = 100 credits (save 10)
- "Enterprise Suite" (v3.0 + Trade + Custom) = 200 credits (save 20)

### **Usage-Based Billing**
- Pay-per-assessment (no subscription)
- Auto-purchase credits when depleted
- Credit rollover for unused credits

---

## 📞 Support & Questions

**For Implementation Questions:**
- Technical Lead: Development Team
- Product Questions: Product Manager

**For Pricing Strategy:**
- Business Model: Finance Team
- Competitive Analysis: Marketing Team

---

## ✅ Checklist

### **Phase 1: Database & Core**
- [ ] Add creditCost fields to Template schema
- [ ] Create Prisma migration
- [ ] Implement TemplatePricingService
- [ ] Update Assessment service to use template costs
- [ ] Run migration on dev database
- [ ] Test credit deduction with new logic

### **Phase 2: API**
- [ ] Create GET /templates/:id/pricing endpoint
- [ ] Create PATCH /admin/templates/:id/pricing endpoint
- [ ] Create GET /admin/templates/pricing endpoint
- [ ] Add request/response schemas
- [ ] Test all endpoints with Postman/Insomnia

### **Phase 3: Seeding**
- [ ] Create seed-v3-pricing.ts script
- [ ] Set v2.0 cost to 50 credits
- [ ] Set v3.0 cost to 75 credits
- [ ] Set Trade Compliance to 60 credits
- [ ] Run seeding script
- [ ] Verify costs in database

### **Phase 4: Frontend**
- [ ] Connect TemplateCosts admin page to API
- [ ] Create TemplatePricingCard component
- [ ] Create UpgradePrompt component
- [ ] Update AssessmentTemplates page with pricing
- [ ] Add upgrade flow for restricted templates
- [ ] Test all UI components

### **Phase 5: Testing**
- [ ] Write integration tests
- [ ] Run all tests and ensure passing
- [ ] Perform manual QA testing
- [ ] Test free user restrictions
- [ ] Test Premium user access
- [ ] Test Enterprise user access
- [ ] Test admin pricing updates

### **Phase 6: Deployment**
- [ ] Deploy database migration
- [ ] Run pricing seed script on production
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Run smoke tests
- [ ] Monitor for errors
- [ ] Update user documentation

---

**Document Status:** ✅ Ready for Implementation
**Next Steps:** Begin Phase 1 - Database Schema & Core Logic
**Estimated Total Time:** 18-24 hours development + 4 hours testing = ~3 days

---

**Last Updated:** 2025-10-20
**Version:** 1.0
**Owner:** Development Team
