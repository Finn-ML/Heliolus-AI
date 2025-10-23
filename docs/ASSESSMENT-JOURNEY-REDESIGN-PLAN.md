# Assessment Journey Redesign Plan

## Single-Page Card-Based Experience

**Date Created:** October 10, 2025
**Created By:** Sally (UX Expert) + User
**Status:** Planning Phase - Ready for Implementation
**Reference Screenshots:**

- Journey Page: `docs/Screenshot 2025-10-10 at 01.45.08.png`
- Journey Cards: `docs/Screenshot 2025-10-10 at 01.45.10.png`
- Results Page: `docs/Screenshot 2025-10-10 at 01.51.30.png`

---

## 🎯 Vision Statement

Transform the multi-step assessment wizard into a **single-page, card-based journey** where users can see all steps at once, with expandable sections for input and real-time AI processing feedback. Follow with a comprehensive **tabbed results page** that balances high-level insights with detailed analytics.

---

## 📐 Design Pattern Overview

### Journey Page Pattern

```
Single Vertical Page Layout:
- Hero section with brain icon + progress bar
- Card stack showing all steps simultaneously
- Expandable cards for user input (Business Profile, Documents)
- Auto-updating status cards for AI processing
- Visual state transitions (incomplete → active → processing → complete)
```

### Results Page Pattern

```
Dashboard Layout:
- Split view: Risk Score (left) + Key Metrics (right)
- Tabbed navigation for deep dives
- Expandable card sections for detailed findings
- Clear CTAs: Back to Journey, Download Report
```

---

## 🗂️ Journey Page Structure

### Current Live Example

**URL:** `/assessment/execute/cmgjmg5ot001nqdj1miztnuto`

### Card Progression (Top to Bottom)

1. **Hero Section** (Fixed, Always Visible)
   - 🧠 Brain icon
   - "AI Risk Analysis in Progress"
   - Template badge: "Trade Compliance Assessment"
   - Overall progress bar: "30%"
   - Time estimate: "Estimated time remaining: 7 minutes"

2. **Card 1: Business Profile Setup** (EXPANDABLE)
   - States: Incomplete → Active → Complete
   - Contains: Company details, industry, size, risk profile

3. **Card 2: Upload Documents** (EXPANDABLE)
   - States: Incomplete → Active → Complete
   - Contains: Document upload interface, file list

4. **Card 3: Identifying Risks** (AUTO-PROCESSING)
   - States: Next → Processing → Complete
   - Shows: AI analyzing documents

5. **Card 4: Gap Analysis** (AUTO-PROCESSING)
   - States: Next → Processing → Complete
   - Shows: AI comparing current state vs requirements

6. **Card 5: Risk Scoring** (AUTO-PROCESSING)
   - States: Next → Processing → Complete
   - Shows: AI calculating risk scores

7. **Sidebar Widget** (Optional - Contextual)
   - "Assessment Created - Starting AI analysis..."
   - Live status updates during processing

---

## 🎨 Card State Design System

### Visual States & Icons

| State            | Icon       | Border        | Background      | Interaction              | Example Text                                         |
| ---------------- | ---------- | ------------- | --------------- | ------------------------ | ---------------------------------------------------- |
| **Incomplete**   | ⚠️ Warning | Orange border | White/light     | Clickable to expand      | "Complete your business profile to begin assessment" |
| **Active**       | 📝 Edit    | Blue border   | Blue tint       | Expanded accordion       | "Fill in your organization details"                  |
| **Processing**   | 🔄 Spinner | Cyan border   | Dark blue       | No interaction           | "Analyzing documents... 45%"                         |
| **Complete**     | ✅ Check   | Green subtle  | Light green     | Collapsed, can re-expand | "Business Profile - Complete"                        |
| **Next/Pending** | ⏳ Clock   | Gray border   | Gray background | Disabled                 | "Risk Scoring - Pending previous steps"              |

### Animation Transitions

- Card expansion: 300ms ease-out
- State change: Fade old icon → Slide in new icon (200ms)
- Progress bars: Smooth width animation (500ms)
- Checkmark appearance: Scale bounce effect

---

## ❓ Open Design Questions - Journey Page

### 1. Card Expandability

- [ ] **Which cards should be expandable?**
  - Option A: Only input cards (Business Profile + Documents)
  - Option B: All cards show expandable details
  - Option C: Completed cards can re-expand for editing

- [ ] **Expansion behavior:**
  - Auto-collapse previous when opening new?
  - Allow multiple cards open simultaneously?
  - Click anywhere on card or dedicated expand icon?

### 2. Incomplete State Behavior

- [ ] **Blocking vs Non-blocking:**
  - Should incomplete cards prevent progression?
  - Can users skip optional steps (e.g., documents)?
  - How to handle "optional but recommended" steps?

- [ ] **Call-to-Action messaging:**
  - "Complete Now" vs "Start" vs "Begin Setup"?
  - Include benefit messaging? ("Upload documents for 85% more accurate results")

### 3. Progress Calculation

