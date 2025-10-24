# Epic 11: Admin Assessment Reports & Analytics

**Epic ID:** 11
**Status:** Draft
**Priority:** P1 - High
**Estimated Effort:** 10-12 hours
**Dependencies:** None (Existing admin dashboard infrastructure)

---

## Epic Description

Transform the existing admin dashboard from mock data to a comprehensive, real-time assessment analytics system. Enable administrators to monitor assessment activity, track completion rates, analyze user engagement, and measure platform performance through interactive, numbers-focused visualizations.

---

## Business Value

- **Data-Driven Decisions**: Real metrics enable informed product and business decisions
- **Performance Monitoring**: Track completion rates and identify drop-off points
- **Revenue Insights**: Understand assessment-to-subscription conversion patterns
- **User Engagement**: Measure platform activity and user retention
- **Vendor ROI**: Track vendor marketplace effectiveness and click-through rates
- **Operational Visibility**: Real-time view of platform health and usage

---

## Existing System Context

**Current Status:**
- Dashboard UI exists at `/admin/dashboard` with charts and visualizations
- All metrics currently use MOCK data (hardcoded numbers)
- Recharts integration complete with Funnel, Line, Pie, Bar charts
- Dashboard shows: Assessment metrics, Vendor metrics, Conversion funnel, Activity trends

**Technology Stack:**
- Frontend: React + Recharts 2 + TanStack Query
- Backend: Fastify + Prisma + PostgreSQL
- Charts: Recharts (responsive, interactive)

**Integration Points:**
- Assessment model: Started, completed, abandoned tracking
- User model: Registration, activity tracking
- Vendor model: Clicks, contacts, conversions
- Template model: Assessment type distribution
- Organization model: Company size, industry segmentation

**Data Sources:**
- `Assessment` table: status, createdAt, updatedAt, templateId
- `User` table: createdAt, lastLogin, role
- `VendorContact` table: clicks, contacts, conversions
- `VendorMatch` table: viewed, contacted, dismissed

---

## Stories

### Story 11.1: Assessment Metrics Backend API

**As a** system
**I want** real-time assessment metrics aggregated from the database
**So that** admins can monitor assessment activity accurately

**Acceptance Criteria:**
1. New endpoint: `GET /v1/admin/analytics/assessments`
2. Returns aggregated metrics:
   ```typescript
   {
     total: number,           // All assessments ever created
     started: number,         // Status = IN_PROGRESS or COMPLETED
     completed: number,       // Status = COMPLETED
     inProgress: number,      // Status = IN_PROGRESS
     abandoned: number,       // Status = IN_PROGRESS AND updatedAt > 7 days ago
     completionRate: number,  // (completed / started) * 100
     avgCompletionTime: number, // Average minutes from createdAt to updatedAt for COMPLETED
     byStatus: {
       DRAFT: number,
       IN_PROGRESS: number,
       COMPLETED: number,
       FAILED: number
     },
     byTemplate: Array<{
       templateId: string,
       templateName: string,
       count: number,
       percentage: number
     }>,
     trend: Array<{
       date: string,        // YYYY-MM-DD
       started: number,
       completed: number,
       abandoned: number
     }>  // Last 30 days
   }
   ```
3. Query parameters supported:
   - `startDate`: Filter from date (ISO 8601)
   - `endDate`: Filter to date (ISO 8601)
   - `groupBy`: 'day' | 'week' | 'month' (default: 'day')
4. Efficient aggregation using Prisma:
   - Use `groupBy` for status counts
   - Use date functions for trend data
   - Join with Template for names
