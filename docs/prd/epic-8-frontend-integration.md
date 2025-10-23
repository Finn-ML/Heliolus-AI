# Epic 8: Frontend Integration (Pay-Gating)

**Epic ID:** 8
**Status:** Draft
**Priority:** P0 - Critical
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 7 (API Endpoints)

---

## Epic Description

Build frontend UI components and pages to support the new tier structure including pricing page, quota warnings, blurred content for Freemium users, additional assessment purchases, and admin credit management interface.

---

## Business Value

- Drive Premium subscription conversions through clear value proposition
- Reduce support burden with self-service quota warnings
- Enable admins to manage Enterprise credits efficiently
- Provide seamless upgrade experience for Freemium users

---

## Stories

### Story 4.1: Create Pricing Page with Tier Comparison

**As a** prospective customer
**I want** to see clear pricing tiers and features
**So that** I can choose the right plan for my needs

**Acceptance Criteria:**
1. New page component created: `frontend/src/pages/Pricing.tsx`
2. Page displays 3 pricing cards side-by-side:
   - **Freemium**: "Free" with feature list
   - **Premium**: "€599/month" (highlighted) with "or €6,490/year (save 10%)"
   - **Enterprise**: "Custom" with "Contact Sales" CTA
3. Feature list for each tier:
   - Freemium: ✅ Compliance Score, ❌ Gap Analysis (Blurred), ❌ Strategy Matrix (Blurred), ✅ Vendor Browse, ❌ Vendor Matching, 📊 2 Assessments Total, ❌ Reports
   - Premium: ✅ All above unlocked, ✅ Vendor Matching (AI), 📊 2 Assessments Included, ✅ Additional: €299 each, ✅ Downloadable Reports, ✅ Lead Tracking
   - Enterprise: ✅ Everything in Premium, 🚀 Unlimited Assessments, 🎯 Custom Billing, 🤝 Dedicated Support
4. Current plan highlighted with "Current Plan" badge (disabled CTA)
5. Premium card visually highlighted (border, shadow, "Most Popular" badge)
6. "Upgrade Now" button navigates to: `/checkout?plan=premium&cycle=monthly`
7. "Contact Sales" opens email: `mailto:sales@heliolus.com`
8. Page fetches user's current subscription to show appropriate CTAs
9. Responsive design (stacks vertically on mobile)

**Technical Notes:**
- Use existing PricingCard component or create new
- Fetch subscription via: `useQuery(['subscription', 'info'], () => api.get('/v1/subscriptions/billing-info'))`
- Match styling from existing Heliolus brand
- Use Radix UI Card components

---

### Story 4.2: Add Quota Warning Component to Assessment Templates Page

**As a** Freemium user
**I want** to see remaining assessment quota
**So that** I'm aware of my limits before starting a new assessment

**Acceptance Criteria:**
1. New component created: `frontend/src/components/QuotaWarning.tsx`
2. Component accepts props:
   ```typescript
   { used: number, total: number, message: string }
   ```
3. Component displays:
   - Progress bar showing X of Y assessments used
   - Color coding: green (0-1 used), yellow (2 used), red (2+ used)
   - Message text (e.g., "1 assessment remaining")
4. Component integrated into `AssessmentTemplates.tsx`:
   - Shown only for FREE tier users
   - Positioned above template selection
   - Fetches quota data via: `useQuery(['user', 'assessment-quota'], () => api.get('/v1/user/assessment-quota'))`
5. If quota exceeded (2 of 2 used):
   - Show red alert with "Assessment Limit Reached"
   - Display upgrade CTA button
   - Disable template selection

**Technical Notes:**
- Use existing Alert/Progress components from Radix UI
- Position near top of page for visibility
- Auto-refresh quota on page load
- Handle loading/error states gracefully

---

### Story 4.3: Add Quota Exceeded Modal to Assessment Creation Flow

**As a** Freemium user
**I want** clear messaging when I hit my assessment limit
**So that** I understand I need to upgrade

**Acceptance Criteria:**
1. New component created: `frontend/src/components/UpgradePrompt.tsx`
2. Component accepts props:
   ```typescript
   {
     title: string,
     message: string,
     plan: string,
     price: string,
     onUpgrade: () => void
   }
   ```
