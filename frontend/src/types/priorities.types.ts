/**
 * Types for Assessment Priorities Questionnaire
 * Story 1.14: Priorities Questionnaire UI
 */

// Step 1: Organizational Context
// Note: companySize, annualRevenue, and complianceTeamSize are pulled from business profile
export interface OrganizationalContextData {
  companySize?: string; // From business profile
  annualRevenue?: string; // From business profile
  complianceTeamSize?: string; // From business profile
  jurisdictions: string[];
  existingSystems: string[];
}

// Step 2: Goals and Timeline
export interface GoalsTimelineData {
  primaryGoal: string;
  implementationUrgency: number; // 1-4 scale
}

// Step 3: Use Case Prioritization
export interface UseCasePrioritizationData {
  prioritizedUseCases: {
    category: string;
    rank: number;
  }[];
}

// Step 4: Solution Requirements
export interface SolutionRequirementsData {
  budgetRange: string;
  deploymentPreference: string;
  mustHaveFeatures: string[];
  criticalIntegrations: string[];
}

// Step 5: Vendor Preferences
export interface VendorPreferencesData {
  vendorMaturity: string;
  geographicRequirements: string;
  supportModel: string;
}

// Step 6: Decision Factor Ranking
export interface DecisionFactorRankingData {
  decisionFactorRanking: {
    factor: string;
    rank: number;
  }[];
}

// Complete Priorities Data
export interface PrioritiesData {
  step1?: OrganizationalContextData;
  step2?: GoalsTimelineData;
  step3?: UseCasePrioritizationData;
  step4?: SolutionRequirementsData;
  step5?: VendorPreferencesData;
  step6?: DecisionFactorRankingData;
}

// localStorage Draft
export interface PrioritiesDraft {
  assessmentId: string;
  currentStep: number;
  data: PrioritiesData;
  lastSaved: string; // ISO timestamp
}

// API Payload (flattened structure for backend)
export interface PrioritiesPayload {
  // Step 1 - Note: company size, revenue, and team size come from business profile
  companySize?: string; // From business profile
  annualRevenue?: string; // From business profile
  complianceTeamSize?: string; // From business profile
  jurisdictions: string[];
  existingSystems: string[];

  // Step 2
  primaryGoal: string;
  implementationUrgency: number;

  // Step 3
  prioritizedUseCases: any; // JSON field

  // Step 4
  budgetRange: string;
  deploymentPreference: string;
  mustHaveFeatures: string[];
  criticalIntegrations: string[];

  // Step 5
  vendorMaturity: string;
  geographicRequirements: string;
  supportModel: string;

  // Step 6
  decisionFactorRanking: any; // JSON field
}

// Options for dropdowns
export const COMPANY_SIZES = [
  { value: 'STARTUP', label: '1-50 employees (Startup)' },
  { value: 'SMB', label: '51-250 employees (SMB)' },
  { value: 'MIDMARKET', label: '251-1000 employees (Mid-market)' },
  { value: 'ENTERPRISE', label: '1000+ employees (Enterprise)' },
];

export const ANNUAL_REVENUES = [
  { value: 'UNDER_1M', label: 'Under €1M' },
  { value: 'FROM_1M_10M', label: '€1M - €10M' },
  { value: 'FROM_10M_100M', label: '€10M - €100M' },
  { value: 'OVER_100M', label: 'Over €100M' },
];

export const COMPLIANCE_TEAM_SIZES = [
  { value: 'NONE', label: 'No dedicated team' },
  { value: 'ONE_TWO', label: '1-2 people' },
  { value: 'THREE_TEN', label: '3-10 people' },
  { value: 'OVER_TEN', label: '10+ people' },
];

export const JURISDICTIONS = [
  { value: 'FINCEN', label: 'FinCEN (US)' },
  { value: 'FCA', label: 'FCA (UK)' },
  { value: 'MAS', label: 'MAS (Singapore)' },
  { value: 'BaFin', label: 'BaFin (Germany)' },
  { value: 'APRA', label: 'APRA (Australia)' },
  { value: 'EBA', label: 'EBA (EU)' },
  { value: 'OSFI', label: 'OSFI (Canada)' },
  { value: 'OTHER', label: 'Other' },
];

export const EXISTING_SYSTEMS = [
  { value: 'ACTIMIZE', label: 'Actimize' },
  { value: 'FICO', label: 'FICO Tonbeller' },
  { value: 'SAS', label: 'SAS AML' },
  { value: 'ORACLE', label: 'Oracle FLEXCUBE' },
  { value: 'FISERV', label: 'Fiserv' },
  { value: 'TEMENOS', label: 'Temenos' },
  { value: 'WORLDCHECK', label: 'World-Check' },
  { value: 'COMPLYADVANTAGE', label: 'ComplyAdvantage' },
  { value: 'REFINITIV', label: 'Refinitiv' },
  { value: 'OTHER', label: 'Other/Custom' },
  { value: 'NONE', label: 'None' },
];