5. Response time < 1 second for 10,000+ assessments
6. Cache results for 5 minutes (metrics don't need real-time precision)

**Technical Notes:**
- Create analytics service: `backend/src/services/analytics.service.ts`
- Use Prisma aggregations: `count`, `groupBy`, date truncation
- Calculate completion time: `EXTRACT(EPOCH FROM (updatedAt - createdAt)) / 60`
- Abandoned: `status = 'IN_PROGRESS' AND updatedAt < NOW() - INTERVAL '7 days'`
- Add route to admin.routes.ts

---

### Story 11.2: Connect Real Assessment Metrics to Dashboard

**As an** admin
**I want** to see real assessment metrics on the dashboard
**So that** I can monitor actual platform usage

**Acceptance Criteria:**
1. Replace all mock assessment data with real API data
2. Key metrics cards updated with real numbers:
   - Total Assessments (with growth % from previous period)
   - Completion Rate (with progress bar)
   - Currently Active (real-time count of IN_PROGRESS)
   - Average Duration (formatted as "X min" or "X hr Y min")
3. Conversion Funnel updated with real data:
   - Started Assessment
   - Completed Questions (completed assessments)
   - Viewed Results (same as completed)
   - Contacted Vendor (from VendorContact)
   - Converted (subscriptions created after assessment)
4. Weekly Activity Trend updated:
   - Real counts per day for last 7 days
   - Smooth line chart with actual data points
5. Assessment Type Distribution pie chart:
   - Real counts by template
   - Top 5 templates shown, rest grouped as "Other"
   - Percentage labels
6. Loading states while fetching data
7. Error handling with retry button
8. Auto-refresh every 5 minutes

**Technical Notes:**
- Use TanStack Query: `useQuery(['admin-analytics-assessments'], ...)`
- Calculate growth: `((current - previous) / previous) * 100`
- Format duration: Use `date-fns` formatDistance
- Funnel data transformation for Recharts Funnel component
- Enable query refetchInterval: 300000 (5 min)

---

### Story 11.3: Vendor Analytics Backend API

**As a** system
**I want** vendor engagement metrics aggregated from interactions
**So that** admins can measure marketplace effectiveness

**Acceptance Criteria:**
1. New endpoint: `GET /v1/admin/analytics/vendors`
2. Returns vendor engagement metrics:
   ```typescript
   {
     totalVendors: number,
     activeVendors: number,     // Has at least 1 match
     totalClicks: number,       // VendorMatch.viewed = true
     uniqueVisitors: number,    // Distinct users who viewed vendors
     totalContacts: number,     // VendorContact count
     conversionRate: number,    // (contacts / clicks) * 100
     avgMatchScore: number,     // Average VendorMatch.matchScore
     topVendors: Array<{
       vendorId: string,
       companyName: string,
       clicks: number,
       contacts: number,
       conversionRate: number,
       trend: 'up' | 'down' | 'stable'
     }>,  // Top 10 by engagement
     clicksByCategory: Array<{
       category: string,
       clicks: number,
       contacts: number
     }>,
     trend: Array<{
       date: string,
       clicks: number,
       contacts: number,
       uniqueVisitors: number
     }>  // Last 30 days
   }
   ```
3. Query parameters:
   - `startDate`, `endDate`: Date range filters
   - `limit`: Max vendors in topVendors (default: 10)
4. Trend calculation:
   - Compare last 7 days to previous 7 days
   - 'up' if > 10% increase, 'down' if > 10% decrease, else 'stable'
5. Response time < 1 second
6. Cache for 5 minutes

**Technical Notes:**
- Extend analytics.service.ts with vendor methods
- Join VendorMatch, Vendor, VendorContact tables
- Use Prisma `distinct` for unique visitor count
- Calculate trends using window functions or multiple queries
- Index VendorMatch(viewed, createdAt), VendorContact(createdAt)

---

### Story 11.4: Connect Real Vendor Metrics to Dashboard

**As an** admin
**I want** to see real vendor engagement data
**So that** I can assess marketplace performance

**Acceptance Criteria:**
1. Vendor metrics cards updated with real data:
   - Total Vendors (count of all vendors)
   - Active Vendors (vendors with matches)
   - Total Clicks (vendor profile views)
   - Contacts Made (inquiry submissions)
2. Top Vendors list updated:
   - Show top 5 vendors by engagement score
   - Display company name, click count, trend indicator
   - Trend arrows (up/down) with color coding
3. Vendor category breakdown:
   - Horizontal bar chart showing clicks by category
   - Top 8 categories displayed
4. Vendor conversion funnel added:
   - Vendors Viewed → Vendors Contacted → RFPs Sent
5. Real-time updates every 5 minutes
6. Click on vendor navigates to `/admin/vendors?id={vendorId}`

**Technical Notes:**
- Fetch: `useQuery(['admin-analytics-vendors'], ...)`
- Engagement score: `(clicks * 1) + (contacts * 5)` for ranking
- Use Recharts BarChart for category breakdown
- Link vendor rows to management page
- Handle empty state: "No vendor activity yet"

---

### Story 11.5: User Activity and Conversion Metrics

**As an** admin
**I want** user registration and conversion analytics
**So that** I can optimize the user journey

**Acceptance Criteria:**
1. New endpoint: `GET /v1/admin/analytics/users`
2. Returns user activity metrics:
   ```typescript
   {
     totalUsers: number,
     activeUsers: number,        // Logged in last 30 days
     newUsers: number,           // Created last 30 days
     verifiedUsers: number,      // emailVerified = true
     retentionRate: number,      // Users active in last 7 days / total users
     conversionFunnel: {
       signups: number,
       emailVerified: number,
       profileCompleted: number,  // Has organization
       assessmentStarted: number,
       assessmentCompleted: number,
       upgradedToPremium: number
     },
     usersByRole: {
       USER: number,
       ADMIN: number,
       VENDOR: number
     },
     signupTrend: Array<{
       date: string,
       signups: number,
       verifications: number
     }>,  // Last 30 days
     engagementSegments: {
       highlyActive: number,     // 5+ assessments
       active: number,            // 2-4 assessments
       inactive: number,          // 0-1 assessments
       churned: number           // No login in 90 days
     }
   }
   ```
3. Profile completion: User has organizationId
4. Retention: % of users who logged in within last 7 days
5. Response time < 1 second
6. Cache for 5 minutes

**Technical Notes:**
- Add user analytics methods to analytics.service.ts
- Join User, Organization, Subscription, Assessment tables
- Use date comparisons: `lastLogin > NOW() - INTERVAL '30 days'`
- Engagement segments use assessment count from relation
- Add indexes: User(lastLogin), User(createdAt), User(emailVerified)

---

### Story 11.6: Date Range Filter and Report Export

**As an** admin
**I want** to filter metrics by date range and export reports
**So that** I can analyze specific time periods

**Acceptance Criteria:**
1. Date range filter component added to dashboard header:
   - Preset options: "Last 7 days", "Last 30 days", "Last 90 days", "This month", "Last month", "Custom"
   - Custom opens date picker (start date + end date)
   - Filter applies to all metrics and charts
2. URL state management:
   - Date range persists in URL: `?from=2024-01-01&to=2024-01-31`
   - Shareable URLs preserve selected range
3. Export functionality:
   - "Export Report" button in dashboard header
   - Dropdown: "Export as PDF" | "Export as Excel"
   - PDF: Summary page with all metrics and charts (screenshot-based)
   - Excel: Multiple sheets (Assessments, Vendors, Users) with raw data
4. Backend endpoint: `GET /v1/admin/analytics/export?format=pdf|excel&from=...&to=...`
5. Excel export includes:
   - Sheet 1: Summary metrics (key numbers)
   - Sheet 2: Assessment details (daily breakdown)
   - Sheet 3: Vendor engagement (vendor list with metrics)
   - Sheet 4: User activity (user segments)
6. PDF export includes:
   - Cover page with date range and logo
   - Metrics snapshot (cards)
   - All charts (rendered as images)
   - Generated timestamp
7. Downloads as `heliolus-admin-report-YYYY-MM-DD.{pdf|xlsx}`

**Technical Notes:**
- Date picker: Use Radix UI Popover + react-day-picker
- URL state: `useSearchParams` hook
- PDF generation: Use `puppeteer` or `jspdf` + html2canvas
- Excel generation: Use `exceljs` library
- Cache exports for 1 hour (keyed by date range)
- Add queue for export jobs if needed

---

### Story 11.7: Real-time Activity Feed and Detailed Drill-Downs

**As an** admin
**I want** to see live activity and drill into specific metrics
**So that** I can monitor platform in real-time and investigate issues

**Acceptance Criteria:**
1. New "Activity Feed" card added to dashboard:
   - Shows last 20 platform events in real-time
   - Event types: User Registered, Assessment Started, Assessment Completed, Vendor Contacted, Subscription Created
   - Each event shows: Icon, Event type, User (name/email), Timestamp (relative)
   - Auto-updates every 30 seconds
2. Backend endpoint: `GET /v1/admin/analytics/activity-feed?limit=20`
3. Clickable metrics for drill-down:
   - Click "Total Assessments" → Opens assessment list filtered by date range
   - Click "Completion Rate" → Opens assessment list filtered by status = COMPLETED
   - Click vendor in "Top Vendors" → Opens vendor details page
   - Click "Active Users" → Opens user list filtered by recent activity
4. Drill-down modal for chart data points:
   - Click bar in trend chart → Shows detailed breakdown for that day
   - Click pie slice in distribution → Shows assessments of that template type
   - Modal shows data table with export option
5. Performance indicators:
   - Green/yellow/red status dots for system health
   - Response time monitoring (API latency)
   - Database connection status
6. Activity feed filters:
   - Filter by event type (dropdown multi-select)
   - Search by user email
   - Toggle auto-refresh on/off

**Technical Notes:**
- Activity feed: Query AuditLog + recent records from each table
- Use WebSockets or polling (useQuery with short refetchInterval: 30000)
- Drill-down: Pass filters via URL params to target pages
- Modal uses Radix UI Dialog with data table
- Health indicators: Ping backend /health endpoint
- Store auto-refresh preference in localStorage

---

## Compatibility Requirements

- [x] Existing dashboard UI layout preserved
- [x] All existing charts remain (just data source changes)
- [x] No breaking changes to admin routes
- [x] Dashboard works with 100,000+ assessments (performance tested)
- [x] Mobile-responsive design maintained

---

## Risk Mitigation

**Primary Risk:** Heavy aggregation queries could slow down admin dashboard

**Mitigation:**
- Implement query result caching (5-minute TTL)
- Use database indexes on filtered/grouped columns
- Limit date ranges to max 1 year
- Add query timeout (10 seconds)
- Use read replicas for analytics if needed

**Secondary Risk:** Export generation could timeout for large datasets

**Mitigation:**
- Limit exports to 10,000 rows per sheet
- Add job queue for large exports (background processing)
- Provide download link via email for completed exports
- Timeout after 30 seconds with partial results

**Rollback Plan:**
- Keep mock data as fallback (feature flag)
- If real API fails, show cached data + warning banner
- Export failures show error message with retry option

---

## Definition of Done

- [ ] All dashboard metrics display real data from database
- [ ] Assessment analytics API returns accurate aggregations
- [ ] Vendor engagement metrics track actual interactions
- [ ] User conversion funnel reflects real user journey
- [ ] Date range filtering works across all metrics
- [ ] Export to PDF and Excel generates valid reports
- [ ] Activity feed shows real-time platform events
- [ ] Drill-down navigation works for all clickable metrics
- [ ] Dashboard loads in < 2 seconds with 100K+ assessments
- [ ] No mock data remains in dashboard code
- [ ] Metrics auto-refresh every 5 minutes
- [ ] All charts and visualizations render correctly