- [ ] **Overall progress bar:**
  - Weighted by card importance? (Profile 20%, Docs 20%, AI steps 60%?)
  - Linear progression (5 cards = 20% each)?
  - Include time estimates per card?

- [ ] **Time estimation logic:**
  - Static estimates or dynamic based on template size?
  - Show "X minutes remaining" or "X/Y steps complete"?

### 4. Error Handling

- [ ] **Card-level errors:**
  - How to show validation errors without losing context?
  - Inline errors within expanded card or toast notifications?

- [ ] **Processing failures:**
  - If AI analysis fails on a card, show retry button?
  - Fallback to manual input option?

### 5. Navigation & Flow Control

- [ ] **Back button behavior:**
  - Sticky header with "← Back to Dashboard"?
  - Confirm before leaving if assessment in progress?

- [ ] **Save & Resume:**
  - Auto-save on every card completion?
  - "Save and finish later" button placement?

### 6. Mobile Responsiveness

- [ ] **Card stacking:**
  - Full-width cards on mobile (already works)?
  - Collapse hero section to sticky mini-bar on scroll?

- [ ] **Expandable sections:**
  - Use native accordion or custom drawer?
  - Different expand icon for mobile (chevron vs +)?

### 7. Real-time Updates

- [ ] **Polling frequency:**
  - Every 2 seconds during processing (current)?
  - WebSocket for instant updates?

- [ ] **Processing animations:**
  - Show live question count? ("Processing question 12 of 45")
  - Display current section? ("Analyzing Transaction Monitoring section")

### 8. Accessibility

- [ ] **Screen reader announcements:**
  - ARIA live regions for status changes?
  - Announce progress updates every X%?

- [ ] **Keyboard navigation:**
  - Tab through cards, Enter to expand?
  - Skip to next incomplete card shortcut?

---

## 📊 Results Page Structure

### Current Live Example

**URL:** `/assessment/results/cmgk4u4t6006pp57w7nvqwl1d`

### Layout Sections

1. **Header Bar**
   - "Risk Assessment Results" title
   - "Back to Journey" button
   - "Download Report" button (cyan, prominent)

2. **Hero Section - Two Column**

   **Left Column: Overall Risk Assessment**
   - Large risk score gauge: "72 / 100"
   - Risk level indicator: "Risk Level: [Bar visualization]"
   - Assessment priority: "⚡ IMMEDIATE"
   - Investment range: "$50,000-$100,000"

   **Right Column: Key Metrics**
   - Total Gaps: 8 (cyan bar)
   - Critical Issues: 12 (red bar)
   - High Risks: 3 (orange bar)

3. **Tab Navigation**
   - Overview (active)
   - Gap Analysis
   - Risk Matrix
   - Strategy

4. **Executive Summary Section** (Expandable Cards)
   - Currently just heading visible
   - Should contain key findings in card format

5. **Widget: Assessment Created** (Bottom-right)
   - Shows "Starting AI analysis..." (seems stale after completion?)

---

## ❓ Open Design Questions - Results Page

### 1. Risk Score Visualization

- [ ] **Color coding scheme:**
  - 0-40: Red (High Risk)
  - 41-70: Orange (Medium Risk)
  - 71-100: Green (Low Risk)
  - Or inverse scale where higher = more risk?

- [ ] **Alternative visualizations:**
  - Keep semi-circular gauge?
  - Consider full circle, linear bar, or radar chart?
  - Add needle/pointer for better readability?

- [ ] **Risk band labels:**
  - Add text below score: "HIGH RISK" / "MODERATE RISK" / "LOW RISK"?
  - Include dot matrix or confidence indicator?

### 2. Key Metrics Enhancement

- [ ] **Additional context:**
  - Show trend vs last assessment (↑ ↓ →)?
  - Add sparkline charts for historical data?
  - Include percentage change?

- [ ] **Visual breakdown:**
  - Mini bar charts showing severity distribution?
  - Stacked bars for sub-categories?
  - Click to jump to detailed tab?

### 3. Executive Summary Cards

- [ ] **Card structure:**
  - Use same expandable card pattern as journey page?
  - Show top 3-5 findings as scannable bullets?
  - Include evidence tier badges (TIER_0/1/2)?

- [ ] **Content organization:**
  - Group by severity (Critical → High → Medium)?
  - Group by category (AML, KYC, Transaction Monitoring)?
  - Prioritize by recommended action timeline?

### 4. Assessment Priority Badge

- [ ] **Timeline context:**
  - Add "Action required within 30 days"?
  - Color-code urgency (red = immediate, yellow = soon, green = planned)?

- [ ] **Priority calculation:**
  - What determines IMMEDIATE vs PLANNED?
  - Show calculation transparency? ("Based on 3 critical gaps...")

### 5. Investment Range

- [ ] **Budget breakdown:**
  - Show cost categories (Technology, Consulting, Training)?
  - Add visual distribution (pie chart or stacked bar)?
  - Link to vendor recommendations with pricing?

