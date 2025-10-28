# Premium Gating Fixes - Complete Summary

## Issues Reported

1. **Marketplace showing "upgrade to premium" message for premium users** after completing priorities questionnaire
2. **Questionnaire submission failing** with error about incomplete business profile - not handled gracefully

## Root Causes Identified

### Issue 1: Marketplace Premium Detection
The marketplace was using a **different subscription API** than the rest of the app:
- Used: `/v1/subscriptions/${userId}/billing-info` (custom endpoint)
- Should use: `/subscriptions/current` (standard API)
- This caused inconsistent subscription status detection

### Issue 2: Incomplete Priorities Logic
The AssessmentResults page only checked if priorities **existed**, not if they were **complete**:
- John Doe had a priorities record but with empty required fields:
  - `selectedUseCases`: []
  - `rankedPriorities`: []
  - `mustHaveFeatures`: []
  - `criticalIntegrations`: []
- The page showed "Find Matching Vendors" CTA instead of "Complete Your Priorities"
- Vendor matching failed because priorities were incomplete

### Issue 3: Business Profile Validation
The backend priorities submission relied on organization data without validation:
- John Doe has **no organization** record (`organizationId: undefined`)
- Backend tried to pull `companySize`, `annualRevenue`, `complianceTeamSize` from organization
- When these fields were missing, submission failed with a cryptic error
- Frontend didn't handle this error gracefully

## Fixes Implemented

### Fix 1: Standardize Marketplace Subscription Check
**File**: `frontend/src/components/VendorMarketplace.tsx`

**Changes**:
```typescript
// BEFORE - Custom billing info API
const { data: billingInfo } = useQuery({
  queryKey: ['subscription', 'billing-info'],
  queryFn: async () => {
    const userId = getCurrentUserId();
    const response = await fetch(`/v1/subscriptions/${userId}/billing-info`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.json();
  }
});
const currentPlan = billingInfo?.data?.plan || 'FREE';

// AFTER - Standard subscription API
import { subscriptionApi } from '@/lib/api';

const { data: subscription } = useQuery({
  queryKey: ['subscription'],
  queryFn: subscriptionApi.getCurrentSubscription,
  enabled: !!localStorage.getItem('token'),
  retry: false,
});
const currentPlan = subscription?.plan || 'FREE';
```

**Result**: Marketplace now uses the same subscription API as AssessmentResults page, ensuring consistent premium status detection.

### Fix 2: Add Priorities Completeness Validation
**File**: `frontend/src/pages/AssessmentResults.tsx`

**Changes**:
```typescript
// Added completeness check function
const arePrioritiesComplete = (priorities: any): boolean => {
  if (!priorities) return false;

  // Check required array fields have at least one item
  const requiredArrays = ['selectedUseCases', 'rankedPriorities'];
  const arrayFieldsComplete = requiredArrays.every(field =>
    Array.isArray(priorities[field]) && priorities[field].length > 0
  );

  // Check required string fields are not empty
  const requiredStrings = [
    'primaryGoal', 'implementationUrgency', 'budgetRange',
    'deploymentPreference', 'vendorMaturity',
    'geographicRequirements', 'supportModel'
  ];
  const stringFieldsComplete = requiredStrings.every(field =>
    priorities[field] && priorities[field].trim().length > 0
  );

  return arrayFieldsComplete && stringFieldsComplete;
};

const isPrioritiesComplete = arePrioritiesComplete(priorities);

// Updated CTA logic to use completeness check
{currentPlan !== 'FREE' && (
  <Card>
    {!isPrioritiesComplete ? (
      // Show "Complete/Finish Your Priorities" CTA
      <Button onClick={() => navigate(`/assessments/${assessmentId}/priorities`)}>
        {!priorities ? 'Complete Questionnaire' : 'Finish Questionnaire'}
      </Button>
    ) : (
      // Show "Find Matching Vendors" CTA (only when complete)
      <Button onClick={() => navigate(`/marketplace?assessmentId=${assessmentId}`)}>
        Find Matching Vendors
      </Button>
    )}
  </Card>
)}
```

**Result**:
- Only shows "Find Matching Vendors" CTA when priorities are **fully complete**
- Shows "Complete Questionnaire" if not started
- Shows "Finish Questionnaire" if started but incomplete
- Only displays for premium users (hides for free users)

### Fix 3: Backend Organization Validation
**File**: `backend/src/services/priorities.service.ts`

**Changes**:
```typescript
// After merging priorities data with organization data
const finalData = {
  ...validated,
  companySize: validated.companySize || assessment.organization?.size,
  annualRevenue: validated.annualRevenue || assessment.organization?.annualRevenue,
  complianceTeamSize: validated.complianceTeamSize || assessment.organization?.complianceTeamSize,
};

// NEW: Validate required fields are present
const missingRequiredFields = [];
if (!finalData.companySize) missingRequiredFields.push('companySize');
if (!finalData.annualRevenue) missingRequiredFields.push('annualRevenue');
if (!finalData.complianceTeamSize) missingRequiredFields.push('complianceTeamSize');

if (missingRequiredFields.length > 0) {
  throw this.createError(
    `Required organization information is missing: ${missingRequiredFields.join(', ')}. Please complete your business profile first.`,
    400,
    'INCOMPLETE_BUSINESS_PROFILE',
    {
      missingFields: missingRequiredFields,
      message: 'Please complete your business profile with company size, annual revenue, and compliance team size before submitting priorities.'
    }
  );
}
```

