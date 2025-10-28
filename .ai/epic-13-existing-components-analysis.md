# Epic 13: Existing RFP Components Analysis

**Date**: 2025-10-27
**Analyzed By**: Claude Code

---

## Existing Components Found

### 1. **RfpTracking.tsx** ❌ (Needs Refactoring)
**Location**: `frontend/src/components/RfpTracking.tsx` (401 lines)
**Used In**: `frontend/src/pages/Marketplace.tsx` (Tabs: "rfps")

**Current Implementation:**
- ❌ Uses localStorage (line 55: `localStorage.getItem('sentRfps')`)
- ❌ Mock data with fake statuses (lines 58-68)
- ❌ No backend API integration
- ❌ Interface doesn't match backend schema

**Interface (Current):**
```typescript
interface SentRfp {
  id: string;
  vendor: { name: string; logo: string; };
  projectName: string;
  budget: string;
  timeline: string;
  requirements: string;
  additionalInfo: string;
  attachedFiles: string[];
  submittedAt: string;
  status: 'Sent' | 'Under Review' | 'Proposal Received' | 'Rejected' | 'Accepted';
}
```

**What It Does:**
- ✅ Displays list of RFPs with filtering
- ✅ Search by project name or vendor
- ✅ Filter by status
- ✅ Export to CSV
- ✅ View RFP details in modal
- ✅ Status badges with colors
- ✅ Empty state handling

**Usable Components:**
- ✅ UI layout (filters, search, cards)
- ✅ Status badge rendering (`getStatusBadge()`)
- ✅ Status icons (`getStatusIcon()`)
- ✅ CSV export logic (`exportToCSV()`)
- ✅ Detail modal structure

**Must Change:**
- ❌ Replace localStorage with API calls (`rfpApi.getRFPs()`)
- ❌ Update interface to match backend RFP model
- ❌ Map backend RFPStatus to UI statuses
- ❌ Add TanStack Query for data fetching
- ❌ Add loading/error states

---

### 2. **VendorMarketplace.tsx** ✅ (Can Integrate)
**Location**: `frontend/src/components/VendorMarketplace.tsx` (33,427 bytes)
**Used In**: `frontend/src/pages/Marketplace.tsx` (Tabs: "browse")

**Potential Integration Points:**
- Vendor selection for RFP form
- "Contact Vendor" button (Story 13.6)
- "Create RFP" button for Premium users (Story 13.1)

**Action Needed:**
- Add "Create RFP" button to vendor cards (Premium users)
- Pre-select vendors when opening RFP form from marketplace

---

### 3. **VendorProfile.tsx** ✅ (Can Integrate)
**Location**: `frontend/src/components/VendorProfile.tsx` (23,729 bytes)

**Potential Integration Points:**
- "Contact Vendor" button (Story 13.6)
- "Create RFP" button (Story 13.1)

**Action Needed:**
- Add both "Contact" and "Create RFP" buttons to profile page
- Show only "Contact" for Free users, both for Premium users

---

### 4. **VendorComparison.tsx** ✅ (Can Integrate)
**Location**: `frontend/src/components/VendorComparison.tsx` (16,902 bytes)

**Potential Integration Points:**
- Multi-vendor selection for RFP
- "Send RFP to Selected Vendors" button

**Action Needed:**
- Add "Create RFP with Selected" button at bottom of comparison view

---

## Components NOT Found (Need to Create)

### ❌ RFPFormModal.tsx
**Status**: Does not exist
**Priority**: HIGH (Story 13.1)
**Dependencies**: None
**Estimated Lines**: 400-500

**Must Create From Scratch:**
- Form with React Hook Form + Zod
- Auto-fill button with strategic roadmap fetch
- Vendor multi-select dropdown
- Document upload with react-dropzone
- Timeline/budget dropdowns
- Validation and error handling

---

### ❌ SendRFPButton.tsx
**Status**: Does not exist
**Priority**: HIGH (Story 13.2)
**Dependencies**: None
**Estimated Lines**: 150-200

**Must Create From Scratch:**
- "Send RFP" button with confirmation modal
- Loading state during send
- Success/failure results display
- Progress tracking

---

### ❌ Admin LeadsPage.tsx
**Status**: Does not exist
**Priority**: MEDIUM (Story 13.3)
**Dependencies**: None
**Estimated Lines**: 600-700

**Must Create From Scratch:**
- Admin-only page in `frontend/src/pages/admin/`
- Tabs: Premium/Basic/All
- Table with filters
- Lead details modal
- Status update dropdown
- CSV export button

---

### ❌ LeadDetailsModal.tsx
**Status**: Does not exist
**Priority**: MEDIUM (Story 13.3)
**Dependencies**: LeadsPage.tsx
**Estimated Lines**: 300-400

**Must Create From Scratch:**
- Modal for viewing lead details
- Different views for Premium vs Basic
- Status update functionality
- Contact information display

---

