# Epic 13: Admin Revenue Reports - Backend Integration

## Epic Status
**Status**: Draft
**Priority**: High
**Estimated Effort**: 20 Story Points (15-22 hours)
**Target Sprint**: Next Available

---

## Epic Goal

Replace all hardcoded mock data in the Admin Revenue Reports page with real-time financial analytics calculated from the database Invoice records, enabling accurate business intelligence, revenue tracking, and financial reporting for platform administrators.

---

## Business Value

**Problem**: The Admin Revenue Reports page (`/admin/reports`) currently displays hardcoded mock data, making it impossible for administrators to track actual platform revenue, analyze customer trends, or make data-driven business decisions.

**Solution**: Implement full backend-to-frontend integration that calculates revenue from PAID invoices, provides multiple views (overview, trends, customers, breakdown), and displays real-time financial metrics with proper EUR formatting.

**Impact**:
- ✅ Admins can see **actual revenue** (not mock €23,960)
- ✅ Accurate **MRR/ARR** calculations for financial planning
- ✅ Identify **top customers** by revenue
- ✅ Track **revenue trends** over time (daily/weekly/monthly)
- ✅ Make **informed decisions** based on real financial data

---

## Stories Overview

| Story | Title | Points | Effort | Dependencies |
|-------|-------|--------|--------|--------------|
| 13.0 | Seed Revenue Test Data | 2 | 2-3h | None |
| 13.1 | Backend Revenue Analytics API | 8 | 6-8h | Story 13.0 |
| 13.2 | Frontend API Integration | 5 | 4-5h | Story 13.1 |
| 13.3 | Chart Data Transformation & UI Polish | 5 | 4-6h | Story 13.2 |
| **Total** | | **20** | **15-22h** | Sequential |

---

## Story Summaries

### Story 13.0: Seed Revenue Test Data
**Goal**: Create sample invoice data for development/testing

**Key Deliverable**: NPM script that generates 50+ realistic invoices spanning 12 months with proper status distribution (80% PAID, 10% OPEN, 5% VOID, 5% DRAFT).

**Why First**: Cannot test revenue analytics without data. Must have PAID invoices to validate calculations.

**Output**: `backend/prisma/seed-revenue.ts` + `npm run db:seed:revenue`

---

### Story 13.1: Backend Revenue Analytics API
**Goal**: Calculate real revenue from database and expose via API

**Key Deliverables**:
- Extend `AnalyticsService` with `getRevenueAnalytics()` method
- Add API route: `GET /admin/analytics/revenue?view=<type>`
- Support 4 views: overview, trends, customers, breakdown
- Accurate revenue calculation (PAID invoices only, EUR formatting)
- MRR/ARR normalization (MONTHLY vs ANNUAL subscriptions)

**Technical Highlights**:
- Uses raw SQL with Prisma for efficient aggregation
- JOINs Invoice → Subscription → User → Organization for customer attribution
- Admin-only access (existing auth middleware)
- Date range filtering (max 1 year, matches existing analytics)

**Output**: Functional API endpoint returning revenue data in JSON

---

### Story 13.2: Frontend API Integration
**Goal**: Connect frontend to backend API, replace mock data

**Key Deliverables**:
- Add `adminAnalyticsApi.getRevenueAnalytics()` method
- Integrate TanStack Query (4 concurrent queries: overview, trends, customers, breakdown)
- Remove ALL mock data arrays (lines 53-76 in RevenueReports.tsx)
- Add loading states, error handling, empty states

**Technical Highlights**:
- 5-minute cache refresh (refetchInterval: 300000)
- Query keys include timeRange for proper invalidation
- Parallel API calls (overview + trends + customers + breakdown)
- Graceful error handling (network errors, 403, 500)

**Output**: RevenueReports page fetching real data from backend

---

### Story 13.3: Chart Data Transformation & UI Polish
**Goal**: Transform API data into chart formats, polish UI

**Key Deliverables**:
- Transform trends data → LineChart format (Recharts)
- Transform breakdown data → PieChart format
- Transform customers data → Table format
- Implement formatCurrency() helper (€12,345.67)
- Add growth indicators (green up arrow, red down arrow)
- Handle edge cases (zero revenue, negative growth, single data point)

**Technical Highlights**:
- React.useMemo for efficient transformations
- Intl.NumberFormat for proper EUR formatting
- Dynamic groupBy (day/week/month) based on timeRange
- Empty state handling (no crashes with zero data)

**Output**: Fully functional revenue reports with polished UI

---

## Technical Architecture

### Database Schema (No Changes Required)
```
Invoice (revenue source)
├── amount: Float (EUR)
├── status: InvoiceStatus (PAID, OPEN, VOID, DRAFT)
├── paidAt: DateTime
└── subscriptionId → Subscription
    └── userId → User
        └── userId → Organization (customer attribution)
```

### API Flow
```
Frontend                    Backend                     Database
   │                           │                            │
   │  GET /analytics/revenue   │                            │
   ├──────────────────────────>│                            │
   │  ?view=overview            │  Query PAID invoices      │
   │                           ├───────────────────────────>│
   │                           │  SUM(amount), COUNT(*)     │
   │                           │<───────────────────────────│
   │                           │  Calculate MRR/ARR         │
   │  ApiResponse<Revenue>     │  Format response           │
   │<──────────────────────────┤                            │
   │  Display in charts        │                            │
```