export const PRIMARY_GOALS = [
  {
    value: 'REGULATORY_COMPLIANCE',
    label: 'Achieve Regulatory Compliance',
    description: 'Meet regulatory requirements and pass audits',
  },
  {
    value: 'RISK_REDUCTION',
    label: 'Reduce Financial Crime Risk',
    description: 'Minimize exposure to AML/fraud risks',
  },
  {
    value: 'OPERATIONAL_EFFICIENCY',
    label: 'Improve Operational Efficiency',
    description: 'Streamline compliance processes and reduce manual work',
  },
  {
    value: 'TECHNOLOGY_MODERNIZATION',
    label: 'Modernize Technology Stack',
    description: 'Upgrade legacy systems with modern solutions',
  },
  {
    value: 'COST_REDUCTION',
    label: 'Reduce Compliance Costs',
    description: 'Lower operational expenses while maintaining compliance',
  },
  {
    value: 'SCALABILITY',
    label: 'Enable Business Scalability',
    description: 'Build compliance infrastructure for growth',
  },
];

export const IMPLEMENTATION_URGENCY_LABELS = [
  'Immediate (0-6 months)',
  'Planned (6-12 months)',
  'Strategic (12-24 months)',
  'Long-term (24+ months)',
];

export const BUDGET_RANGES = [
  { value: 'UNDER_10K', label: 'Under €10K' },
  { value: 'RANGE_10K_50K', label: '€10K - €50K' },
  { value: 'RANGE_50K_100K', label: '€50K - €100K' },
  { value: 'RANGE_100K_250K', label: '€100K - €250K' },
  { value: 'OVER_250K', label: 'Over €250K' },
];

export const DEPLOYMENT_PREFERENCES = [
  { value: 'CLOUD', label: 'Cloud-based', description: 'SaaS hosted solution' },
  { value: 'ON_PREMISE', label: 'On-premise', description: 'Self-hosted in our data center' },
  { value: 'HYBRID', label: 'Hybrid', description: 'Combination of cloud and on-premise' },
  { value: 'FLEXIBLE', label: 'Flexible', description: 'Open to any deployment model' },
];

export const MUST_HAVE_FEATURES = [
  { value: 'REAL_TIME_MONITORING', label: 'Real-time transaction monitoring' },
  { value: 'AI_ML_DETECTION', label: 'AI/ML-based detection' },
  { value: 'CASE_MANAGEMENT', label: 'Case management workflow' },
  { value: 'REGULATORY_REPORTING', label: 'Automated regulatory reporting' },
  { value: 'API_INTEGRATION', label: 'API integration capabilities' },
  { value: 'MULTI_JURISDICTION', label: 'Multi-jurisdiction support' },
  { value: 'CUSTOM_RULES', label: 'Customizable rules engine' },
  { value: 'AUDIT_TRAIL', label: 'Complete audit trail' },
  { value: 'MOBILE_ACCESS', label: 'Mobile access' },
  { value: 'DASHBOARD_ANALYTICS', label: 'Analytics dashboard' },
];

export const VENDOR_MATURITY_OPTIONS = [
  {
    value: 'ENTERPRISE',
    label: 'Established Enterprise',
    description: 'Proven track record, extensive features, enterprise support',
  },
  {
    value: 'MID_MARKET',
    label: 'Mid-Market',
    description: 'Modern technology, growing customer base, competitive pricing',
  },
  {
    value: 'STARTUP',
    label: 'Innovative Startup',
    description: 'Cutting-edge features, agile approach, lower cost',
  },
  {
    value: 'ANY',
    label: 'No Preference',
    description: 'Open to vendors of any size',
  },
];

export const GEOGRAPHIC_REQUIREMENTS = [
  {
    value: 'LOCAL',
    label: 'Local presence required',
    description: 'Must have local offices and support',
  },
  {
    value: 'REGIONAL',
    label: 'Regional coverage preferred',
    description: 'Coverage in our operating region',
  },
  {
    value: 'GLOBAL',
    label: 'Global coverage needed',
    description: 'Worldwide support and compliance expertise',
  },
  {
    value: 'NO_PREFERENCE',
    label: 'No specific requirement',
    description: 'Remote support is acceptable',
  },
];

export const SUPPORT_MODELS = [
  {
    value: 'SELF_SERVICE',
    label: 'Self-service',
    description: 'Documentation and community support',
  },
  {
    value: 'STANDARD',
    label: 'Standard support',
    description: 'Email/ticket support during business hours',
  },
  {
    value: 'PREMIUM',
    label: 'Premium support',
    description: '24/7 support with dedicated account manager',
  },
];

export const DECISION_FACTORS = [
  {
    id: '1',
    factor: 'Total Cost of Ownership',
    description: 'Overall cost including licensing, implementation, and maintenance',
  },
  { id: '2', factor: 'Implementation Speed', description: 'Time to deploy and achieve value' },
  {
    id: '3',
    factor: 'Feature Completeness',
    description: 'Breadth and depth of compliance features',
  },
  {
    id: '4',
    factor: 'Vendor Reputation & Stability',
    description: 'Track record, financial stability, customer satisfaction',
  },
  {
    id: '5',
    factor: 'Integration Capabilities',
    description: 'Ease of integration with existing systems',
  },
  {
    id: '6',
    factor: 'Scalability & Future-readiness',
    description: 'Ability to grow with our business needs',
  },
];