### ❌ ContactVendorModal.tsx
**Status**: Does not exist
**Priority**: MEDIUM (Story 13.6)
**Dependencies**: None
**Estimated Lines**: 250-300

**Must Create From Scratch:**
- Simple contact form modal
- Message textarea with character counter
- Budget/timeline dropdowns
- Auto-filled user/company info
- Rate limit error handling (429)

---

### ❌ PremiumFeatureGate.tsx
**Status**: Does not exist
**Priority**: HIGH (Story 13.5)
**Dependencies**: None
**Estimated Lines**: 50-100

**Must Create From Scratch:**
- Wrapper component checking subscription
- Disabled UI for Free users
- Tooltip/badge "Premium Required"
- Upgrade prompt on click

---

### ❌ UpgradePromptModal.tsx
**Status**: Does not exist
**Priority**: HIGH (Story 13.5)
**Dependencies**: None
**Estimated Lines**: 150-200

**Must Create From Scratch:**
- Modal shown on 403 errors
- Benefits list
- "Upgrade Now" button → /pricing
- "Maybe Later" button

---

## Custom Hooks to Create

### ❌ useStrategicRoadmap.ts
**Status**: Does not exist
**Priority**: HIGH (Story 13.1)
```typescript
export function useStrategicRoadmap(organizationId: string) {
  return useQuery({
    queryKey: ['strategic-roadmap', organizationId],
    queryFn: () => rfpApi.getStrategicRoadmap(organizationId),
    enabled: !!organizationId,
  });
}
```

---

### ❌ useCreateRFP.ts
**Status**: Does not exist
**Priority**: HIGH (Story 13.1)
```typescript
export function useCreateRFP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => rfpApi.createRFP(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfps'] });
      toast.success('RFP created successfully');
    },
    onError: (error: any) => {
      if (error.status === 403) {
        // Show upgrade modal
      }
    },
  });
}
```

---

### ❌ useSendRFP.ts
**Status**: Does not exist
**Priority**: HIGH (Story 13.2)

---

### ❌ useLeads.ts (Admin)
**Status**: Does not exist
**Priority**: MEDIUM (Story 13.3)

---

### ❌ useContactVendor.ts
**Status**: Does not exist
**Priority**: MEDIUM (Story 13.6)

---

### ❌ useSubscriptionCheck.ts
**Status**: Does not exist
**Priority**: HIGH (Story 13.5)
```typescript
export function useSubscriptionCheck() {
  const { user } = useAuth();
  return {
    isPremium: user?.subscription?.plan === 'PREMIUM',
    isActive: user?.subscription?.status === 'ACTIVE',
    canCreateRFP: isPremium && isActive,
  };
}
```

---

## Refactoring Strategy

### Phase 1: Refactor Existing RfpTracking.tsx ✅
**Priority**: HIGH
**Reason**: Already integrated in Marketplace, good starting point

**Steps:**
1. Create new interface matching backend RFP model
2. Replace localStorage with `rfpApi.getRFPs()` + TanStack Query
3. Map backend RFPStatus enum to UI statuses:
   - DRAFT → "Draft"
   - SENT → "Sent"
   - FAILED → "Failed"
   - ACTIVE → "Active"
   - CLOSED → "Closed"
   - ARCHIVED → "Archived"
4. Add loading skeleton
5. Add error handling with retry button
6. Update CSV export to use new fields
7. Add "Create RFP" button at top
8. Add "Send" action for DRAFT RFPs

**Estimated Time**: 2-3 hours

---

### Phase 2: Create RFPFormModal.tsx ✅
**Priority**: HIGH
**Reason**: Core functionality for RFP creation

**Steps:**
1. Create form with React Hook Form + Zod
2. Add all form fields (title, objectives, requirements, etc.)
3. Implement auto-fill button with `useStrategicRoadmap` hook
4. Add vendor multi-select (fetch from `vendorApi.getVendors()`)
5. Add document upload with react-dropzone
6. Validate max 5 files, 10MB each, PDF/DOCX/XLSX only
7. Submit to `rfpApi.createRFP()`
8. Handle success/error states
9. Integrate with RfpTracking page (open modal on "Create RFP" click)

**Estimated Time**: 1 day

---

### Phase 3: Create SendRFPButton.tsx ✅
**Priority**: HIGH
**Reason**: Enables RFP delivery (core workflow)

**Steps:**
1. Create button component with confirmation modal
2. Implement `useSendRFP` hook
3. Show progress during send (loading spinner)
4. Display results: sentCount, failedCount, failures
5. Handle partial failures gracefully
6. Update RFP list after send (invalidate query)

**Estimated Time**: 2-3 hours

---

### Phase 4: Integrate Contact Buttons ✅
**Priority**: MEDIUM
**Reason**: Already have vendor components, just add buttons

**Steps:**
1. Create ContactVendorModal.tsx
2. Create `useContactVendor` hook
3. Add "Contact Vendor" button to VendorProfile.tsx
4. Add "Contact Vendor" button to VendorMarketplace.tsx (vendor cards)
5. Handle rate limiting (429 error)

