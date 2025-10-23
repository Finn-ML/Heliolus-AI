# Feature Specification: Heliolus Compliance Assessment Platform

**Feature Branch**: `main` (using existing branch for full platform spec)  
**Created**: 2025-09-09  
**Status**: Draft  
**Input**: Full platform integration and build specification for Heliolus SaaS

## Execution Flow (main)

```
1. User Registration & Authentication
   → Signup with business email validation
   → Email verification required
   → Block public domains and restricted locations
2. Business Profile Setup
   → Company details and website submission
   → Document upload (policies, reports)
   → AI parsing and gap identification
3. Risk Assessment Flow
   → Template selection (Financial Crime/Trade Compliance)
   → AI-powered assessment against structured criteria
   → Risk categorization (Critical/Medium/Low)
4. Gap Analysis & Reporting
   → Generate comprehensive risk report
   → Create strategy matrix with cost indicators
   → Enable report download for paid users
5. Vendor Marketplace Integration
   → Match gaps to vendor solutions
   → Browse and filter vendor listings
   → Compare up to 4 vendors simultaneously
6. Subscription & Monetization
   → Process payments via Stripe
   → Manage credit system for assessments
   → Differentiate free vs paid features
7. Admin Management
   → Control users, vendors, templates
   → Monitor analytics and engagement
   → Manage subscriptions and credits
8. Return: SUCCESS (platform operational)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

A Compliance Officer at a mid-sized financial institution needs to assess their organization's compliance posture to identify technology gaps and find suitable vendor solutions. They sign up, complete their business profile with company documents, run a financial crime compliance assessment, receive a detailed gap analysis report, and connect with matching vendors from the marketplace.

### Acceptance Scenarios

#### Authentication & Onboarding

1. **Given** a new user with business email, **When** they complete signup with organization details, **Then** system sends verification email and blocks access until verified
2. **Given** a user attempting signup with Gmail/Hotmail, **When** they submit the form, **Then** system rejects registration with appropriate message
3. **Given** a user from restricted location (Iran/Russia), **When** they attempt registration, **Then** system blocks signup

#### Business Profile & Assessment

4. **Given** a verified user with company website, **When** they submit website URL and documents, **Then** AI parses content and pre-populates profile fields with gap highlights
5. **Given** a user with completed profile, **When** they select Financial Crime Compliance template, **Then** system runs AI assessment and generates risk categorization
6. **Given** assessment completion, **When** user views results, **Then** system displays gap analysis with Critical/Medium/Low risk classifications

#### Marketplace & Vendor Matching

7. **Given** completed gap analysis, **When** user requests vendor matches, **Then** system recommends relevant solutions from marketplace
8. **Given** marketplace browsing, **When** user selects up to 4 vendors, **Then** system enables side-by-side comparison
9. **Given** paid user status, **When** viewing vendor details, **Then** system enables contact forms and RFP submission

#### Free vs Paid Access

10. **Given** free user with completed assessment, **When** viewing detailed report, **Then** system shows overview only with blurred details
11. **Given** paid user with Premium subscription, **When** accessing reports, **Then** system allows full view and PDF download
12. **Given** free user attempting vendor contact, **When** clicking contact button, **Then** system prompts for subscription upgrade

### Edge Cases

- What happens when AI cannot parse uploaded documents due to poor quality or unsupported format?
- How does system handle simultaneous assessments from same organization?
- What occurs when vendor marketplace has no matches for identified gaps?
- How does platform manage credit depletion during assessment?
- What happens when Stripe payment fails during subscription renewal?
- How does system handle user attempting to upload malicious files?

## Requirements _(mandatory)_

### Functional Requirements

#### User Management & Authentication

- **FR-001**: System MUST validate business email addresses and reject public domains (Gmail, Hotmail, etc.)
- **FR-002**: System MUST block user registration from restricted geographic locations (Iran, Russia)
- **FR-003**: System MUST require email verification before granting platform access
- **FR-004**: System MUST provide password reset functionality via email
- **FR-005**: Users MUST accept Terms of Service and Privacy Policy during registration
- **FR-006**: System MUST maintain user profile with First Name, Last Name, Organization Name, Business Email

#### Business Profile & Document Processing

- **FR-007**: System MUST allow users to submit company name and website URL
- **FR-008**: System MUST support document uploads for policies, annual reports, and compliance documentation
- **FR-009**: AI MUST parse website and documents to auto-populate profile fields
- **FR-010**: System MUST highlight compliance gaps identified during parsing
- **FR-011**: Users MUST be able to manually override AI-populated information

#### Risk Assessment & Templates

- **FR-012**: System MUST provide assessment templates for Financial Crime Compliance and Trade Compliance
- **FR-013**: AI MUST evaluate user profile against structured template criteria
- **FR-014**: System MUST assess Geographic Risk, Transaction Risk, and Governance factors
- **FR-015**: System MUST categorize identified risks as Critical, Medium, or Low priority
- **FR-016**: Each assessment MUST consume credits from user's balance

#### Reporting & Gap Analysis

- **FR-017**: System MUST generate comprehensive risk assessment reports
- **FR-018**: System MUST produce strategy matrix with focus areas and cost indicators
- **FR-019**: Paid users MUST be able to download reports in PDF format
- **FR-020**: Free users MUST see high-level overview with obscured detailed content

#### Vendor Marketplace

- **FR-021**: System MUST match assessment gaps to relevant vendor solutions
- **FR-022**: Users MUST be able to browse and filter vendor listings by category
- **FR-023**: System MUST support comparison of up to 4 vendors simultaneously
- **FR-024**: System MUST provide trackable vendor contact forms for paid users
- **FR-025**: Free users MUST see limited vendor details with disabled contact features

#### Subscription & Payment

- **FR-026**: System MUST integrate with Stripe for payment processing
- **FR-027**: System MUST manage three subscription tiers: Free, Premium (€599), and Enterprise
- **FR-028**: System MUST allocate credits upon signup and subscription purchase
- **FR-029**: Free tier MUST provide 1 limited view-only report
- **FR-030**: Premium tier MUST include full access, downloads, and strategy matrix

#### Admin Panel

- **FR-031**: Admins MUST be able to view, search, edit, and delete user accounts
- **FR-032**: Admins MUST manage vendor profiles including adding, editing, and deletion
- **FR-033**: System MUST provide analytics dashboards for user engagement and vendor contacts
- **FR-034**: Admins MUST manage subscription plans, pricing, and user credit balances
- **FR-035**: Admins MUST create and edit risk assessment templates with sections and questions
- **FR-036**: System MUST track assessment metrics and revenue data

#### Platform Requirements

- **FR-037**: Application MUST be responsive across desktop, tablet, and mobile devices
- **FR-038**: UI MUST strictly adhere to existing design system including fonts, colors, and components
- **FR-039**: System MUST NOT introduce new design elements outside established patterns
- **FR-040**: Platform MUST maintain data security for sensitive compliance documentation

### Key Entities

- **User**: Represents individual platform users with authentication credentials, profile information, subscription status, and credit balance
- **Organization**: Company entity with profile data, website, uploaded documents, and compliance assessment history
- **Assessment**: Risk evaluation instance containing template selection, AI analysis results, gap identification, and risk scores
- **Vendor**: Marketplace solution provider with company details, solution categories, pricing information, and matching criteria
- **Subscription**: User payment plan with tier level, credit allocation, feature access, and billing cycle
- **Template**: Structured assessment framework with sections, questions, AI prompts, and scoring criteria
- **Report**: Generated output from assessment containing risk analysis, gap summary, strategy matrix, and recommendations
- **Credit**: Consumable unit for running assessments, allocated by subscription tier

---

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

_Updated during specification creation_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities addressed
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Additional Context & Assumptions

### Security & Compliance

- Platform handles sensitive financial and compliance data requiring appropriate security measures
- Geographic restrictions align with international trade and sanctions regulations
- Document processing must maintain confidentiality and data privacy standards

### User Experience

- AI-powered features provide value through automation while allowing manual oversight
- Free tier serves as effective conversion funnel to paid subscriptions
- Vendor marketplace creates value for both buyers and solution providers

### Business Model

- Credit system enables flexible usage-based pricing
- Three-tier subscription model addresses different market segments
- Enterprise tier supports custom requirements and invoicing

### Future Considerations (Phase 3)

- Consultant role for third-party compliance advisors
- Enterprise role with expanded team management features
- Additional assessment templates for emerging compliance areas
- Enhanced AI capabilities for predictive risk analysis