### Data Transformations
```
API Response                   Transform                    Chart Data
─────────────────             ───────────                  ──────────────
{                             React.useMemo                [
  trends: [                   ─────────────>                 { month: "Jan",
    { date: "2024-01-15",                                      revenue: 12500 },
      revenue: 12500 }                                       { month: "Feb",
  ]                                                            revenue: 15200 }
}                                                            ]
                                                             ▼
                                                          <LineChart>
```

---

## Success Metrics

### Functional Requirements Met
- ✅ All mock data replaced with real data
- ✅ Revenue calculations accurate (±€1 tolerance)
- ✅ All 4 views working (overview, trends, customers, breakdown)
- ✅ Time range filtering functional
- ✅ Currency formatting consistent (EUR €)

### Performance Targets
- ✅ Page load time < 2 seconds
- ✅ API response time < 500ms
- ✅ No N+1 query issues
- ✅ TanStack Query caching reduces redundant calls

### Quality Gates
- ✅ TypeScript compilation passes (no errors)
- ✅ ESLint passes (no warnings)
- ✅ No console errors during normal usage
- ✅ Empty data states handled gracefully
- ✅ Edge cases tested (zero revenue, negative growth)

---

## Risk Assessment

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Revenue calculation errors | Medium | High | Comprehensive unit tests, manual validation against spreadsheet |
| Insufficient test data | High | Medium | Story 13.0 creates rich seed data before development |
| Performance issues with large datasets | Low | Medium | Use raw SQL, leverage existing indexes, set query timeouts |
| Frontend-backend data format mismatch | Medium | Low | TypeScript interfaces, contract tests |

### Rollback Plan
- Frontend: Re-enable mock data via feature flag
- Backend: Keep endpoint but return empty data
- Database: No schema changes, no rollback needed

---

## Definition of Done (Epic Level)

### Code Complete
- [ ] All 4 stories completed (all tasks checked off)
- [ ] All acceptance criteria verified
- [ ] TypeScript compilation passes
- [ ] ESLint passes

### Testing Complete
- [ ] Unit tests written (≥90% coverage for revenue calculations)
- [ ] Integration tests pass (API contract tests)
- [ ] Manual testing complete (all charts render correctly)
- [ ] Edge cases tested (zero revenue, empty database, etc.)

### Documentation Complete
- [ ] API endpoint documented (Swagger/OpenAPI)
- [ ] Seed data instructions in README
- [ ] Revenue calculation formulas documented in code comments
- [ ] CLAUDE.md updated (if needed)

### Deployment Ready
- [ ] Smoke test passed on staging (real data displayed)
- [ ] Performance validated (< 2s page load, < 500ms API)
- [ ] No regressions in other admin pages
- [ ] Audit logs capture revenue report access
- [ ] Ready for production deployment

---

## Dependencies

### Prerequisites
- ✅ Existing AnalyticsService functional
- ✅ Admin auth middleware working
- ✅ TanStack Query installed (frontend)
- ✅ Recharts library installed (frontend)
- ✅ Seed data for users/subscriptions exists

### Blocks
- None (self-contained epic)

---

## Related Documentation

**Code Files**:
- Backend: `backend/src/services/analytics.service.ts`
- Backend: `backend/src/routes/admin.routes.ts`
- Frontend: `frontend/src/lib/api.ts`
- Frontend: `frontend/src/pages/admin/RevenueReports.tsx`
- Seed: `backend/prisma/seed-revenue.ts`

**Schema**:
- `backend/prisma/schema.prisma` (Invoice, Subscription, Organization models)

**Existing Analytics**:
- Assessment metrics: `/admin/analytics/assessments`
- Vendor metrics: `/admin/analytics/vendors`
- User metrics: `/admin/analytics/users`

---

## Future Enhancements (Out of Scope)

**Known Limitations in V1**:
- Invoice type classification simplified (all treated as subscriptions)
- No drill-down capability (clicking chart doesn't filter details)
- No revenue forecasting/projections
- No comparison to previous periods (shown in growth % only)

**Future Ideas**:
- Add `Invoice.type` enum field for explicit classification
- Real-time revenue dashboard (WebSocket updates)
- Revenue goals/targets tracking
- Cohort analysis (revenue by signup month)
- Churn rate calculations (MRR lost per month)
- Customer lifetime value (CLV) predictions
- Revenue attribution to marketing campaigns

---

## Story Files

1. [Story 13.0: Seed Revenue Test Data](./13.0.seed-revenue-test-data.story.md)
2. [Story 13.1: Backend Revenue Analytics API](./13.1.backend-revenue-analytics-api.story.md)
3. [Story 13.2: Frontend API Integration](./13.2.frontend-revenue-api-integration.story.md)
4. [Story 13.3: Chart Data Transformation & UI Polish](./13.3.chart-data-transformation-ui-polish.story.md)

---

## Approval & Sign-off

**Product Owner**: [ ] Approved
**Tech Lead**: [ ] Approved
**Scrum Master**: [ ] Ready for Sprint Planning

**Notes**: Epic reviewed and validated against codebase. All implementation issues identified and corrected. Ready for development.