**Estimated Time**: 4-6 hours

---

### Phase 5: Create Premium Feature Gate ✅
**Priority**: HIGH
**Reason**: Required before deploying RFP features

**Steps:**
1. Create PremiumFeatureGate.tsx wrapper
2. Create UpgradePromptModal.tsx
3. Create `useSubscriptionCheck` hook
4. Wrap "Create RFP" buttons with gate
5. Show upgrade modal on 403 errors

**Estimated Time**: 2-3 hours

---

### Phase 6: Create Admin Lead Dashboard ✅
**Priority**: LOW (Admin feature, not user-facing)
**Reason**: Can be built after main user flow works

**Steps:**
1. Create `frontend/src/pages/admin/LeadsPage.tsx`
2. Create LeadDetailsModal.tsx
3. Create `useLeads`, `useLead`, `useUpdateLeadStatus` hooks
4. Add to admin navigation
5. Implement filters, search, pagination
6. Add CSV export button

**Estimated Time**: 1 day

---

## Implementation Priority

### Sprint 1 (Week 1): Core RFP Workflow
1. ✅ Refactor RfpTracking.tsx (2-3 hours)
2. ✅ Create RFPFormModal.tsx (1 day)
3. ✅ Create SendRFPButton.tsx (2-3 hours)
4. ✅ Create PremiumFeatureGate.tsx (2-3 hours)

**Deliverable**: Users can create and send RFPs end-to-end

---

### Sprint 2 (Week 2): Vendor Engagement
1. ✅ Create ContactVendorModal.tsx (4-6 hours)
2. ✅ Integrate contact buttons in VendorProfile.tsx
3. ✅ Integrate contact buttons in VendorMarketplace.tsx
4. ✅ Add "Create RFP" buttons to vendor pages

**Deliverable**: Users can contact vendors and create RFPs from vendor pages

---

### Sprint 3 (Week 3): Admin Features
1. ✅ Create Admin LeadsPage.tsx (1 day)
2. ✅ Create LeadDetailsModal.tsx (4-6 hours)
3. ✅ Add to admin navigation
4. ✅ Test full admin workflow

**Deliverable**: Admins can track and manage leads

---

### Sprint 4 (Week 4): Polish & Testing
1. ✅ Write component tests
2. ✅ Write integration tests
3. ✅ Fix bugs and edge cases
4. ✅ Update documentation

**Deliverable**: Production-ready Epic 13 frontend

---

## Files to Create (Summary)

### Components (9 files):
1. ❌ `frontend/src/components/rfp/RFPFormModal.tsx`
2. ❌ `frontend/src/components/rfp/SendRFPButton.tsx`
3. ❌ `frontend/src/components/rfp/VendorMultiSelect.tsx`
4. ❌ `frontend/src/components/rfp/PremiumFeatureGate.tsx`
5. ❌ `frontend/src/components/rfp/UpgradePromptModal.tsx`
6. ❌ `frontend/src/components/vendor/ContactVendorModal.tsx`
7. ❌ `frontend/src/pages/admin/LeadsPage.tsx`
8. ❌ `frontend/src/components/admin/LeadDetailsModal.tsx`
9. ❌ `frontend/src/components/admin/LeadAnalyticsCard.tsx`

### Hooks (8 files):
1. ❌ `frontend/src/hooks/useStrategicRoadmap.ts`
2. ❌ `frontend/src/hooks/useCreateRFP.ts`
3. ❌ `frontend/src/hooks/useSendRFP.ts`
4. ❌ `frontend/src/hooks/useLeads.ts`
5. ❌ `frontend/src/hooks/useLead.ts`
6. ❌ `frontend/src/hooks/useUpdateLeadStatus.ts`
7. ❌ `frontend/src/hooks/useContactVendor.ts`
8. ❌ `frontend/src/hooks/useSubscriptionCheck.ts`

### Modified Files (3 files):
1. ✅ Refactor: `frontend/src/components/RfpTracking.tsx`
2. ✅ Integrate: `frontend/src/components/VendorProfile.tsx` (add buttons)
3. ✅ Integrate: `frontend/src/components/VendorMarketplace.tsx` (add buttons)

---

## Conclusion

**Existing Code Reuse**: 10-15%
- ✅ RfpTracking.tsx UI layout and structure (refactor to use API)
- ✅ Vendor pages already exist (just add buttons)

**New Code Required**: 85-90%
- ❌ 9 new components (~3,000 lines)
- ❌ 8 new custom hooks (~800 lines)
- ❌ Refactor 1 existing component (~400 lines modified)

**Total Estimated Lines**: ~4,200 lines of frontend code

**Total Estimated Time**: 2-3 weeks full-time development

**Next Step**: Start with refactoring RfpTracking.tsx to connect to backend API.

---

**Analysis Complete**: 2025-10-27