**Result**: Backend now throws a clear, structured error when organization data is missing.

### Fix 4: Graceful Frontend Error Handling
**File**: `frontend/src/components/assessment/PrioritiesQuestionnaire.tsx`

**Changes**:
```typescript
import { ToastAction } from '@/components/ui/toast';

// In mutation onError handler
onError: (error: any) => {
  const errorCode = error.response?.data?.code || error.code;
  const errorData = error.response?.data;

  // Handle incomplete business profile error specifically
  if (errorCode === 'INCOMPLETE_BUSINESS_PROFILE') {
    const missingFields = errorData?.details?.missingFields || [];
    const friendlyFieldNames = {
      companySize: 'Company Size',
      annualRevenue: 'Annual Revenue',
      complianceTeamSize: 'Compliance Team Size',
    };
    const missingFieldsText = missingFields
      .map((f: string) => friendlyFieldNames[f] || f)
      .join(', ');

    toast({
      title: 'Business Profile Incomplete',
      description: `Please complete your business profile first. Missing: ${missingFieldsText}`,
      variant: 'destructive',
      action: (
        <ToastAction
          altText="Complete Profile"
          onClick={() => navigate('/settings/organization')}
        >
          Complete Profile
        </ToastAction>
      ),
    });
    return;
  }

  // Handle other errors...
}
```

**Result**:
- Shows user-friendly error message with specific missing fields
- Provides actionable "Complete Profile" button in toast
- Button navigates to `/settings/organization` to complete profile

## Files Modified

### Frontend (3 files)
1. `frontend/src/pages/AssessmentResults.tsx`
   - Added `arePrioritiesComplete()` function
   - Updated CTA logic to check completeness
   - Added premium user gating

2. `frontend/src/components/VendorMarketplace.tsx`
   - Replaced custom billing API with standard `subscriptionApi.getCurrentSubscription()`
   - Updated import to include `subscriptionApi`

3. `frontend/src/components/assessment/PrioritiesQuestionnaire.tsx`
   - Added `ToastAction` import
   - Enhanced error handling for `INCOMPLETE_BUSINESS_PROFILE` error
   - Added actionable "Complete Profile" button

### Backend (1 file)
4. `backend/src/services/priorities.service.ts`
   - Added validation for required organization fields
   - Throws structured error with `INCOMPLETE_BUSINESS_PROFILE` code
   - Includes detailed missing fields in error response

## Testing & Verification

### John Doe's Account Status
- User ID: `cmh0oe6890000o03xb8rza882`
- Plan: **PREMIUM** (Active)
- Organization ID: **undefined** (no organization)
- Latest Assessment: `cmhanasgy00c3qmmuwf8shscq`
- Priorities: **INCOMPLETE** (6 missing fields)

### Expected Behavior After Fixes

#### For John Doe (Premium, Incomplete Priorities, No Organization)
1. ✅ Assessment Results page shows "Finish Your Priorities Questionnaire" CTA
2. ✅ Clicking CTA navigates to priorities questionnaire
3. ✅ Attempting to submit shows: "Business Profile Incomplete. Missing: Company Size, Annual Revenue, Compliance Team Size"
4. ✅ Toast has "Complete Profile" button that navigates to `/settings/organization`
5. ✅ After completing organization profile, can submit priorities
6. ✅ After completing all questionnaire fields, can access vendor matching
7. ✅ Marketplace no longer shows "upgrade to premium" message

#### For Premium Users with Complete Priorities
1. ✅ Assessment Results shows "Find Matching Vendors" CTA
2. ✅ Vendor matching works in marketplace
3. ✅ No "upgrade to premium" message

#### For Free Users
1. ✅ No priorities CTA shown (premium feature)
2. ✅ Marketplace shows upgrade prompt

## Build Verification
- ✅ Frontend build succeeds
- ✅ No new TypeScript errors introduced
- ✅ Logic tested with John Doe's actual data

## Summary

All premium gating issues have been resolved:

1. **Marketplace premium detection** - Fixed by standardizing subscription API usage
2. **Priorities completeness** - Fixed by adding validation for required fields
3. **Business profile requirement** - Fixed with backend validation and graceful frontend error handling

The user experience is now:
- **Clear**: Users know exactly what's required (complete priorities, complete profile)
- **Actionable**: Errors include buttons to navigate to the right place
- **Consistent**: Premium status is detected consistently across the app
- **Graceful**: No cryptic errors, helpful messages guide users to success