3. Component displays modal with:
   - Icon (Lock or Sparkles)
   - Title: "Assessment Limit Reached"
   - Message: "Free users can create maximum 2 assessments"
   - Upgrade button: "Upgrade to Premium - €599/month"
   - Secondary button: "Learn More" (links to /pricing)
4. Modal shown when user attempts to create 3rd assessment
5. `AssessmentTemplates.tsx` modified to:
   - Check quota before allowing template selection
   - Call `handleSelectTemplate()` which checks `quota.totalAssessmentsCreated >= 2`
   - Show UpgradePrompt modal if quota exceeded
   - Prevent assessment creation API call
6. Error code `FREEMIUM_QUOTA_EXCEEDED` from backend triggers same modal

**Technical Notes:**
- Use Radix UI Dialog component
- Match modal styling to existing modals
- onUpgrade navigates to `/pricing?upgrade=premium`
- Trap focus in modal (accessibility)

---

### Story 4.4: Add Blurred Content Sections to Assessment Results

**As a** Freemium user
**I want** to see that gap analysis and strategy matrix exist but are locked
**So that** I'm motivated to upgrade to see full details

**Acceptance Criteria:**
1. New component created: `frontend/src/components/BlurredSection.tsx`
2. Component accepts props:
   ```typescript
   {
     title: string,
     children: React.ReactNode,
     locked: boolean
   }
   ```
3. Component displays:
   - Section title
   - Content with CSS blur filter (when locked)
   - Overlay with Lock icon
   - "Upgrade to Premium" button
   - Price text: "Starting at €599/month"
4. `AssessmentResults.tsx` modified to:
   - Check `results.isRestricted` flag from API
   - If `true`, wrap Gap Analysis and Strategy Matrix in `<BlurredSection locked={true}>`
   - If `false`, render normal unblurred content
5. Compliance score ALWAYS visible (never blurred)
6. Vendor section shows browse list but hides AI matching for FREE users
7. Download Report button hidden for FREE users
8. Blur effect: `filter: blur(8px)` with pointer-events disabled

**Technical Notes:**
- File: `frontend/src/pages/AssessmentResults.tsx`
- Create BlurredSection.tsx in components/ui/
- Use position: relative for overlay positioning
- Ensure blur doesn't impact accessibility (screen readers should announce "locked content")

---

### Story 4.5: Update Vendor Marketplace to Hide AI Matching for FREE Users

**As a** Freemium user
**I want** to browse vendors but not see AI recommendations
**So that** I understand AI matching is a Premium feature

**Acceptance Criteria:**
1. `VendorMarketplace.tsx` modified to check user subscription plan
2. For FREE users:
   - Display full vendor directory (browse all vendors)
   - Hide "AI Matched Vendors" section entirely
   - Show message: "Upgrade to Premium to see AI-matched vendors for your assessment"
   - Vendor cards shown without match scores
   - Contact button still functional (no lead tracking)
3. For PREMIUM/ENTERPRISE users:
   - Show "AI Matched Vendors" section with match scores
   - Display personalized recommendations based on assessment gaps
   - Full lead tracking functionality
4. Subscription plan fetched via existing API call
5. Conditional rendering based on plan tier