- [ ] **ROI messaging:**
  - Include risk reduction estimates?
  - "Prevent $2M in potential fines" messaging?

### 6. Tab Content Design

- [ ] **Gap Analysis Tab:**
  - List view with filterable/sortable table?
  - Card-based layout matching journey?
  - Include gap prioritization matrix (effort vs impact)?

- [ ] **Risk Matrix Tab:**
  - Heat map visualization (likelihood × impact)?
  - Risk register table format?
  - Categorized by risk type?

- [ ] **Strategy Tab:**
  - Timeline-based roadmap (0-6mo, 6-18mo, 18+mo)?
  - Action plan checklist?
  - Integration with vendor marketplace?

### 7. Evidence Tier Integration

- [ ] **Where to show TIER badges:**
  - On individual gap/risk cards?
  - In summary statistics? ("Based on 5 TIER_2, 3 TIER_1 documents")
  - Quality score card?

- [ ] **Tier distribution visualization:**
  - Donut chart showing evidence mix?
  - Confidence score based on tier quality?
  - CTA to upload better evidence?

### 8. Assessment Status Widget

- [ ] **Post-completion state:**
  - Change to "✅ Assessment Complete"?
  - Show completion timestamp?
  - Remove entirely from results page?
  - Replace with "Share Results" or "Export" options?

### 9. Actions & CTAs

- [ ] **Primary actions:**
  - Download Report (already present) - PDF format?
  - Share with Team - Email/link?
  - Schedule Consultation - Book expert call?
  - Browse Vendors - Jump to marketplace?

- [ ] **Secondary actions:**
  - Edit Assessment - Go back to journey?
  - Compare to Previous - Show trends?
  - Set Reminders - For action items?

### 10. Mobile Optimization

- [ ] **Layout adjustments:**
  - Stack two-column hero vertically?
  - Collapsible sections instead of tabs?
  - Different gauge size for mobile?

- [ ] **Touch interactions:**
  - Swipe between tabs?
  - Pull-to-refresh for updated data?

---

## 🔗 Integration Points

### Data Flow

```
Journey Page → Results Page:
- assessmentId passed via URL
- Redirect after AI processing complete
- Maintain session/state during transition
```

### Shared Components

- Card component (expandable/collapsible)
- Progress indicators
- Evidence tier badges
- Status icons (⚠️ 📝 🔄 ✅ ⏳)

### API Requirements

- `GET /assessments/:id/progress` - Journey polling
- `GET /assessments/:id/results` - Results data
- `PUT /assessments/:id` - Update profile/documents
- `POST /assessments/:id/execute` - Start AI processing

---

## 📋 Implementation Priorities

### Phase 1: Journey Page Redesign (Week 1-2)

1. Build card component with state system
2. Implement expandable Business Profile section
3. Implement expandable Document Upload section
4. Connect AI processing status updates
5. Add progress bar and time estimation

### Phase 2: Results Page Enhancement (Week 2-3)

1. Redesign risk score visualization
2. Enhance key metrics cards
3. Build tab navigation system
4. Create expandable Executive Summary cards
5. Integrate evidence tier badges

### Phase 3: Polish & Optimization (Week 3-4)

1. Mobile responsive refinements
2. Animation tuning
3. Accessibility audit
4. Error state handling
5. Performance optimization

---

## 🎨 Design Deliverables Needed

Before implementation, create:

1. **High-fidelity mockups:**
   - Journey page - all card states
   - Results page - all tab views
   - Mobile responsive layouts

2. **Component specifications:**
   - Card component variants
   - Progress indicators
   - Evidence tier badge system

3. **Interaction design:**
   - Card expansion/collapse animations
   - State transition flows
   - Error handling patterns

4. **Content strategy:**
   - Messaging for each card state
   - Help text and tooltips
   - Error messages

---

## 🚀 Next Steps

**To pick this up in a fresh chat tomorrow:**

1. Review this plan document: `docs/ASSESSMENT-JOURNEY-REDESIGN-PLAN.md`
2. Reference screenshots in `docs/` folder
3. Answer open questions in priority order
4. Choose implementation approach:
   - Option A: Create detailed front-end spec (`*create-front-end-spec`)
   - Option B: Generate AI UI prompts for v0/Lovable (`*generate-ui-prompt`)
   - Option C: Create Figma-style wireframes/mockups

**Immediate Questions to Decide:**

- Which expandable cards pattern? (Only inputs vs all cards)
- Risk score color scheme? (Higher = worse or better?)
- Tab content priority? (Which tab to design first?)
- Mobile-first or desktop-first design approach?

---

## 📎 Related Documents

- Current UX Analysis: `docs/UX-ANALYSIS-ASSESSMENT-JOURNEY.md`
- AI Processing Implementation: `frontend/src/components/assessment/AIProcessingStep.tsx`
- Assessment Journey Page: `frontend/src/pages/AssessmentJourney.tsx`

---

_This plan captures the vision for a modern, single-page assessment experience with comprehensive results dashboard. Ready for design refinement and implementation approval._ ✨