**Technical Notes:**
- File: `frontend/src/components/VendorMarketplace.tsx`
- Use existing subscription query (don't add duplicate calls)
- Ensure vendor browse performance not degraded
- Match scores come from `vendorMatches` API response

---

### Story 4.6: Add Purchase Additional Assessment Button to Dashboard

**As a** Premium user
**I want** to purchase additional assessments
**So that** I can exceed my monthly allocation when needed

**Acceptance Criteria:**
1. New component created: `frontend/src/components/PurchaseAssessmentButton.tsx`
2. Component displayed on Dashboard for PREMIUM users
3. Button shows: "Purchase Additional Assessment - €299"
4. On click:
   - Open confirmation modal with:
     - Message: "Purchase 1 additional assessment for €299?"
     - Shows current credit balance
     - Shows new balance after purchase (+50 credits)
     - "Confirm Purchase" button
     - "Cancel" button
5. On confirm:
   - Call API: `POST /v1/subscriptions/:userId/purchase-assessment`
   - Show loading state during API call
   - On success: Show success toast, refresh credit balance
   - On error: Show error message
6. Component hidden for FREE (show upgrade prompt) and ENTERPRISE users (unlimited)
7. Disable button if user has insufficient Stripe payment method on file

**Technical Notes:**
- Use Radix UI Dialog for modal
- Mutation: `useMutation(purchaseAssessment)`
- Invalidate subscription query on success to refresh balance
- Show toast notification: "50 credits added successfully"
- Future enhancement: Real Stripe checkout integration

---

### Story 4.7: Create Admin Credit Management UI

**As a** system administrator
**I want** to grant credits to Enterprise users via UI
**So that** I can manage custom billing arrangements

**Acceptance Criteria:**
1. Update `frontend/src/pages/admin/UserManagement.tsx`
2. Add "Manage Credits" action button to user table rows
3. On click, open side panel with:
   - User details (name, email, current credit balance)
   - Form with fields:
     - Amount (number input, min: 1)
     - Reason (textarea, required)
   - "Grant Credits" button
   - Credit transaction history table (recent 10 transactions)
4. On submit:
   - Call API: `POST /v1/admin/users/:userId/credits`
   - Show loading state
   - On success: Close panel, refresh user list, show toast
   - On error: Show error message in form
5. Transaction history displays:
   - Date, Type, Amount, Balance, Description
   - Sorted by date descending
6. Panel only accessible to ADMIN role users
7. Responsive design (full screen on mobile)

**Technical Notes:**
- Use Radix UI Sheet/Drawer for side panel
- Fetch history: `useQuery(['admin', 'credits', userId], () => api.get('/v1/admin/users/:userId/credits'))`
- Mutation: `useMutation(grantCredits)`
- Validate amount > 0 client-side
- Clear form after successful grant
- Use React Hook Form for form validation

---

### Story 4.8: Add Billing Cycle Toggle to Subscription Upgrade Flow

**As a** user upgrading to Premium
**I want** to choose between monthly and annual billing
**So that** I can save 10% with annual commitment

**Acceptance Criteria:**
1. Create/update `frontend/src/pages/Checkout.tsx` (if doesn't exist)
2. Page displays:
   - Plan details (Premium features)
   - Billing cycle selector:
     - Radio buttons or toggle: "Monthly" vs "Annual"
     - Monthly: "€599/month"
     - Annual: "€6,490/year (Save 10%)" with green savings badge
   - Payment method form (Stripe Elements placeholder)
   - Total amount based on selection
   - "Confirm Upgrade" button
3. On submit:
   - Call API: `POST /v1/subscriptions/:userId/upgrade` with selected billingCycle
   - Mock payment success for now
   - Redirect to dashboard with success message
4. URL params control initial selection: `/checkout?plan=premium&cycle=monthly`
5. Savings calculation displayed: "Save €718.80/year"
6. Back button returns to pricing page

**Technical Notes:**
- Use query params to prefill plan and cycle
- Stripe Elements integration in future story
- For now, mock successful upgrade
- Show loading spinner during API call
- Invalidate subscription queries after upgrade

---

## Definition of Done

- [ ] All 8 UI components/pages implemented
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Accessibility tested (keyboard navigation, screen readers)
- [ ] API integration tested with real backend
- [ ] Loading/error states handled gracefully
- [ ] Styling matches Heliolus brand guidelines
- [ ] Code reviewed and merged

---

## Technical Dependencies

- Epic 3: All API endpoints functional
- Existing: api.ts client, React Query setup
- Radix UI component library
- React Hook Form for form handling
- Existing toast/notification system

---

## Design Requirements

- Match existing Heliolus color scheme and typography
- Use consistent spacing and layout patterns
- Icons from lucide-react library
- Blur effect for locked content: `blur(8px)`
- Progress bars use brand colors
- CTAs prominently displayed with high contrast

---

## User Experience Requirements

- Clear value proposition on pricing page
- No dead ends - always provide path to upgrade
- Loading states prevent user confusion
- Error messages are actionable (tell user what to do)
- Quota warnings shown proactively, not just on error
- Admin UI efficient for bulk credit management

---

## Testing Strategy

- Unit tests for individual components
- Integration tests for API-connected components
- Visual regression testing for blurred content
- Accessibility audit with axe-devtools
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness testing

---

## Future Enhancements (Post-MVP)

- Real Stripe checkout integration
- Proration preview for mid-cycle upgrades
- Upgrade flow animation/celebration
- Usage analytics dashboard for admins
- Bulk credit grant for multiple users
- Email notifications for low credit balance
