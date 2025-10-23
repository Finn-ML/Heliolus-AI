/**
 * ENHANCED Financial Crime Compliance Template v3.0
 * Comprehensive industry-standard assessment covering all regulatory requirements
 *
 * Coverage: 11 core sections + 1 optional AI module
 * Questions: 75 core + 10 optional AI = 85 total
 * Duration: 75-90 minutes
 *
 * Improvements over v2.0:
 * - Added Customer Due Diligence section (8 questions)
 * - Added Adverse Media Screening section (6 questions)
 * - Added Fraud & Identity Management section (6 questions)
 * - Added Data & Technology Infrastructure section (8 questions)
 * - Added AI Readiness module (10 questions - optional)
 * - Enhanced Sanctions Screening (+6 questions)
 * - Enhanced Transaction Monitoring (+3 questions)
 * - Enhanced Training & Culture (+4 questions)
 * - Enhanced Governance (+3 questions)
 * - Enhanced Risk Assessment (+4 questions)
 * - Enhanced Monitoring & Improvement (+2 questions)
 */

import { PrismaClient, TemplateCategory, QuestionType } from '../src/generated/prisma';

const prisma = new PrismaClient();

export interface TemplateData {
  name: string;
  slug: string;
  category: TemplateCategory;
  description: string;
  version: string;
  estimatedMinutes: number;
  instructions: string;
  isActive: boolean;
  tags: string[];
  sections: SectionData[];
}

export interface SectionData {
  title: string;
  description?: string;
  weight: number;  // For weighted scoring (must sum to 1.0 across all sections)
  regulatoryPriority?: string;  // FATF, FFIEC, EU AMLD reference
  order: number;
  isRequired: boolean;
  instructions?: string;
  questions: QuestionData[];
}

export interface QuestionData {
  question: string;
  type: QuestionType;
  weight: number;  // For weighted scoring within section (will be normalized)
  isFoundational: boolean;  // Critical regulatory requirement
  order: number;
  isRequired: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  aiPromptHint?: string;
  scoringRules: any;
  validationRules?: any;
  tags: string[];
}

export const FINANCIAL_CRIME_ENHANCED_TEMPLATE: TemplateData = {
  name: 'Financial Crime Compliance Assessment (Enhanced)',
  slug: 'financial-crime-compliance-v3',
  category: TemplateCategory.FINANCIAL_CRIME,
  description: 'Comprehensive enterprise-grade assessment covering AML/CFT, KYC, sanctions, transaction monitoring, fraud prevention, data governance, and AI readiness. Aligned with FATF, EU AMLD, OFAC, FCA, FINMA, and MAS requirements.',
  version: '3.0',
  estimatedMinutes: 90,
  instructions: `
This enhanced assessment evaluates your organization's financial crime compliance framework across 11 critical areas:

1. **Geographic Risk Assessment**: Understanding exposure to high-risk jurisdictions and sanctions regimes
2. **Governance & Regulatory Readiness**: Organizational structure, oversight, and regulatory change management
3. **Risk Assessment Framework**: Enterprise-wide risk assessment methodology and emerging risk management
4. **Customer Due Diligence (KYC/CDD/EDD)**: Comprehensive customer onboarding, verification, and monitoring
5. **Adverse Media & Reputational Risk**: Screening procedures and reputational due diligence
6. **Sanctions Screening**: Real-time screening systems, list management, and violation response
7. **Transaction Monitoring & Reporting**: AML systems, alert management, and SAR/STR filing
8. **Fraud & Identity Management**: Fraud prevention integration and identity verification controls
9. **Data & Technology Infrastructure**: System integration, data quality, and privacy compliance
10. **Training, Culture & Awareness**: Role-based training and ethical culture development
11. **Monitoring, Audit & Continuous Improvement**: Performance measurement and program effectiveness

**Optional Add-On:**
12. **AI Readiness & Responsible Use**: AI governance, model validation, and EU AI Act compliance

**Instructions:**
- Answer all questions honestly and thoroughly
- Provide specific examples where requested
- Upload supporting documentation when available
- If unsure about a question, provide your best assessment and note any uncertainties

Your responses will be analyzed using AI to identify gaps, assess risks, and generate tailored recommendations.
  `,
  isActive: true,
  tags: ['aml', 'kyc', 'sanctions', 'financial-crime', 'compliance', 'enhanced', 'enterprise', 'fraud', 'ai-readiness'],
  sections: [
    {
      title: 'Geographic Risk Assessment',
      description: 'Evaluation of exposure to high-risk jurisdictions and geographic compliance considerations',
      weight: 0.0285,  // 2.85% - Risk factor, not standalone control
      regulatoryPriority: 'FATF Risk Factor Assessment',
      order: 1,
      isRequired: true,
      instructions: 'Focus on your organization\'s geographic footprint and associated compliance risks',
      questions: [
        {
          question: 'What countries/jurisdictions does your organization operate in or serve customers from?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 1,
          isRequired: true,
          options: [
            'United States', 'United Kingdom', 'European Union (specify countries)',
            'Canada', 'Australia', 'Japan', 'Singapore', 'Hong Kong',
            'Switzerland', 'Middle East (specify countries)', 'Latin America (specify countries)',
            'Africa (specify countries)', 'Russia/CIS', 'China', 'Other (specify)'
          ],
          helpText: 'Select all jurisdictions where you have operations, customers, or business activities',
          aiPromptHint: 'Analyze the geographic risk profile based on selected jurisdictions. Consider FATF ratings, sanctions regimes, regulatory complexity, corruption indices, and regional stability. Flag high-risk jurisdictions and assess overall geographic risk exposure.',
          scoringRules: {
            scale: 5,
            criteria: {
              5: 'Operations limited to low-risk jurisdictions with strong AML frameworks (FATF white list)',
              4: 'Primarily low-risk jurisdictions with minimal high-risk exposure',
              3: 'Mixed risk profile with moderate high-risk jurisdiction exposure',
              2: 'Significant exposure to high-risk or non-cooperative jurisdictions',
              1: 'Heavy exposure to sanctioned or high-risk jurisdictions without adequate controls'
            },
            highRiskFlags: ['Russia/CIS', 'Iran', 'North Korea', 'Syria', 'Venezuela', 'Myanmar']
          },
          tags: ['geographic-risk', 'jurisdiction', 'fatf', 'sanctions']
        },
        {
          question: 'How does your organization assess and monitor country/jurisdiction risk?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: true,
          placeholder: 'Describe your country risk assessment methodology, frequency of updates, risk rating systems, data sources (FATF, Transparency International, Basel AML Index), and integration with business decisions...',
          helpText: 'Explain your process for evaluating geographic risks including data sources, update frequency, and risk categorization',
          aiPromptHint: 'Evaluate the sophistication and comprehensiveness of the country risk assessment process. Look for use of recognized risk sources (FATF, Transparency International, Basel AML Index, Corruption Perceptions Index), regular updates (at least annually), risk-based approach with quantitative/qualitative factors, integration with customer risk profiling, and impact on business decisions (customer acceptance, EDD triggers). Award higher scores for automated monitoring and multi-source data integration.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['fatf', 'risk assessment', 'regular updates', 'risk matrix', 'due diligence', 'annual review', 'basel index', 'transparency international', 'automated', 'data sources', 'integration'],
              negative: ['no process', 'informal', 'outdated', 'manual only', 'ad hoc', 'infrequent']
            }
          },
          tags: ['risk-assessment', 'monitoring', 'methodology', 'fatf']
        },
        {
          question: 'Do you have enhanced due diligence procedures for high-risk jurisdictions?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - EDD required by FATF R.12
          isFoundational: true,
          order: 3,
          isRequired: true,
          options: [
            'Yes - comprehensive EDD with senior approval and enhanced monitoring',
            'Yes - documented EDD procedures with additional verification',
            'Yes - basic EDD procedures',
            'Partially implemented - under development',
            'No procedures in place'
          ],
          helpText: 'Enhanced Due Diligence (EDD) should include additional verification, source of wealth/funds, ongoing monitoring, and senior management approval',
          aiPromptHint: 'Assess the adequacy of enhanced due diligence procedures for high-risk jurisdictions. Look for: (1) clear EDD triggers based on jurisdiction risk, (2) documented procedures requiring additional information (source of wealth, business purpose, beneficial ownership), (3) enhanced ongoing monitoring frequency, (4) senior management or MLRO approval requirements, (5) transaction restrictions or limits. Comprehensive programs should have all elements integrated into the customer risk rating system.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive EDD with senior approval and enhanced monitoring': 5,
              'Yes - documented EDD procedures with additional verification': 4,
              'Yes - basic EDD procedures': 3,
              'Partially implemented - under development': 2,
              'No procedures in place': 1
            }
          },
          tags: ['edd', 'high-risk', 'procedures', 'due-diligence']
        },
        {
          question: 'How do you stay current with sanctions regime changes and updates?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          placeholder: 'Describe your sanctions monitoring process, data sources (OFAC, EU, UN, FINMA, MAS), update frequency, automated list updates, staff notification procedures, and training on changes...',
          helpText: 'Explain how you monitor for sanctions updates from OFAC, EU, UN, and other relevant authorities',
          aiPromptHint: 'Evaluate the sanctions monitoring process for completeness and timeliness. Look for: (1) monitoring of multiple authoritative sources (OFAC, EU, UN, UK, domestic), (2) real-time or daily automated updates to screening systems, (3) formal change management process, (4) staff notifications and training on significant changes, (5) retrospective screening of existing customers when lists are updated, (6) documentation of update procedures. Real-time automated updates with comprehensive source coverage and retroactive screening indicate mature programs.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['real-time', 'automated', 'multiple sources', 'ofac', 'eu sanctions', 'un', 'training', 'notification', 'retroactive', 'daily updates'],
              negative: ['manual', 'infrequent', 'single source', 'delays', 'weekly', 'no retroactive']
            }
          },
          tags: ['sanctions', 'monitoring', 'updates', 'ofac', 'regulatory-compliance']
        },
        {
          question: 'What is your organization\'s policy for conducting business with high-risk jurisdictions?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Prohibited - no business with high-risk jurisdictions',
            'Permitted with Board/C-suite approval only',
            'Permitted with MLRO/senior compliance approval',
            'Permitted with EDD and enhanced monitoring',
            'No specific restrictions - treated like other jurisdictions'
          ],
          helpText: 'Policy should reflect risk appetite and regulatory expectations',
          aiPromptHint: 'Assess the conservativeness and appropriateness of high-risk jurisdiction policy. More restrictive policies reduce risk but may limit business opportunities. Evaluate if policy is aligned with regulatory expectations, organizational risk appetite, and control capabilities. Strongest programs have clear escalation to senior management/board for high-risk exposures.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Prohibited - no business with high-risk jurisdictions': 5,
              'Permitted with Board/C-suite approval only': 5,
              'Permitted with MLRO/senior compliance approval': 4,
              'Permitted with EDD and enhanced monitoring': 3,
              'No specific restrictions - treated like other jurisdictions': 1
            }
          },
          tags: ['risk-appetite', 'high-risk', 'policy', 'approval']
        }
      ]
    },
    {
      title: 'Governance & Regulatory Readiness',
      description: 'Assessment of organizational structure, oversight mechanisms, and regulatory change management',
      weight: 0.1425,  // 14.25% - HIGHEST PRIORITY (FATF Pillar 1)
      regulatoryPriority: 'FATF Pillar 1, FFIEC BSA/AML Core, EU AMLD6 Art. 8',
      order: 2,
      isRequired: true,
      instructions: 'Focus on your compliance program governance and regulatory preparedness',
      questions: [
        {
          question: 'Who is your designated Money Laundering Reporting Officer (MLRO) / AML/BSA Officer?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational - FATF R.1 requires designated MLRO
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Dedicated full-time MLRO with direct board access and adequate resources',
            'Dedicated full-time MLRO with management reporting line',
            'Part-time designated officer with AML focus',
            'General compliance officer handling AML among other duties',
            'Senior management member in dual role',
            'External consultant',
            'No designated officer'
          ],
          helpText: 'The MLRO/AML Officer should have appropriate authority, independence, resources, and direct access to senior management and board',
          aiPromptHint: 'Assess the appropriateness and independence of MLRO designation considering organizational size, complexity, transaction volumes, and regulatory requirements. Evaluate: (1) full-time vs part-time dedication, (2) independence from business units, (3) direct reporting access to board/senior management, (4) adequate resources and budget authority, (5) seniority and authority level within organization. Best practice is dedicated full-time MLRO with board access and operational independence.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Dedicated full-time MLRO with direct board access and adequate resources': 5,
              'Dedicated full-time MLRO with management reporting line': 4,
              'Part-time designated officer with AML focus': 3,
              'General compliance officer handling AML among other duties': 2,
              'Senior management member in dual role': 2,
              'External consultant': 1,
              'No designated officer': 1
            }
          },
          tags: ['mlro', 'aml-officer', 'governance', 'responsibility']
        },
        {
          question: 'How often does your board or senior management review financial crime compliance?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational - FATF R.1 requires board oversight
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Monthly with comprehensive MI dashboard',
            'Quarterly with detailed reporting',
            'Semi-annually with trend analysis',
            'Annually with program review',
            'As needed/Ad hoc',
            'Never/No formal review'
          ],
          helpText: 'Regular board oversight is essential for effective AML program governance. Reviews should include KPIs, risk trends, and regulatory developments',
          aiPromptHint: 'Evaluate the frequency and quality of board/senior management oversight. Look for: (1) regular scheduled reviews (minimum quarterly), (2) comprehensive management information including KPIs, alert volumes, SAR statistics, audit findings, (3) trend analysis and forward-looking risk assessment, (4) board challenge and active engagement, (5) documented minutes and action items. Monthly reviews with MI dashboards indicate mature governance; annual or ad hoc reviews suggest governance weakness.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Monthly with comprehensive MI dashboard': 5,
              'Quarterly with detailed reporting': 4,
              'Semi-annually with trend analysis': 3,
              'Annually with program review': 2,
              'As needed/Ad hoc': 1,
              'Never/No formal review': 1
            }
          },
          tags: ['board-oversight', 'governance', 'review-frequency', 'management-information']
        },
        {
          question: 'Is there a formal regulatory change management process?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          placeholder: 'Describe how you monitor for regulatory changes, conduct impact assessments, implement new requirements, assign ownership, track remediation, and document evidence of compliance...',
          helpText: 'Process should include monitoring, impact assessment, implementation planning, and documentation',
          aiPromptHint: 'Assess regulatory change management maturity. Look for: (1) proactive monitoring of regulatory developments (subscriptions, alerts, industry groups), (2) formal impact assessment process, (3) cross-functional working groups for implementation, (4) project management with timelines and accountabilities, (5) board/management escalation of significant changes, (6) documentation and evidence retention, (7) post-implementation validation. Mature processes have dedicated resources and systematic tracking.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['formal process', 'impact assessment', 'monitoring', 'project plan', 'implementation', 'documentation', 'tracking', 'validation', 'working group'],
              negative: ['informal', 'reactive', 'no process', 'ad hoc', 'no tracking']
            }
          },
          tags: ['regulatory-change', 'change-management', 'compliance-process']
        },
        {
          question: 'Are financial crime compliance responsibilities clearly documented in job descriptions and organizational charts?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - detailed documentation with clear escalation lines and RACI matrices',
            'Yes - documented in job descriptions and org charts',
            'Partially documented - some roles unclear',
            'Informal understanding only',
            'No clear documentation'
          ],
          helpText: 'Clear documentation prevents accountability gaps and ensures proper escalation',
          aiPromptHint: 'Evaluate clarity of roles and responsibilities. Look for: (1) documented FCC responsibilities in all relevant job descriptions, (2) organizational charts showing reporting lines and escalation paths, (3) RACI or similar responsibility matrices, (4) clear differentiation between first, second, and third lines of defense, (5) deputy/backup arrangements. Strong governance has comprehensive documentation accessible to all staff.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - detailed documentation with clear escalation lines and RACI matrices': 5,
              'Yes - documented in job descriptions and org charts': 4,
              'Partially documented - some roles unclear': 2,
              'Informal understanding only': 1,
              'No clear documentation': 1
            }
          },
          tags: ['governance', 'responsibilities', 'accountability', 'documentation']
        },
        {
          question: 'What independent oversight mechanisms are in place for financial crime compliance?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Board Risk Committee oversight',
            'Board Audit Committee oversight',
            'Dedicated Compliance Committee',
            'Independent internal audit reviews',
            'External independent auditor reviews',
            'Non-executive director with compliance expertise',
            'Regulatory supervisory reviews',
            'None'
          ],
          helpText: 'Multiple independent oversight layers strengthen governance',
          aiPromptHint: 'Assess the strength of independent oversight. Look for multiple layers of independent review: (1) board-level committee oversight, (2) independent internal audit with reporting to audit committee, (3) external independent reviews or audits, (4) qualified non-executive oversight. More oversight mechanisms generally indicate stronger governance. Flag if "None" is selected as critical governance gap.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '0': 1,
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['oversight', 'governance', 'independent-review', 'audit']
        },
        {
          question: 'Are whistleblowing, conflict of interest, and escalation policies in place and functioning effectively?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - comprehensive policies with training, anonymous hotline, and non-retaliation protection',
            'Yes - documented policies with escalation procedures',
            'Yes - basic policies in place',
            'Policies exist but effectiveness uncertain',
            'Under development',
            'No formal policies'
          ],
          helpText: 'These policies support ethical culture and enable early identification of compliance issues',
          aiPromptHint: 'Evaluate the maturity of ethics and escalation policies. Look for: (1) written policies accessible to all staff, (2) anonymous reporting channels (hotline, web portal), (3) explicit non-retaliation protections, (4) conflict of interest declarations and management, (5) clear escalation paths for suspicious activity, (6) regular training on policies, (7) evidence of policy effectiveness (reports received, investigations conducted, outcomes). Comprehensive programs with independent hotlines and protection mechanisms score highest.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive policies with training, anonymous hotline, and non-retaliation protection': 5,
              'Yes - documented policies with escalation procedures': 4,
              'Yes - basic policies in place': 3,
              'Policies exist but effectiveness uncertain': 2,
              'Under development': 1,
              'No formal policies': 1
            }
          },
          tags: ['whistleblowing', 'ethics', 'escalation', 'culture']
        },
        {
          question: 'How are third-party and group-wide compliance frameworks harmonized across jurisdictions?',
          type: QuestionType.TEXT,
          weight: 1.5,  // Foundational - FATF R.17 requires third-party due diligence
          isFoundational: true,
          order: 7,
          isRequired: true,
          placeholder: 'Describe group-wide compliance policies, local adaptations for regulatory requirements, consistency across subsidiaries/branches, third-party reliance arrangements, and oversight of entities/agents...',
          helpText: 'Include how you manage compliance across different entities, jurisdictions, and third parties',
          aiPromptHint: 'Assess multi-jurisdiction and third-party compliance harmonization. Look for: (1) group-wide minimum standards with local enhancements, (2) centralized policy framework with local procedures, (3) cross-border consistency in risk assessment methodologies, (4) group compliance oversight and reporting, (5) third-party reliance arrangements with due diligence, (6) shared systems or integrated compliance platforms, (7) regular cross-entity reviews and audits. Strong programs have centralized standards with local accountability.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['group-wide', 'harmonized', 'central standards', 'local procedures', 'oversight', 'third-party due diligence', 'integrated', 'consistent'],
              negative: ['fragmented', 'inconsistent', 'no oversight', 'independent', 'siloed']
            }
          },
          tags: ['third-party', 'group-compliance', 'harmonization', 'multi-jurisdiction']
        },
        {
          question: 'Are all policies and procedures up to date and aligned with current regulatory requirements?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - all policies reviewed and updated within last 12 months',
            'Yes - most policies current, some minor updates needed',
            'Partially - some policies outdated or under revision',
            'No - significant updates required',
            'Unsure of policy status'
          ],
          helpText: 'Policies should be reviewed at least annually and updated for regulatory changes',
          aiPromptHint: 'Evaluate policy currency and regulatory alignment. Look for: (1) annual policy review cycle, (2) version control and approval tracking, (3) alignment with latest regulations (FATF 40 Recommendations, EU 6AMLD, local laws), (4) documented review dates, (5) board or senior management approval, (6) staff awareness of current policies. Policies reviewed within 12 months and formally approved indicate strong governance.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - all policies reviewed and updated within last 12 months': 5,
              'Yes - most policies current, some minor updates needed': 4,
              'Partially - some policies outdated or under revision': 2,
              'No - significant updates required': 1,
              'Unsure of policy status': 1
            }
          },
          tags: ['policies', 'regulatory-alignment', 'governance', 'documentation']
        }
      ]
    },
    {
      title: 'Risk Assessment Framework',
      description: 'Evaluation of enterprise-wide risk assessment methodology, emerging risk management, and ERM integration',
      weight: 0.114,  // 11.4% - FATF Pillar 2 (Risk-Based Approach)
      regulatoryPriority: 'FATF Pillar 2, Risk-Based Approach',
      order: 3,
      isRequired: true,
      instructions: 'Focus on your risk assessment methodology and how you identify, assess, and manage financial crime risks',
      questions: [
        {
          question: 'Is an enterprise-wide financial crime risk assessment (EWRA) performed annually?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - FATF requires annual risk assessment
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - comprehensive EWRA with quantitative and qualitative analysis',
            'Yes - annual risk assessment with documented methodology',
            'Yes - basic annual assessment',
            'Periodic but not annual',
            'No formal EWRA'
          ],
          helpText: 'An enterprise-wide risk assessment should be performed at least annually to identify and assess money laundering and terrorist financing risks',
          aiPromptHint: 'Assess the maturity and comprehensiveness of the enterprise-wide risk assessment. Look for: (1) annual or more frequent assessment cycle, (2) documented methodology covering all business lines, products, services, geographies, and customer types, (3) both inherent and residual risk assessment, (4) quantitative data analysis combined with qualitative expert judgment, (5) board and senior management approval, (6) actionable outputs driving control enhancements. Comprehensive programs use mixed methodologies, extensive data analysis, and formal governance approval.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive EWRA with quantitative and qualitative analysis': 5,
              'Yes - annual risk assessment with documented methodology': 4,
              'Yes - basic annual assessment': 3,
              'Periodic but not annual': 2,
              'No formal EWRA': 1
            }
          },
          tags: ['risk-assessment', 'ewra', 'fatf', 'methodology', 'annual']
        },
        {
          question: 'Are inherent and residual risks documented per business line, geography, product, and channel?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: true,
          placeholder: 'Describe your risk categorization methodology, how inherent risks are identified, how control effectiveness is assessed, and how residual risk is calculated for each business dimension...',
          helpText: 'Risk assessment should distinguish between inherent risk (before controls) and residual risk (after controls)',
          aiPromptHint: 'Evaluate the granularity and sophistication of risk assessment. Look for: (1) risk assessment by multiple dimensions (business line, product, geography, customer segment, channel), (2) clear distinction between inherent risk (pre-control) and residual risk (post-control), (3) documented control effectiveness assessment methodology, (4) heat maps or risk matrices showing risk distribution, (5) numerical scoring or risk ratings, (6) periodic updates reflecting control improvements. Strong programs have detailed risk breakdowns across all material business dimensions.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['inherent risk', 'residual risk', 'business line', 'geography', 'product', 'channel', 'control effectiveness', 'documented', 'matrix', 'scoring', 'heat map'],
              negative: ['no documentation', 'high-level only', 'informal', 'no distinction', 'aggregated']
            }
          },
          tags: ['risk-assessment', 'inherent-risk', 'residual-risk', 'methodology']
        },
        {
          question: 'Are risk methodologies quantitative or qualitative, with consistent scoring criteria?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'Quantitative with data-driven scoring and validation',
            'Mixed quantitative and qualitative with consistent criteria',
            'Primarily qualitative with some quantification',
            'Informal qualitative assessment',
            'No consistent methodology'
          ],
          helpText: 'Best practice combines quantitative data analysis with qualitative expert judgment using documented criteria',
          aiPromptHint: 'Assess the rigor and consistency of risk methodology. Look for: (1) quantitative risk scoring using transaction data, customer data, incident data, (2) qualitative assessment incorporating expert judgment and scenario analysis, (3) documented scoring criteria that can be applied consistently, (4) validation of methodology (backtesting, peer review), (5) calibration to ensure risk ratings are meaningful and actionable. Mature programs use hybrid quantitative-qualitative approaches with validation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Quantitative with data-driven scoring and validation': 5,
              'Mixed quantitative and qualitative with consistent criteria': 4,
              'Primarily qualitative with some quantification': 3,
              'Informal qualitative assessment': 2,
              'No consistent methodology': 1
            }
          },
          tags: ['methodology', 'quantitative', 'qualitative', 'scoring', 'criteria']
        },
        {
          question: 'Are risk ratings linked to control testing outcomes or KRIs/KPIs?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          placeholder: 'Describe your KRI/KPI framework, how control testing results feed into risk ratings, how risk ratings are adjusted based on testing, and monitoring/reporting cadence...',
          helpText: 'Risk ratings should be dynamic and updated based on control testing results and key risk indicators',
          aiPromptHint: 'Evaluate the linkage between risk assessment and ongoing monitoring. Look for: (1) defined KRIs and KPIs tracking residual risk levels, (2) control testing program assessing control effectiveness, (3) formal process to update risk ratings when controls fail or KRIs exceed thresholds, (4) regular reporting of KRIs to risk committee/board, (5) closed-loop feedback where testing informs risk ratings and risk ratings drive testing priorities. Strong programs have automated KRI dashboards and systematic risk rating updates.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['kri', 'kpi', 'control testing', 'linked', 'updated', 'dynamic', 'monitoring', 'dashboard', 'threshold', 'feedback loop'],
              negative: ['static', 'no linkage', 'separate', 'infrequent', 'manual', 'no testing']
            }
          },
          tags: ['kri', 'kpi', 'control-testing', 'monitoring', 'linkage']
        },
        {
          question: 'Are emerging risks assessed regularly (virtual assets, AI misuse, sanctions evasion, DeFi, ransomware, trade-based ML)?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Virtual assets and cryptocurrency risks',
            'AI misuse and deepfakes',
            'Sanctions circumvention techniques',
            'Trade-based money laundering',
            'Ransomware and cyber-related financial crime',
            'Decentralized finance (DeFi) risks',
            'New payment methods and technologies',
            'None assessed'
          ],
          helpText: 'Select all emerging risk areas your organization regularly assesses',
          aiPromptHint: 'Assess the organization\'s awareness and assessment of emerging risks. Look for: (1) regular horizon scanning for new threats, (2) assessment of multiple emerging risk areas (not just one or two), (3) documented analysis of exposure to each emerging risk, (4) controls or mitigation strategies for material emerging risks, (5) updates to risk assessment and scenario library. Strong programs actively monitor 5+ emerging risk areas. Flag if "None assessed" is selected.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '0': 1,
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['emerging-risks', 'crypto', 'ai', 'sanctions-evasion', 'defi', 'ransomware', 'tbml']
        },
        {
          question: 'Is there a defined process for identifying new risks from strategic initiatives (new products, markets, channels, partnerships)?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          placeholder: 'Describe your new product approval process, market entry risk assessments, strategic initiative risk reviews, and approval/escalation procedures...',
          helpText: 'New business initiatives should trigger risk assessment before launch',
          aiPromptHint: 'Evaluate the process for identifying and assessing new risks from business changes. Look for: (1) formal new product approval process (NPAP) requiring compliance/risk assessment, (2) market entry risk assessments for new geographies, (3) strategic initiative risk reviews for M&A, partnerships, or major changes, (4) compliance representation in decision-making forums, (5) risk-based approval thresholds (e.g., board approval for high-risk initiatives), (6) post-launch monitoring and validation. Strong programs have mandatory risk assessment gates that can block or modify initiatives.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['formal process', 'new product approval', 'risk assessment', 'pre-launch', 'market entry', 'compliance review', 'escalation', 'mandatory', 'gate'],
              negative: ['no process', 'informal', 'after launch', 'reactive', 'no compliance involvement']
            }
          },
          tags: ['new-products', 'strategic-initiatives', 'risk-identification', 'approval-process']
        },
        {
          question: 'Is FCC risk assessment integrated with enterprise risk management (ERM)?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Fully integrated with ERM framework',
            'Integrated with regular reporting to ERM',
            'Some integration - developing',
            'Separate with limited coordination',
            'No integration'
          ],
          helpText: 'Financial crime compliance risk should be incorporated into enterprise-wide risk management',
          aiPromptHint: 'Assess the integration of FCC risk with broader ERM. Look for: (1) FCC risk included in enterprise risk register, (2) consistent risk taxonomy and rating scales, (3) FCC risk reporting to board risk committee, (4) coordination with other risk functions (credit, operational, cyber, compliance), (5) FCC risks considered in risk appetite framework, (6) cross-risk scenario analysis. Strong programs have full ERM integration with FCC risks visible at board level and influencing strategic decisions.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Fully integrated with ERM framework': 5,
              'Integrated with regular reporting to ERM': 4,
              'Some integration - developing': 3,
              'Separate with limited coordination': 2,
              'No integration': 1
            }
          },
          tags: ['erm', 'integration', 'risk-management', 'enterprise-risk']
        }
      ]
    },
    {
      title: 'Customer Due Diligence (CDD/KYC/EDD)',
      description: 'Comprehensive assessment of customer onboarding, verification, beneficial ownership, and ongoing monitoring',
      weight: 0.114,  // 11.4% - FATF R.10 (Customer Due Diligence)
      regulatoryPriority: 'FATF R.10, KYC/CDD/EDD Requirements',
      order: 4,
      isRequired: true,
      instructions: 'Focus on your customer due diligence processes including onboarding, verification, and ongoing monitoring',
      questions: [
        {
          question: 'What customer onboarding standards do you follow?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - KYC is core regulatory requirement
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Fully standardized across all customer types with comprehensive risk-based procedures',
            'Standardized with documented risk-based variations',
            'Partially standardized - some variations by business line',
            'Different standards by business line',
            'Ad hoc approach by customer type'
          ],
          helpText: 'Customer onboarding should follow consistent, documented standards with risk-based variations',
          aiPromptHint: 'Assess the standardization and comprehensiveness of customer onboarding. Look for: (1) documented policies and procedures covering all customer types, (2) risk-based approach with clear CDD, EDD, and SDD criteria, (3) consistent application across business lines and geographies, (4) defined information requirements (identity, address, source of wealth/funds, business purpose), (5) verification standards and documentation requirements, (6) senior management approval requirements for high-risk customers. Fully standardized risk-based programs indicate maturity.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Fully standardized across all customer types with comprehensive risk-based procedures': 5,
              'Standardized with documented risk-based variations': 4,
              'Partially standardized - some variations by business line': 3,
              'Different standards by business line': 2,
              'Ad hoc approach by customer type': 1
            }
          },
          tags: ['kyc', 'onboarding', 'cdd', 'standards', 'risk-based']
        },
        {
          question: 'How do you verify beneficial ownership (UBO)?',
          type: QuestionType.TEXT,
          weight: 2.0,  // Foundational - FATF R.24 requires UBO verification (25% threshold)
          isFoundational: true,
          order: 2,
          isRequired: true,
          placeholder: 'Describe data sources (public registries, databases, customer documentation), verification thresholds (typically 25% ownership), documentation requirements, and handling of complex structures (trusts, nominees, chains)...',
          helpText: 'Beneficial ownership verification is a critical regulatory requirement under FATF Recommendation 24',
          aiPromptHint: 'Evaluate the rigor and comprehensiveness of UBO verification. Look for: (1) clear 25% ownership/control threshold (or lower), (2) verification using multiple sources (public registries, commercial databases, customer certifications, legal opinions), (3) documentation standards and evidence collection, (4) procedures for complex structures (trusts, foundations, nominee arrangements, multi-tier ownership), (5) identification of ultimate natural persons, (6) understanding of control mechanisms beyond ownership, (7) verification timeframes (at onboarding and refresh). Strong programs use multiple data sources and can penetrate complex structures.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['25%', 'registry', 'verification', 'documentation', 'databases', 'ultimate beneficial owner', 'natural person', 'complex structures', 'control', 'certification'],
              negative: ['no verification', 'self-declaration only', 'unclear threshold', 'no documentation', '50%']
            }
          },
          tags: ['ubo', 'beneficial-ownership', 'verification', 'fatf-r24', 'ownership-structure']
        },
        {
          question: 'How frequently do you refresh UBO data?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Ongoing CDD requirement
          isFoundational: true,
          order: 3,
          isRequired: true,
          options: [
            'Continuously with event-based triggers',
            'Annually for all customers',
            'Every 2-3 years based on risk',
            'Only at onboarding',
            'No refresh process'
          ],
          helpText: 'UBO information should be refreshed regularly based on customer risk profile',
          aiPromptHint: 'Assess the adequacy of UBO data refresh frequency. Look for: (1) risk-based refresh cycles (high-risk annual or more frequent, medium-risk 2-3 years, low-risk longer), (2) event-based triggers (ownership changes, adverse media, risk rating changes), (3) systematic tracking of refresh due dates, (4) documented procedures for refresh (information gathering, verification, approval), (5) consequences for incomplete refresh. Best practice combines periodic refresh with event-based triggers. "Only at onboarding" or "No refresh" are critical gaps.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Continuously with event-based triggers': 5,
              'Annually for all customers': 4,
              'Every 2-3 years based on risk': 3,
              'Only at onboarding': 2,
              'No refresh process': 1
            }
          },
          tags: ['ubo', 'refresh', 'ongoing-monitoring', 'periodic-review']
        },
        {
          question: 'What triggers prompt a customer review?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Ownership change',
            'Adverse media hit',
            'Transaction pattern change',
            'Geographic risk change',
            'PEP status identification',
            'Regulatory inquiry',
            'Significant transaction outside profile',
            'Industry/sector risk change',
            'None'
          ],
          helpText: 'Select all events that trigger customer file reviews',
          aiPromptHint: 'Assess the comprehensiveness of customer review triggers. Look for multiple trigger types covering: (1) customer changes (ownership, PEP status, business model), (2) risk changes (geographic, industry, adverse media), (3) activity anomalies (transaction patterns, large transactions), (4) external events (regulatory inquiries, sanctions hits). Strong programs have 6+ triggers and systematic processes to identify and act on triggers. Flag if "None" is selected.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '0': 1,
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['review-triggers', 'event-based', 'monitoring', 'customer-review']
        },
        {
          question: 'Describe your periodic customer review process',
          type: QuestionType.TEXT,
          weight: 1.5,  // Foundational - Ongoing CDD requirement (FATF R.10)
          isFoundational: true,
          order: 5,
          isRequired: true,
          placeholder: 'Describe risk-based review frequency (high/medium/low risk), review procedures and depth, information refresh requirements, documentation standards, approval requirements, and escalation for identified issues...',
          helpText: 'Periodic reviews should be risk-based with documented procedures',
          aiPromptHint: 'Evaluate the maturity of periodic customer review process. Look for: (1) risk-based review frequency (high-risk annual or more, medium-risk 2-3 years, low-risk 3-5 years), (2) documented review procedures and scope (information refresh, transaction review, ongoing monitoring review, risk rating reassessment), (3) tracking system for review due dates, (4) review documentation and approval, (5) escalation procedures for identified issues, (6) consequence management for overdue reviews. Strong programs have automated review scheduling, comprehensive review checklists, and quality assurance.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['risk-based', 'annual', 'documented', 'review procedures', 'tracking', 'approval', 'escalation', 'information refresh', 'reassessment'],
              negative: ['no process', 'infrequent', 'informal', 'ad hoc', 'no tracking', 'overdue']
            }
          },
          tags: ['periodic-review', 'ongoing-cdd', 'risk-based', 'customer-monitoring']
        },
        {
          question: 'How are customer files and KYC documentation maintained?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Centralized electronic system with complete audit trail and version control',
            'Centralized electronic system',
            'Distributed by business line but electronic',
            'Paper-based with some electronic records',
            'Mixed/inconsistent approach'
          ],
          helpText: 'Customer files should be maintained in a secure, auditable system with appropriate access controls',
          aiPromptHint: 'Assess customer file management infrastructure. Look for: (1) electronic document management system, (2) centralized vs. distributed storage, (3) complete audit trail of access and changes, (4) version control for updated documents, (5) retention policy aligned with regulatory requirements, (6) appropriate access controls and security, (7) retrieval efficiency for reviews and audits. Centralized electronic systems with audit trails indicate operational maturity. Paper-based or mixed systems present operational risk.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Centralized electronic system with complete audit trail and version control': 5,
              'Centralized electronic system': 4,
              'Distributed by business line but electronic': 3,
              'Paper-based with some electronic records': 2,
              'Mixed/inconsistent approach': 1
            }
          },
          tags: ['documentation', 'file-management', 'electronic-records', 'audit-trail']
        },
        {
          question: 'What is your KYC exception approval process?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 7,
          isRequired: true,
          placeholder: 'Describe exception criteria and justification requirements, senior management approval levels, time limits on exceptions, compensating controls, and monitoring of customers with exceptions...',
          helpText: 'KYC exceptions should require senior approval, have clear justifications, and be subject to enhanced monitoring',
          aiPromptHint: 'Evaluate KYC exception governance. Look for: (1) documented exception criteria (what can/cannot be excepted), (2) written justification requirements, (3) senior management or MLRO approval (not business line), (4) time-limited exceptions with expiry, (5) compensating controls or enhanced monitoring, (6) board or risk committee reporting of exceptions, (7) periodic exception review and closure. Strong programs minimize exceptions and have strict governance with board visibility.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['senior approval', 'mlro', 'justification', 'time-limited', 'enhanced monitoring', 'compensating controls', 'board reporting', 'documented criteria'],
              negative: ['no approval', 'business approval', 'unlimited', 'no monitoring', 'informal', 'frequent exceptions']
            }
          },
          tags: ['kyc-exceptions', 'approval-process', 'governance', 'compensating-controls']
        },
        {
          question: 'How do you handle customer risk rating changes?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 8,
          isRequired: true,
          placeholder: 'Describe triggers for risk rating changes, approval processes, implementation of enhanced/reduced monitoring, communication to relevant staff, and documentation requirements...',
          helpText: 'Risk rating changes should trigger appropriate control adjustments',
          aiPromptHint: 'Assess risk rating change management. Look for: (1) clear triggers for rating changes (periodic review, adverse events, transaction patterns), (2) documented reassessment process, (3) approval requirements (higher ratings require senior approval), (4) automatic adjustment of controls (monitoring frequency, transaction limits, approval thresholds), (5) communication to front-line and operations, (6) documentation of rationale and approval, (7) tracking of rating changes and trends. Strong programs have automated control adjustments linked to risk ratings.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['triggers', 'approval', 'documented', 'enhanced monitoring', 'control adjustment', 'communication', 'automated', 'tracking'],
              negative: ['manual', 'informal', 'no process', 'no approval', 'inconsistent', 'no follow-up']
            }
          },
          tags: ['risk-rating', 'customer-risk', 'rating-changes', 'control-adjustment']
        }
      ]
    },
    {
      title: 'Adverse Media & Reputational Risk Screening',
      description: 'Assessment of adverse media screening procedures and reputational due diligence',
      weight: 0.076,  // 7.6% - FATF R.12 (Enhanced Due Diligence)
      regulatoryPriority: 'FATF R.12, Enhanced Due Diligence',
      order: 5,
      isRequired: true,
      instructions: 'Focus on your adverse media screening processes and reputational risk management',
      questions: [
        {
          question: 'What adverse media screening policy do you have?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Part of enhanced due diligence
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Automated continuous monitoring with real-time alerts',
            'Periodic automated screening (quarterly or more frequent)',
            'Annual or semi-annual automated screening',
            'Manual searches at key events only',
            'No formal policy'
          ],
          helpText: 'Adverse media screening helps identify reputational and compliance risks',
          aiPromptHint: 'Assess the maturity of adverse media screening. Look for: (1) automated vs. manual screening, (2) continuous vs. periodic, (3) real-time alerting, (4) coverage (onboarding, periodic refresh, event-based), (5) integration with risk rating and customer review processes. Best practice is automated continuous monitoring with alerts. Manual or infrequent screening presents risk.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Automated continuous monitoring with real-time alerts': 5,
              'Periodic automated screening (quarterly or more frequent)': 4,
              'Annual or semi-annual automated screening': 3,
              'Manual searches at key events only': 2,
              'No formal policy': 1
            }
          },
          tags: ['adverse-media', 'screening', 'reputational-risk', 'monitoring']
        },
        {
          question: 'What data sources do you use for adverse media?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: true,
          options: [
            'Commercial databases (World-Check, Dow Jones, LexisNexis, etc.)',
            'News aggregators and media monitoring services',
            'Public records and court databases',
            'Social media monitoring',
            'Web searches and search engines',
            'Industry-specific databases',
            'Regulatory enforcement databases',
            'None'
          ],
          helpText: 'Multiple data sources increase coverage and reduce false negatives',
          aiPromptHint: 'Assess comprehensiveness of adverse media data sources. Look for: (1) use of commercial databases with global coverage, (2) news aggregators, (3) public records and enforcement databases, (4) multiple sources for redundancy, (5) relevance to customer base and geographies. Strong programs use 4+ sources including commercial databases. Flag if "None" selected.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '0': 1,
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['data-sources', 'adverse-media', 'databases', 'coverage']
        },
        {
          question: 'Do you conduct searches in relevant languages/regions?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'Yes - automated multi-language with AI translation',
            'Yes - automated multi-language for key markets',
            'Yes - manual translation when needed',
            'Limited to English and one other language',
            'English only'
          ],
          helpText: 'Multi-language screening is important for international customer bases',
          aiPromptHint: 'Evaluate multi-language capability. Look for: (1) coverage of languages relevant to customer base and geographies, (2) automated vs. manual translation, (3) use of native-language sources, (4) quality of translation and relevance filtering. Programs serving international customers should have multi-language capability. English-only screening may miss critical local media.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - automated multi-language with AI translation': 5,
              'Yes - automated multi-language for key markets': 4,
              'Yes - manual translation when needed': 3,
              'Limited to English and one other language': 2,
              'English only': 1
            }
          },
          tags: ['multi-language', 'translation', 'international', 'screening']
        },
        {
          question: 'How do you categorize adverse media hits?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          placeholder: 'Describe your categorization taxonomy (criminal, regulatory, reputational, associative), severity assessment criteria, relevance determination, and false positive identification process...',
          helpText: 'Consistent categorization helps prioritize investigations',
          aiPromptHint: 'Assess adverse media categorization process. Look for: (1) documented categorization taxonomy (e.g., criminal, regulatory, civil, reputational, associative), (2) severity/materiality assessment, (3) relevance criteria (name match quality, date, jurisdiction), (4) false positive identification, (5) consistent application of criteria, (6) documentation of decisions. Strong programs have detailed taxonomies and systematic relevance assessment.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['taxonomy', 'categorization', 'severity', 'relevance', 'documented', 'criteria', 'criminal', 'regulatory', 'assessment', 'false positive'],
              negative: ['no categorization', 'informal', 'inconsistent', 'subjective', 'no criteria']
            }
          },
          tags: ['categorization', 'taxonomy', 'hit-analysis', 'relevance']
        },
        {
          question: 'What is your escalation process for adverse media findings?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          placeholder: 'Describe investigation procedures, senior management review thresholds, risk rating impact, relationship continuation decisions, and documentation requirements...',
          helpText: 'Material adverse media should trigger investigation and senior review',
          aiPromptHint: 'Evaluate adverse media escalation process. Look for: (1) documented investigation procedures, (2) escalation thresholds based on severity/category, (3) senior management or MLRO review for material hits, (4) risk rating impact assessment, (5) relationship exit/continuation decisions with approval, (6) documentation and audit trail, (7) timeframes for investigation and decision. Strong programs have clear escalation paths and senior involvement in material decisions.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['escalation', 'investigation', 'senior review', 'mlro', 'risk rating', 'documented', 'approval', 'exit decision', 'threshold'],
              negative: ['no escalation', 'informal', 'business decision', 'no review', 'inconsistent']
            }
          },
          tags: ['escalation', 'investigation', 'senior-review', 'risk-decision']
        },
        {
          question: 'Are adverse media findings linked to customer profiles?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Fully integrated into risk scoring system',
            'Integrated with manual risk assessment impact',
            'Manually noted in customer file',
            'Tracked separately from customer file',
            'Not systematically tracked'
          ],
          helpText: 'Integration ensures adverse media is considered in ongoing risk assessment',
          aiPromptHint: 'Assess integration of adverse media into customer risk management. Look for: (1) adverse media findings stored in customer profile, (2) automatic or manual impact on risk rating, (3) visibility in customer reviews and monitoring, (4) historical tracking of findings and resolutions, (5) consideration in relationship decisions. Strong programs have full integration with risk scoring. Separate tracking or no tracking indicates weakness.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Fully integrated into risk scoring system': 5,
              'Integrated with manual risk assessment impact': 4,
              'Manually noted in customer file': 3,
              'Tracked separately from customer file': 2,
              'Not systematically tracked': 1
            }
          },
          tags: ['integration', 'risk-scoring', 'customer-profile', 'tracking']
        }
      ]
    },
    {
      title: 'Sanctions Screening & PEP Detection',
      description: 'Comprehensive assessment of sanctions screening systems, list management, and violation response',
      weight: 0.114,  // 11.4% - Critical regulatory requirement
      regulatoryPriority: 'OFAC, EU Sanctions, UN Sanctions',
      order: 6,
      isRequired: true,
      instructions: 'Focus on your sanctions screening systems, processes, and compliance',
      questions: [
        {
          question: 'How frequently are sanctions lists updated in your system?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Timely updates critical for compliance
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Real-time automated updates',
            'Daily automated updates',
            'Weekly updates',
            'Monthly updates',
            'Manual/irregular updates'
          ],
          helpText: 'Sanctions lists should be updated at least daily',
          aiPromptHint: 'Assess sanctions list update frequency and automation. Look for: (1) automated vs. manual updates, (2) update frequency (real-time/daily preferred), (3) coverage of all applicable regimes, (4) testing and validation of updates, (5) notification of list changes. Real-time or daily automated updates indicate best practice. Weekly or manual updates present compliance risk.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Real-time automated updates': 5,
              'Daily automated updates': 4,
              'Weekly updates': 3,
              'Monthly updates': 2,
              'Manual/irregular updates': 1
            }
          },
          tags: ['sanctions', 'list-updates', 'automation', 'frequency']
        },
        {
          question: 'What screening approach do you use?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Screening approach critical
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Real-time screening of all transactions and parties',
            'Real-time for high-risk, batch for others',
            'Daily batch screening',
            'Weekly/periodic batch screening',
            'Manual screening only'
          ],
          helpText: 'Real-time screening reduces risk of sanctions violations',
          aiPromptHint: 'Evaluate sanctions screening approach and timing. Look for: (1) real-time vs. batch screening, (2) comprehensive coverage (customers, transactions, counterparties), (3) risk-based variations if applicable, (4) screening at multiple touchpoints (onboarding, payment processing, periodic). Real-time screening for all transactions/parties is best practice. Batch or manual screening increases violation risk.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Real-time screening of all transactions and parties': 5,
              'Real-time for high-risk, batch for others': 4,
              'Daily batch screening': 3,
              'Weekly/periodic batch screening': 2,
              'Manual screening only': 1
            }
          },
          tags: ['screening-approach', 'real-time', 'batch', 'sanctions']
        },
        {
          question: 'Which sanctions regimes apply to your operations?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'U.S. OFAC sanctions',
            'EU sanctions',
            'UK sanctions (OFSI)',
            'UN sanctions',
            'Sectoral sanctions (Russia, Iran, etc.)',
            'Country-specific embargoes',
            'Entity-specific designations',
            'Secondary sanctions',
            'Not applicable'
          ],
          helpText: 'Select all applicable sanctions regimes based on your operations',
          aiPromptHint: 'Assess understanding and coverage of applicable sanctions regimes. Look for: (1) identification of all regimes relevant to business, (2) extraterritorial applicability (e.g., OFAC secondary sanctions), (3) monitoring of regime-specific requirements, (4) jurisdictional analysis. Programs should screen against all applicable regimes. Limited regime coverage or "Not applicable" may indicate gap.',
          scoringRules: {
            scale: 5,
            contextual: 'Based on business operations and jurisdictions'
          },
          tags: ['sanctions-regimes', 'ofac', 'eu-sanctions', 'un-sanctions', 'compliance']
        },
        {
          question: 'How are fuzzy matching algorithms configured and tested?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          placeholder: 'Describe match threshold settings, phonetic algorithm types, name transliteration handling, validation and tuning procedures, and testing methodology...',
          helpText: 'Fuzzy matching configuration balances detection accuracy with false positive rates',
          aiPromptHint: 'Evaluate fuzzy matching configuration and tuning. Look for: (1) documented matching thresholds, (2) phonetic algorithms (Soundex, Metaphone, etc.), (3) transliteration handling for non-Latin scripts, (4) testing with known true positives and negatives, (5) periodic tuning based on false positive/negative analysis, (6) vendor validation if using third-party system. Strong programs have documented configurations with regular testing and tuning.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['threshold', 'tuning', 'testing', 'phonetic', 'transliteration', 'validation', 'false positive', 'algorithm', 'configured'],
              negative: ['default settings', 'not configured', 'no testing', 'no tuning', 'unknown']
            }
          },
          tags: ['fuzzy-matching', 'configuration', 'tuning', 'testing']
        },
        {
          question: 'What do you screen against sanctions lists?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Customer names (individuals and entities)',
            'Beneficial owners and controllers',
            'Transaction counterparties',
            'Payment messages (SWIFT, etc.)',
            'Vessel names (if applicable)',
            'Addresses and locations',
            'Employees and agents',
            'None of the above'
          ],
          helpText: 'Comprehensive screening covers all relevant parties and transaction elements',
          aiPromptHint: 'Assess screening coverage comprehensiveness. Look for: (1) screening of customers and beneficial owners, (2) counterparty screening, (3) payment message screening for names/entities, (4) geographic screening (addresses, locations), (5) vessel/aircraft screening if applicable, (6) employee/agent screening. Strong programs screen 5+ categories. Flag if "None of the above" is selected.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '0': 1,
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['screening-coverage', 'counterparties', 'transactions', 'comprehensive']
        },
        {
          question: 'What are your SLAs for sanctions alert resolution?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          placeholder: 'Describe initial review timeframe, investigation completion deadline, escalation triggers for delays, and payment release/block decision procedures...',
          helpText: 'Prompt alert resolution reduces business disruption while maintaining compliance',
          aiPromptHint: 'Evaluate sanctions alert SLAs and procedures. Look for: (1) defined timeframes for initial review (e.g., within 4 hours), (2) investigation completion deadline (e.g., 24-48 hours), (3) escalation procedures for missed SLAs, (4) different SLAs by alert priority, (5) payment hold procedures pending resolution, (6) monitoring and reporting of SLA compliance. Strong programs have stringent SLAs with escalation and monitoring.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['sla', 'timeframe', '24 hours', '48 hours', 'deadline', 'escalation', 'monitoring', 'priority', 'urgent'],
              negative: ['no sla', 'informal', 'no timeframe', 'delayed', 'backlog']
            }
          },
          tags: ['sla', 'alert-resolution', 'investigation', 'timeframes']
        },
        {
          question: 'Who provides final approval for potential sanctions matches?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Approval authority critical
          isFoundational: true,
          order: 7,
          isRequired: true,
          options: [
            'Independent compliance officer or MLRO',
            'Senior compliance with documented rationale',
            'Business unit manager with compliance concurrence',
            'Business unit manager alone',
            'No formal approval process'
          ],
          helpText: 'Independence in match resolution reduces conflict of interest',
          aiPromptHint: 'Assess independence and authority of sanctions match approval. Look for: (1) independent compliance officer or MLRO approval, (2) separation from business unit, (3) documented rationale for decisions, (4) escalation to senior management for true matches, (5) prohibition on business override of compliance decisions. Strong programs require independent compliance approval with documented rationale. Business-only approval or no process indicates control weakness.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Independent compliance officer or MLRO': 5,
              'Senior compliance with documented rationale': 4,
              'Business unit manager with compliance concurrence': 3,
              'Business unit manager alone': 2,
              'No formal approval process': 1
            }
          },
          tags: ['approval', 'independence', 'governance', 'match-resolution']
        },
        {
          question: 'How do you handle re-screening when lists are updated?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 8,
          isRequired: true,
          placeholder: 'Describe automated retroactive screening procedures, batch re-screening process, hit review and investigation, and documentation of re-screening outcomes...',
          helpText: 'Retroactive screening ensures existing customers are checked against updated lists',
          aiPromptHint: 'Evaluate re-screening process when sanctions lists are updated. Look for: (1) automated retroactive screening of entire customer base, (2) re-screening triggered by list updates, (3) systematic hit review and investigation, (4) documented procedures and outcomes, (5) timeframes for completing re-screening, (6) escalation for identified matches. Strong programs have automated re-screening with systematic review. Manual or no re-screening presents compliance risk.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['automated', 'retroactive', 're-screening', 'all customers', 'systematic', 'triggered', 'documented'],
              negative: ['manual', 'no re-screening', 'ad hoc', 'incomplete', 'delayed']
            }
          },
          tags: ['re-screening', 'retroactive', 'list-updates', 'automation']
        },
        {
          question: 'How frequently is your sanctions screening system validated?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Annual independent validation with comprehensive testing',
            'Annual internal validation',
            'Periodic validation (2-3 years)',
            'Ad hoc validation only',
            'No formal validation'
          ],
          helpText: 'Regular validation ensures screening effectiveness',
          aiPromptHint: 'Assess sanctions screening system validation. Look for: (1) annual or more frequent validation, (2) independent validation (internal audit, external consultant), (3) comprehensive testing (true positives, false negatives, threshold testing), (4) documentation of findings and remediation, (5) testing of all screening touchpoints, (6) validation of list updates and configuration. Annual independent validation with testing is best practice.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Annual independent validation with comprehensive testing': 5,
              'Annual internal validation': 4,
              'Periodic validation (2-3 years)': 3,
              'Ad hoc validation only': 2,
              'No formal validation': 1
            }
          },
          tags: ['validation', 'testing', 'quality-assurance', 'independent-review']
        },
        {
          question: 'Do you have procedures for handling sanctions violations?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Comprehensive violation response with regulatory reporting procedures',
            'Documented procedures with escalation',
            'Basic informal procedures',
            'Ad hoc response',
            'No formal procedures'
          ],
          helpText: 'Violation response procedures ensure timely reporting and remediation',
          aiPromptHint: 'Evaluate sanctions violation response procedures. Look for: (1) documented procedures for identifying violations, (2) immediate escalation to MLRO/legal/senior management, (3) self-reporting requirements and timeframes, (4) regulatory notification procedures (OFAC, OFSI, etc.), (5) remediation and control enhancement, (6) root cause analysis, (7) board notification for material violations. Strong programs have comprehensive procedures with regulatory reporting requirements.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Comprehensive violation response with regulatory reporting procedures': 5,
              'Documented procedures with escalation': 4,
              'Basic informal procedures': 3,
              'Ad hoc response': 2,
              'No formal procedures': 1
            }
          },
          tags: ['violations', 'response-procedures', 'reporting', 'remediation']
        }
      ]
    },
    {
      title: 'Transaction Monitoring & Suspicious Activity Reporting',
      description: 'Assessment of AML monitoring systems, alert management, and SAR/STR filing processes',
      weight: 0.114,  // 11.4% - FATF R.11 (Record Keeping & Monitoring)
      regulatoryPriority: 'FATF R.11, Record Keeping & Monitoring',
      order: 7,
      isRequired: true,
      instructions: 'Focus on your transaction monitoring systems, alert investigation, and suspicious activity reporting',
      questions: [
        {
          question: 'What type of transaction monitoring system do you use?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Transaction monitoring required by FATF R.11
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Advanced AI/ML-based with behavioral analytics',
            'Rules-based with behavioral analytics',
            'Basic rules-based system',
            'Manual monitoring processes',
            'No formal monitoring system'
          ],
          helpText: 'Transaction monitoring is a critical control for detecting suspicious activity',
          aiPromptHint: 'Assess transaction monitoring system sophistication. Look for: (1) automated vs. manual monitoring, (2) AI/ML capabilities vs. rules-based, (3) behavioral analytics for pattern detection, (4) coverage of all transactions and activities, (5) real-time vs. batch monitoring. Advanced AI/ML systems with behavioral analytics represent best practice. Manual or no system presents significant compliance risk.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Advanced AI/ML-based with behavioral analytics': 5,
              'Rules-based with behavioral analytics': 4,
              'Basic rules-based system': 3,
              'Manual monitoring processes': 2,
              'No formal monitoring system': 1
            }
          },
          tags: ['transaction-monitoring', 'aml', 'systems', 'automation']
        },
        {
          question: 'Are AML monitoring scenarios risk-based and approved by management?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: true,
          placeholder: 'Describe scenario library documentation, risk-based prioritization, senior management approval process, coverage assessment, and scenario effectiveness reviews...',
          helpText: 'Monitoring scenarios should be risk-based and formally approved',
          aiPromptHint: 'Evaluate AML scenario governance. Look for: (1) documented scenario library covering key typologies, (2) risk-based prioritization aligned with risk assessment, (3) board or senior management approval, (4) periodic scenario effectiveness reviews, (5) coverage assessment ensuring all material risks monitored, (6) scenario testing and validation. Strong programs have comprehensive scenarios with formal governance.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['risk-based', 'documented', 'scenario library', 'management approval', 'board', 'coverage', 'effectiveness', 'testing', 'validated'],
              negative: ['ad hoc', 'no approval', 'informal', 'incomplete coverage', 'not risk-based']
            }
          },
          tags: ['scenarios', 'risk-based', 'governance', 'approval']
        },
        {
          question: 'How do you tune and optimize monitoring rules?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          placeholder: 'Describe tuning methodology and frequency, performance metrics (detection rate, false positive rate), threshold adjustments, and closed-loop learning processes...',
          helpText: 'Regular tuning optimizes detection while managing false positive rates',
          aiPromptHint: 'Assess rule tuning and optimization process. Look for: (1) documented tuning methodology, (2) regular tuning cycle (quarterly or more frequent), (3) performance metrics tracking (detection rate, false positive rate, SAR conversion), (4) threshold adjustments based on data analysis, (5) closed-loop learning from investigations, (6) stakeholder involvement (compliance, IT, business). Strong programs have systematic tuning with data-driven optimization.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['tuning', 'optimization', 'quarterly', 'metrics', 'false positive', 'detection rate', 'threshold', 'data-driven', 'systematic'],
              negative: ['no tuning', 'static', 'ad hoc', 'no metrics', 'manual only']
            }
          },
          tags: ['tuning', 'optimization', 'false-positives', 'performance']
        },
        {
          question: 'Are rule libraries updated for new typologies?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Regular updates based on FATF, FIU guidance, and internal cases',
            'Annual updates for major typologies',
            'Occasional updates when significant gaps identified',
            'Reactive updates only after incidents',
            'No systematic updates'
          ],
          helpText: 'Typology updates ensure detection of evolving threats',
          aiPromptHint: 'Evaluate typology update process. Look for: (1) regular monitoring of FATF reports, FIU advisories, regulatory alerts, (2) integration of internal case learnings, (3) proactive updates before incidents, (4) testing of new scenarios, (5) documentation of typology changes. Strong programs have regular proactive updates informed by multiple sources. Reactive or no updates indicate weakness.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Regular updates based on FATF, FIU guidance, and internal cases': 5,
              'Annual updates for major typologies': 4,
              'Occasional updates when significant gaps identified': 3,
              'Reactive updates only after incidents': 2,
              'No systematic updates': 1
            }
          },
          tags: ['typologies', 'updates', 'fatf', 'emerging-threats']
        },
        {
          question: 'What is your average monthly transaction monitoring alert volume?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            '0-100 alerts',
            '101-500 alerts',
            '501-1,000 alerts',
            '1,001-5,000 alerts',
            'Over 5,000 alerts',
            'Unknown/Not tracked'
          ],
          helpText: 'Alert volume should be proportionate to business size and properly managed',
          aiPromptHint: 'Assess alert volume reasonableness and management. Look for: (1) volume tracking and trending, (2) proportionality to transaction volume and customer base, (3) manageable investigative workload, (4) false positive rate assessment, (5) staffing adequacy. Very high volumes may indicate poor tuning; very low volumes may indicate insufficient coverage. "Unknown/Not tracked" is a significant control gap.',
          scoringRules: {
            scale: 5,
            contextual: 'Assess proportionality to business size. Too high suggests poor tuning, too low suggests insufficient detection.'
          },
          tags: ['alert-volume', 'metrics', 'workload', 'tuning']
        },
        {
          question: 'How do you investigate and disposition monitoring alerts?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          placeholder: 'Describe investigation procedures, timeframe requirements (SLAs), documentation standards, disposition categories, approval requirements, and escalation protocols...',
          helpText: 'Systematic alert investigation ensures compliance and quality',
          aiPromptHint: 'Evaluate alert investigation process. Look for: (1) documented investigation procedures, (2) SLAs for completion (e.g., 10-15 days), (3) standardized documentation, (4) clear disposition categories (escalate, file SAR, close), (5) supervisor review and approval, (6) quality assurance, (7) investigation tools and data access. Strong programs have detailed procedures with quality controls.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['documented procedures', 'sla', 'timeframe', 'documentation', 'approval', 'supervisor review', 'quality', 'standards'],
              negative: ['informal', 'no sla', 'inconsistent', 'no approval', 'backlog']
            }
          },
          tags: ['investigation', 'alert-disposition', 'procedures', 'quality']
        },
        {
          question: 'What is your alert-to-SAR/STR conversion ratio and trend?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 7,
          isRequired: true,
          placeholder: 'Describe ratio tracking and reporting, trend analysis, tuning adjustments based on ratios, and quality metrics...',
          helpText: 'Conversion ratio is a key indicator of monitoring effectiveness',
          aiPromptHint: 'Assess alert-to-SAR ratio tracking and use. Look for: (1) tracking of conversion ratio (alerts to SARs filed), (2) trend analysis over time, (3) benchmarking against industry or peers, (4) use of ratio to inform tuning, (5) investigation of significant changes, (6) board/management reporting. Typical ratios vary by business but should be tracked and stable. Sudden changes may indicate issues.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['tracked', 'ratio', 'trend', 'analysis', 'tuning', 'benchmarking', 'monitoring', 'reported'],
              negative: ['not tracked', 'unknown', 'no analysis', 'inconsistent']
            }
          },
          tags: ['sar-conversion', 'metrics', 'effectiveness', 'kpi']
        },
        {
          question: 'How do you file Suspicious Activity Reports (SARs)?',
          type: QuestionType.TEXT,
          weight: 1.5,  // Foundational - SAR filing is regulatory requirement
          isFoundational: true,
          order: 8,
          isRequired: true,
          placeholder: 'Describe decision criteria, approval process (MLRO/senior management), filing timeframes (typically 30 days), quality review, record-keeping, and regulatory feedback monitoring...',
          helpText: 'SAR filing is a critical regulatory obligation',
          aiPromptHint: 'Evaluate SAR filing process. Look for: (1) clear decision criteria for filing, (2) MLRO or senior compliance approval, (3) adherence to regulatory timeframes (typically 30 days from suspicion), (4) quality review of narratives, (5) complete and accurate information, (6) secure filing channels, (7) record retention, (8) monitoring of regulatory feedback. Strong programs have rigorous approval and quality controls with timely filing.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['mlro approval', 'documented criteria', 'timeframe', '30 days', 'quality review', 'recorded', 'secure', 'senior approval'],
              negative: ['informal', 'delayed', 'no approval', 'inconsistent', 'incomplete']
            }
          },
          tags: ['sar', 'str', 'filing', 'reporting', 'regulatory']
        },
        {
          question: 'Is there post-implementation model validation?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Annual comprehensive validation by independent team',
            'Regular internal validation',
            'Periodic validation (2-3 years)',
            'Ad hoc validation',
            'No formal validation'
          ],
          helpText: 'Model validation ensures ongoing monitoring effectiveness',
          aiPromptHint: 'Assess transaction monitoring model validation. Look for: (1) annual or more frequent validation, (2) independent validation (internal audit, external consultant), (3) comprehensive testing (scenario effectiveness, threshold appropriateness, false negative testing), (4) documentation of findings and remediation, (5) back-testing against known cases, (6) regulatory alignment check. Annual independent validation is best practice.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Annual comprehensive validation by independent team': 5,
              'Regular internal validation': 4,
              'Periodic validation (2-3 years)': 3,
              'Ad hoc validation': 2,
              'No formal validation': 1
            }
          },
          tags: ['validation', 'model-validation', 'testing', 'independent-review']
        }
      ]
    },
    {
      title: 'Fraud & Identity Management',
      description: 'Assessment of fraud prevention integration and identity verification controls',
      weight: 0.076,  // 7.6% - Basel II/III Operational Risk
      regulatoryPriority: 'Basel II/III Operational Risk',
      order: 8,
      isRequired: true,
      instructions: 'Focus on your fraud management systems and integration with AML compliance',
      questions: [
        {
          question: 'Do you have a documented fraud risk management policy?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Fraud controls integral to FCC
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - comprehensive policy integrated with AML',
            'Yes - standalone fraud policy',
            'Basic fraud guidance',
            'Informal practices only',
            'No formal policy'
          ],
          helpText: 'Fraud and financial crime risks are interconnected and should be managed holistically',
          aiPromptHint: 'Assess fraud risk management policy. Look for: (1) documented policy covering fraud types (identity fraud, payment fraud, account takeover), (2) integration with AML compliance, (3) roles and responsibilities, (4) detection and response procedures, (5) board approval and oversight, (6) regular policy updates. Integrated policies demonstrate mature risk management.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive policy integrated with AML': 5,
              'Yes - standalone fraud policy': 4,
              'Basic fraud guidance': 3,
              'Informal practices only': 2,
              'No formal policy': 1
            }
          },
          tags: ['fraud', 'policy', 'risk-management', 'integration']
        },
        {
          question: 'Are fraud detection and AML monitoring systems integrated?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: true,
          options: [
            'Fully integrated with data sharing and correlation',
            'Partially integrated with some data exchange',
            'Separate systems with manual correlation',
            'Separate systems with no correlation',
            'No fraud detection system'
          ],
          helpText: 'Integration enables holistic view of customer risk and activity patterns',
          aiPromptHint: 'Evaluate fraud-AML system integration. Look for: (1) shared customer data and risk profiles, (2) cross-system alerting and correlation, (3) unified case management, (4) data exchange protocols, (5) combined investigations for efficiency. Full integration optimizes detection and reduces duplication. Separate systems may miss linked fraud-ML activity.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Fully integrated with data sharing and correlation': 5,
              'Partially integrated with some data exchange': 4,
              'Separate systems with manual correlation': 3,
              'Separate systems with no correlation': 2,
              'No fraud detection system': 1
            }
          },
          tags: ['integration', 'fraud-detection', 'aml', 'systems']
        },
        {
          question: 'What authentication controls do you use?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'Two-factor authentication (2FA)',
            'Multi-factor authentication (MFA)',
            'Device fingerprinting',
            'Biometric authentication',
            'Behavioral analytics',
            'Transaction velocity limits',
            'Geo-location verification',
            'Step-up authentication for high-risk',
            'None'
          ],
          helpText: 'Multiple authentication controls strengthen identity verification',
          aiPromptHint: 'Assess authentication control comprehensiveness. Look for: (1) MFA/2FA implementation, (2) layered controls (device, biometric, behavioral), (3) risk-based authentication, (4) step-up for high-risk transactions, (5) velocity and geo-location checks. Strong programs use 5+ controls with risk-based triggers. Flag if "None" is selected.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '0': 1,
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['authentication', 'mfa', '2fa', 'identity-verification', 'controls']
        },
        {
          question: 'How do you track and investigate fraud incidents?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          placeholder: 'Describe tracking system, investigation procedures, root cause analysis, loss tracking, and reporting...',
          helpText: 'Systematic fraud tracking enables pattern identification and control improvement',
          aiPromptHint: 'Evaluate fraud incident management. Look for: (1) centralized incident tracking system, (2) documented investigation procedures, (3) root cause analysis, (4) loss quantification and tracking, (5) trend analysis and reporting, (6) lessons learned and control updates, (7) law enforcement coordination when appropriate. Strong programs have comprehensive tracking with closed-loop learning.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['tracking system', 'investigation', 'root cause', 'documented', 'loss tracking', 'trend analysis', 'reporting', 'lessons learned'],
              negative: ['informal', 'no tracking', 'inconsistent', 'no investigation', 'ad hoc']
            }
          },
          tags: ['incident-tracking', 'investigation', 'fraud-management', 'root-cause']
        },
        {
          question: 'Are fraud analytics used for pattern recognition?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Advanced analytics with AI/ML',
            'Rule-based analytics with dashboards',
            'Basic manual analysis',
            'Reactive analysis only',
            'No systematic analytics'
          ],
          helpText: 'Analytics help detect sophisticated fraud patterns and trends',
          aiPromptHint: 'Assess fraud analytics capability. Look for: (1) AI/ML for pattern detection, (2) anomaly detection algorithms, (3) network analysis for organized fraud, (4) predictive models, (5) visualization and dashboards, (6) real-time vs. batch analysis. Advanced analytics with AI/ML represent best practice for detecting evolving fraud.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Advanced analytics with AI/ML': 5,
              'Rule-based analytics with dashboards': 4,
              'Basic manual analysis': 3,
              'Reactive analysis only': 2,
              'No systematic analytics': 1
            }
          },
          tags: ['analytics', 'ai-ml', 'pattern-recognition', 'fraud-detection']
        },
        {
          question: 'How do you share fraud intelligence across departments?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          placeholder: 'Describe cross-functional sharing mechanisms, security and confidentiality measures, industry sharing participation, and feedback loops...',
          helpText: 'Intelligence sharing improves detection and prevention',
          aiPromptHint: 'Evaluate fraud intelligence sharing. Look for: (1) cross-functional sharing (fraud, AML, cyber, operations), (2) secure communication channels, (3) confidentiality protections, (4) participation in industry fraud sharing networks, (5) feedback from law enforcement and external sources, (6) actionable intelligence dissemination. Strong programs have systematic internal and external sharing with appropriate safeguards.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['sharing', 'cross-functional', 'industry networks', 'secure', 'feedback', 'intelligence', 'coordination'],
              negative: ['siloed', 'no sharing', 'informal', 'limited', 'restricted']
            }
          },
          tags: ['intelligence-sharing', 'collaboration', 'information-exchange', 'fraud-prevention']
        }
      ]
    },
    {
      title: 'Data & Technology Infrastructure',
      description: 'Assessment of system integration, data quality, and privacy compliance',
      weight: 0.076,  // 7.6% - Technology enabler, data quality critical
      regulatoryPriority: 'Technology Enabler, Data Quality',
      order: 9,
      isRequired: true,
      instructions: 'Focus on your compliance technology infrastructure and data management',
      questions: [
        {
          question: 'Are compliance data ownership and lineage clearly defined?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Data governance is foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Fully documented with governance framework',
            'Documented with some gaps',
            'Partially documented',
            'Informal understanding',
            'Unclear/undefined'
          ],
          helpText: 'Clear data ownership ensures accountability and quality',
          aiPromptHint: 'Assess data governance. Look for: (1) documented data ownership (business vs. technical owners), (2) data lineage (source to use mapping), (3) governance framework and policies, (4) data stewardship roles, (5) data quality accountability, (6) metadata management. Strong programs have comprehensive data governance with clear ownership and lineage documentation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Fully documented with governance framework': 5,
              'Documented with some gaps': 4,
              'Partially documented': 3,
              'Informal understanding': 2,
              'Unclear/undefined': 1
            }
          },
          tags: ['data-governance', 'data-ownership', 'data-lineage', 'accountability']
        },
        {
          question: 'Which compliance systems are integrated?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: true,
          options: [
            'KYC/customer onboarding',
            'Sanctions screening',
            'Transaction monitoring',
            'Adverse media screening',
            'Case management',
            'Regulatory reporting',
            'Document management',
            'Risk assessment',
            'None integrated'
          ],
          helpText: 'Integration improves efficiency and data consistency',
          aiPromptHint: 'Assess system integration comprehensiveness. Look for: (1) integration of core FCC systems, (2) data sharing and automation, (3) single customer view, (4) workflow automation across systems, (5) reduction of manual data entry. Strong programs integrate 6+ systems for efficiency and accuracy. Flag if "None integrated" selected.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '0': 1,
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['system-integration', 'automation', 'efficiency', 'data-sharing']
        },
        {
          question: 'What data quality controls are in place?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          placeholder: 'Describe accuracy monitoring, completeness checks, timeliness metrics, reconciliation procedures...',
          helpText: 'Data quality is critical for effective compliance controls',
          aiPromptHint: 'Evaluate data quality controls. Look for: (1) accuracy monitoring (validation rules, error detection), (2) completeness checks (mandatory field enforcement), (3) timeliness metrics (data freshness SLAs), (4) reconciliation procedures (source vs. downstream systems), (5) data quality dashboards and reporting, (6) remediation processes for data issues. Strong programs have automated data quality controls with regular monitoring.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['accuracy', 'completeness', 'timeliness', 'reconciliation', 'monitoring', 'validation', 'automated', 'dashboard'],
              negative: ['no controls', 'manual', 'informal', 'inconsistent', 'no monitoring']
            }
          },
          tags: ['data-quality', 'controls', 'monitoring', 'validation']
        },
        {
          question: 'Are audit logs automatically generated?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Comprehensive automated logs with tamper protection',
            'Automated logging for key activities',
            'Partial automated logging',
            'Manual logging',
            'No systematic logs'
          ],
          helpText: 'Audit logs provide accountability and support investigations',
          aiPromptHint: 'Assess audit logging capability. Look for: (1) automated logging of all compliance activities, (2) tamper-proof logs (immutable, encrypted), (3) comprehensive coverage (access, changes, approvals, investigations), (4) log retention per regulatory requirements, (5) log review and monitoring, (6) audit trail for regulatory inspections. Strong programs have comprehensive automated logging with tamper protection.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Comprehensive automated logs with tamper protection': 5,
              'Automated logging for key activities': 4,
              'Partial automated logging': 3,
              'Manual logging': 2,
              'No systematic logs': 1
            }
          },
          tags: ['audit-logging', 'compliance', 'accountability', 'automation']
        },
        {
          question: 'Is there a compliance IT modernization roadmap?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          placeholder: 'Describe technology strategy, planned upgrades, investment priorities, implementation timeline...',
          helpText: 'Modernization roadmap ensures systems remain effective and compliant',
          aiPromptHint: 'Evaluate compliance technology strategy. Look for: (1) multi-year technology roadmap, (2) planned system upgrades or replacements, (3) investment prioritization (business case), (4) implementation timeline and milestones, (5) alignment with business strategy and regulatory changes, (6) technology obsolescence management. Strong programs have documented roadmaps with funded initiatives.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['roadmap', 'strategy', 'planned upgrades', 'investment', 'timeline', 'modernization', 'multi-year', 'funded'],
              negative: ['no roadmap', 'reactive', 'ad hoc', 'unfunded', 'no strategy']
            }
          },
          tags: ['it-strategy', 'modernization', 'roadmap', 'technology-investment']
        },
        {
          question: 'How frequently are vendor systems reviewed?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Annual comprehensive assessment',
            'Every 2 years',
            'Every 3+ years',
            'Ad hoc when issues arise',
            'No formal reviews'
          ],
          helpText: 'Regular vendor reviews ensure system effectiveness and compliance',
          aiPromptHint: 'Assess vendor system review frequency. Look for: (1) regular review cycle (annual preferred), (2) comprehensive assessment (functionality, SLAs, security, compliance), (3) vendor performance metrics, (4) contract compliance review, (5) alternative vendor assessment, (6) escalation for performance issues. Strong programs review vendors annually with documented assessments.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Annual comprehensive assessment': 5,
              'Every 2 years': 4,
              'Every 3+ years': 3,
              'Ad hoc when issues arise': 2,
              'No formal reviews': 1
            }
          },
          tags: ['vendor-management', 'review', 'assessment', 'third-party']
        },
        {
          question: 'Is compliance included in system design/procurement?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Always - formal requirements gathering',
            'Usually included early',
            'Occasionally consulted',
            'Consulted late in process',
            'Rarely/never included'
          ],
          helpText: 'Early compliance involvement prevents costly retrofits',
          aiPromptHint: 'Evaluate compliance involvement in technology lifecycle. Look for: (1) compliance requirements in project initiation, (2) compliance representation in design decisions, (3) control requirements documentation, (4) compliance testing and UAT, (5) sign-off before go-live. Strong programs include compliance from project start with formal requirements and testing.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Always - formal requirements gathering': 5,
              'Usually included early': 4,
              'Occasionally consulted': 3,
              'Consulted late in process': 2,
              'Rarely/never included': 1
            }
          },
          tags: ['compliance-involvement', 'system-design', 'procurement', 'requirements']
        },
        {
          question: 'How is data protected per GDPR and privacy laws?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 8,
          isRequired: true,
          placeholder: 'Describe encryption standards, access controls, retention policies, data subject rights management...',
          helpText: 'Privacy compliance is mandatory in many jurisdictions',
          aiPromptHint: 'Assess privacy and data protection controls. Look for: (1) encryption (at rest and in transit), (2) role-based access controls, (3) data minimization and retention policies, (4) data subject rights (access, erasure, portability), (5) privacy impact assessments, (6) breach notification procedures, (7) DPO or privacy officer designation. Strong programs have comprehensive privacy controls aligned with GDPR/CCPA requirements.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['encryption', 'access controls', 'retention', 'gdpr', 'privacy', 'data protection', 'dpo', 'data subject rights'],
              negative: ['no controls', 'unclear', 'informal', 'no encryption', 'no policy']
            }
          },
          tags: ['privacy', 'gdpr', 'data-protection', 'encryption', 'access-control']
        }
      ]
    },
    {
      title: 'Training, Culture & Awareness',
      description: 'Assessment of role-based training and ethical culture development',
      weight: 0.0475,  // 4.75% - FATF R.18 (Internal Controls)
      regulatoryPriority: 'FATF R.18, Internal Controls',
      order: 10,
      isRequired: true,
      instructions: 'Focus on your training programs and compliance culture',
      questions: [
        {
          question: 'Is FCC training mandatory for all employees?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Training required by FATF R.18
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - mandatory with tracked completion and consequences',
            'Yes - mandatory with tracking',
            'Mandatory but not consistently enforced',
            'Recommended but optional',
            'No mandatory training'
          ],
          helpText: 'Mandatory training ensures all staff understand their FCC responsibilities',
          aiPromptHint: 'Assess training mandate and enforcement. Look for: (1) mandatory training for all relevant employees, (2) completion tracking and reporting, (3) consequences for non-completion, (4) new hire training requirements, (5) role-specific training modules, (6) senior management and board training. Strong programs have mandatory training with strict enforcement and consequences.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - mandatory with tracked completion and consequences': 5,
              'Yes - mandatory with tracking': 4,
              'Mandatory but not consistently enforced': 3,
              'Recommended but optional': 2,
              'No mandatory training': 1
            }
          },
          tags: ['training', 'mandatory', 'compliance-culture', 'enforcement']
        },
        {
          question: 'Are training programs role-specific?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: true,
          placeholder: 'Describe front office training, operations training, MLRO/compliance training, IT/technology training, board/senior management training...',
          helpText: 'Role-specific training ensures relevant and effective learning',
          aiPromptHint: 'Evaluate training customization. Look for: (1) role-based training modules (front office, middle office, back office, compliance, IT, board), (2) content tailored to job functions and risks, (3) different depth/complexity by role, (4) practical scenarios relevant to roles, (5) specialized training for high-risk roles. Strong programs have comprehensive role-specific training with varying depth.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['role-specific', 'customized', 'tailored', 'front office', 'compliance', 'board training', 'specialized', 'job function'],
              negative: ['generic', 'one-size-fits-all', 'no customization', 'same for all']
            }
          },
          tags: ['role-based', 'training-customization', 'targeted-training']
        },
        {
          question: 'How are training completion rates tracked?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'Automated tracking with real-time dashboards',
            'Automated tracking with periodic reporting',
            'Manual tracking',
            'Informal tracking',
            'Not systematically tracked'
          ],
          helpText: 'Tracking ensures accountability and identifies gaps',
          aiPromptHint: 'Assess training tracking capability. Look for: (1) automated tracking via LMS, (2) real-time completion dashboards, (3) reporting to management and board, (4) tracking of overdue training, (5) individual completion records, (6) audit trail for regulatory reviews. Strong programs have automated tracking with real-time visibility and escalation for overdue training.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Automated tracking with real-time dashboards': 5,
              'Automated tracking with periodic reporting': 4,
              'Manual tracking': 3,
              'Informal tracking': 2,
              'Not systematically tracked': 1
            }
          },
          tags: ['tracking', 'lms', 'completion-rates', 'reporting']
        },
        {
          question: 'Are real-life case studies included in training?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          placeholder: 'Describe typologies and scenarios used, lessons learned from incidents, internal cases (anonymized), regulatory enforcement actions...',
          helpText: 'Case studies make training practical and memorable',
          aiPromptHint: 'Evaluate use of case studies. Look for: (1) real-life examples and scenarios, (2) internal cases (appropriately anonymized), (3) regulatory enforcement actions, (4) typology-based scenarios, (5) lessons learned integration, (6) interactive exercises. Strong programs use extensive case studies including internal lessons learned for practical, engaging training.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['case studies', 'real-life', 'scenarios', 'lessons learned', 'enforcement actions', 'internal cases', 'typologies', 'interactive'],
              negative: ['theoretical only', 'no examples', 'generic', 'no case studies']
            }
          },
          tags: ['case-studies', 'scenarios', 'practical-training', 'lessons-learned']
        },
        {
          question: 'How frequently is FCC training provided?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Annually with interim updates for changes',
            'Annually',
            'Every 2 years',
            'Irregular/as needed',
            'One-time only'
          ],
          helpText: 'Regular training reinforces knowledge and addresses changes',
          aiPromptHint: 'Assess training frequency. Look for: (1) at least annual training, (2) interim updates for significant regulatory changes, (3) new hire onboarding training, (4) role transition training, (5) refresh training after incidents. Strong programs provide annual training with interim updates for material changes.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Annually with interim updates for changes': 5,
              'Annually': 4,
              'Every 2 years': 3,
              'Irregular/as needed': 2,
              'One-time only': 1
            }
          },
          tags: ['training-frequency', 'annual-training', 'refresher-training']
        },
        {
          question: 'Are awareness campaigns conducted to reinforce culture?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          placeholder: 'Describe campaign frequency and themes, communication channels, engagement measurement, senior management involvement...',
          helpText: 'Campaigns supplement training and maintain visibility',
          aiPromptHint: 'Evaluate awareness campaign effectiveness. Look for: (1) regular campaigns (quarterly or more frequent), (2) varied themes (typologies, red flags, updates, successes), (3) multiple channels (email, intranet, posters, videos), (4) engagement metrics, (5) senior management participation and endorsement, (6) creative and memorable messaging. Strong programs have frequent campaigns with senior leadership visibility.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['campaigns', 'regular', 'quarterly', 'multiple channels', 'engagement', 'senior management', 'themes', 'creative'],
              negative: ['no campaigns', 'infrequent', 'one-way', 'no engagement', 'informal']
            }
          },
          tags: ['awareness-campaigns', 'communication', 'culture-building', 'engagement']
        },
        {
          question: 'Does senior management visibly endorse FCC culture?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - active leadership and tone from the top',
            'Yes - regular messaging and support',
            'Occasional messaging',
            'Minimal visible support',
            'No visible endorsement'
          ],
          helpText: 'Tone from the top is critical for effective compliance culture',
          aiPromptHint: 'Assess tone from the top. Look for: (1) regular senior management communication on FCC importance, (2) visible participation in training and events, (3) FCC performance in management objectives, (4) consequences for compliance failures at all levels, (5) celebration of compliance successes, (6) board-level oversight and challenge. Strong programs have highly visible senior leadership commitment with consistent messaging.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - active leadership and tone from the top': 5,
              'Yes - regular messaging and support': 4,
              'Occasional messaging': 3,
              'Minimal visible support': 2,
              'No visible endorsement': 1
            }
          },
          tags: ['tone-from-top', 'leadership', 'culture', 'senior-management']
        }
      ]
    },
    {
      title: 'Monitoring, Audit & Continuous Improvement',
      description: 'Assessment of performance measurement and program effectiveness',
      weight: 0.0475,  // 4.75% - Continuous improvement and effectiveness testing
      regulatoryPriority: 'Continuous Improvement, Effectiveness Testing',
      order: 11,
      isRequired: true,
      instructions: 'Focus on your program monitoring, audit, and continuous improvement processes',
      questions: [
        {
          question: 'Are internal audits of FCC performed regularly?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Regular audit required
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Annual comprehensive audit with detailed findings',
            'Annual audit covering key areas',
            'Every 2-3 years',
            'Ad hoc audits only',
            'No formal audit program'
          ],
          helpText: 'Independent audit provides assurance and identifies improvement opportunities',
          aiPromptHint: 'Assess internal audit frequency and scope. Look for: (1) annual or more frequent audits, (2) comprehensive scope covering all FCC elements, (3) independent audit function (reports to board/audit committee), (4) risk-based audit approach, (5) detailed findings with risk ratings, (6) management action plans, (7) follow-up on remediation. Strong programs have annual comprehensive audits with independent reporting.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Annual comprehensive audit with detailed findings': 5,
              'Annual audit covering key areas': 4,
              'Every 2-3 years': 3,
              'Ad hoc audits only': 2,
              'No formal audit program': 1
            }
          },
          tags: ['internal-audit', 'assurance', 'independent-review', 'audit-frequency']
        },
        {
          question: 'Are action plans created and tracked for remediation?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: true,
          placeholder: 'Describe issue tracking system, ownership assignment, deadline management, progress reporting...',
          helpText: 'Systematic remediation tracking ensures issues are addressed',
          aiPromptHint: 'Evaluate remediation tracking. Look for: (1) centralized tracking system for audit findings and issues, (2) clear ownership assignment, (3) remediation deadlines with risk-based prioritization, (4) progress monitoring and reporting, (5) escalation for overdue items, (6) verification of completion, (7) board/management reporting. Strong programs have rigorous tracking with escalation and verification.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['tracking system', 'ownership', 'deadlines', 'progress monitoring', 'escalation', 'verification', 'reporting', 'systematic'],
              negative: ['informal', 'no tracking', 'inconsistent', 'overdue', 'no follow-up']
            }
          },
          tags: ['remediation', 'action-plans', 'issue-tracking', 'accountability']
        },
        {
          question: 'What KPIs are monitored for FCC program effectiveness?',
          type: QuestionType.MULTISELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'Alert volumes and trends',
            'SAR/STR filing statistics',
            'False positive rates',
            'Investigation timeframes',
            'Training completion rates',
            'Audit findings and remediation',
            'Regulatory findings',
            'Customer risk profile changes',
            'System uptime and performance',
            'None tracked'
          ],
          helpText: 'KPIs provide visibility into program effectiveness',
          aiPromptHint: 'Assess KPI comprehensiveness. Look for: (1) tracking of multiple KPIs across FCC elements, (2) leading and lagging indicators, (3) trend analysis, (4) targets and thresholds, (5) regular reporting to management and board, (6) KPI dashboard, (7) action triggers when KPIs deteriorate. Strong programs monitor 7+ KPIs with dashboards and governance. Flag if "None tracked" selected.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '0': 1,
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['kpis', 'metrics', 'effectiveness', 'monitoring', 'performance']
        },
        {
          question: 'Is root cause analysis performed for recurring issues?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: true,
          placeholder: 'Describe RCA methodology, issue pattern identification, corrective action implementation, effectiveness validation...',
          helpText: 'RCA prevents recurrence and drives improvement',
          aiPromptHint: 'Evaluate root cause analysis process. Look for: (1) documented RCA methodology (5 Whys, fishbone, etc.), (2) RCA for significant issues and patterns, (3) identification of systemic vs. isolated issues, (4) corrective action plan development, (5) implementation and validation, (6) lessons learned documentation and sharing. Strong programs have systematic RCA with validated corrective actions.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['root cause', 'rca', 'methodology', 'corrective action', 'systematic', 'patterns', 'validation', 'lessons learned'],
              negative: ['no rca', 'superficial', 'symptoms only', 'informal', 'no follow-up']
            }
          },
          tags: ['root-cause-analysis', 'rca', 'continuous-improvement', 'corrective-action']
        },
        {
          question: 'Are external benchmarks or peer reviews conducted?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Regular external benchmarking with industry peers',
            'Periodic external reviews',
            'Occasional participation in industry surveys',
            'Informal peer comparisons',
            'No external benchmarking'
          ],
          helpText: 'External perspective helps identify improvement opportunities',
          aiPromptHint: 'Assess external benchmarking. Look for: (1) participation in industry benchmarking studies, (2) peer reviews or assessments, (3) comparison against industry standards and practices, (4) external consultant reviews, (5) regulatory peer group analysis, (6) action plans from benchmarking insights. Strong programs regularly benchmark with structured action planning.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Regular external benchmarking with industry peers': 5,
              'Periodic external reviews': 4,
              'Occasional participation in industry surveys': 3,
              'Informal peer comparisons': 2,
              'No external benchmarking': 1
            }
          },
          tags: ['benchmarking', 'peer-review', 'external-assessment', 'best-practices']
        },
        {
          question: 'Is an annual FCC effectiveness report produced?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - comprehensive report to board with recommendations',
            'Yes - detailed report to management',
            'Yes - basic annual summary',
            'Periodic reports',
            'No formal effectiveness reporting'
          ],
          helpText: 'Annual effectiveness assessment demonstrates accountability',
          aiPromptHint: 'Evaluate effectiveness reporting. Look for: (1) comprehensive annual report, (2) assessment against objectives and regulatory requirements, (3) KPI analysis and trends, (4) strengths and weaknesses identification, (5) improvement recommendations with priorities, (6) board presentation and discussion, (7) external validation or audit input. Strong programs produce detailed annual reports to the board with actionable recommendations.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive report to board with recommendations': 5,
              'Yes - detailed report to management': 4,
              'Yes - basic annual summary': 3,
              'Periodic reports': 2,
              'No formal effectiveness reporting': 1
            }
          },
          tags: ['effectiveness-report', 'annual-review', 'board-reporting', 'assessment']
        }
      ]
    },
    {
      title: 'AI Readiness & Responsible Use',
      description: 'Assessment of AI governance, model validation, and EU AI Act compliance (Optional Module)',
      weight: 0.05,  // 5% - Growing importance as AI adoption increases
      regulatoryPriority: 'EU AI Act, Model Risk Management',
      order: 12,
      isRequired: false,  // Optional module
      instructions: 'Focus on your AI strategy, governance, and responsible use practices (Optional - complete if using AI)',
      questions: [
        {
          question: 'Has the organization defined an AI strategy for compliance?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Strategy required for AI use
          isFoundational: true,
          order: 1,
          isRequired: false,
          options: [
            'Yes - comprehensive strategy with governance',
            'Yes - initial strategy documented',
            'Under development',
            'Being considered',
            'No strategy'
          ],
          helpText: 'AI strategy provides direction for responsible adoption',
          aiPromptHint: 'Assess AI strategy maturity. Look for: (1) documented AI strategy for compliance use cases, (2) alignment with business and compliance objectives, (3) governance framework, (4) risk assessment and controls, (5) ethical principles, (6) board approval and oversight, (7) resource allocation. Strong programs have comprehensive strategies with clear governance.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive strategy with governance': 5,
              'Yes - initial strategy documented': 4,
              'Under development': 3,
              'Being considered': 2,
              'No strategy': 1
            }
          },
          tags: ['ai-strategy', 'governance', 'strategic-planning', 'ai-adoption']
        },
        {
          question: 'Is there an AI governance or ethics committee?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 2,
          isRequired: false,
          options: [
            'Yes - active committee with compliance representation',
            'Yes - committee recently formed',
            'Informal governance group',
            'Under consideration',
            'No committee'
          ],
          helpText: 'Governance committee provides oversight and ethical guidance',
          aiPromptHint: 'Evaluate AI governance structure. Look for: (1) formal AI governance committee or ethics board, (2) compliance and risk representation, (3) regular meeting cadence, (4) decision-making authority, (5) model approval process, (6) ethical guidelines and principles, (7) escalation path to board. Strong programs have active committees with cross-functional representation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - active committee with compliance representation': 5,
              'Yes - committee recently formed': 4,
              'Informal governance group': 3,
              'Under consideration': 2,
              'No committee': 1
            }
          },
          tags: ['ai-governance', 'ethics-committee', 'oversight', 'governance-structure']
        },
        {
          question: 'Are all AI tools inventoried and risk-classified?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 3,
          isRequired: false,
          placeholder: 'Describe complete AI tool inventory, risk classification (high/medium/low per EU AI Act), ownership and accountability, use case documentation...',
          helpText: 'Inventory enables proper governance and risk management',
          aiPromptHint: 'Assess AI inventory and classification. Look for: (1) complete inventory of all AI tools and models, (2) risk classification per EU AI Act (unacceptable/high/limited/minimal), (3) ownership and accountability assignment, (4) use case documentation, (5) vendor vs. developed-in-house identification, (6) regular inventory updates. Strong programs maintain comprehensive inventories with risk-based classification.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['inventory', 'classification', 'high risk', 'eu ai act', 'ownership', 'use cases', 'documented', 'maintained'],
              negative: ['no inventory', 'unknown', 'informal', 'partial', 'outdated']
            }
          },
          tags: ['ai-inventory', 'risk-classification', 'eu-ai-act', 'model-registry']
        },
        {
          question: 'Are AI outputs explainable to compliance staff and regulators?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 4,
          isRequired: false,
          options: [
            'Fully explainable with documentation and dashboards',
            'Mostly explainable with some black boxes',
            'Partially explainable',
            'Limited explainability',
            'Black box models with no explainability'
          ],
          helpText: 'Explainability is critical for regulatory acceptance and trust',
          aiPromptHint: 'Evaluate AI explainability. Look for: (1) explainable AI (XAI) techniques, (2) model documentation and transparency, (3) output reasoning and feature importance, (4) user-friendly explanations for compliance staff, (5) regulatory-grade documentation, (6) audit trail of decisions. Strong programs prioritize explainability with comprehensive documentation. Black box models present regulatory risk.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Fully explainable with documentation and dashboards': 5,
              'Mostly explainable with some black boxes': 4,
              'Partially explainable': 3,
              'Limited explainability': 2,
              'Black box models with no explainability': 1
            }
          },
          tags: ['explainability', 'xai', 'transparency', 'interpretability']
        },
        {
          question: 'What model validation procedures exist?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 5,
          isRequired: false,
          placeholder: 'Describe pre-deployment testing, performance monitoring, validation documentation, revalidation triggers...',
          helpText: 'Validation ensures models perform as intended and remain accurate',
          aiPromptHint: 'Assess model validation rigor. Look for: (1) pre-deployment validation (accuracy, bias, performance), (2) independent validation (model risk management), (3) ongoing performance monitoring, (4) validation documentation and evidence, (5) revalidation triggers (performance degradation, data drift, regulatory changes), (6) model versioning and change control. Strong programs have comprehensive validation with independent review.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['validation', 'pre-deployment', 'testing', 'monitoring', 'independent', 'documented', 'performance', 'revalidation', 'drift detection'],
              negative: ['no validation', 'informal', 'untested', 'no monitoring', 'black box']
            }
          },
          tags: ['model-validation', 'testing', 'performance-monitoring', 'model-risk']
        },
        {
          question: 'Is there human oversight for AI-assisted decisions?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational - Human-in-loop critical for compliance
          isFoundational: true,
          order: 6,
          isRequired: false,
          options: [
            'Always - documented human-in-the-loop',
            'Usually - informal oversight',
            'Sometimes for high-risk decisions',
            'Minimal oversight',
            'No human oversight'
          ],
          helpText: 'Human oversight ensures accountability and prevents automated errors',
          aiPromptHint: 'Evaluate human-in-the-loop controls. Look for: (1) documented human oversight requirement, (2) human decision authority (AI as advisor not decision-maker), (3) human review before material actions, (4) override capability, (5) escalation procedures, (6) audit trail of human decisions. Strong programs require human-in-loop for all significant compliance decisions. Fully automated decisions present regulatory and reputational risk.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Always - documented human-in-the-loop': 5,
              'Usually - informal oversight': 4,
              'Sometimes for high-risk decisions': 3,
              'Minimal oversight': 2,
              'No human oversight': 1
            }
          },
          tags: ['human-in-loop', 'oversight', 'accountability', 'human-oversight']
        },
        {
          question: 'How are bias and fairness reviews performed?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 7,
          isRequired: false,
          placeholder: 'Describe review frequency, testing methodologies, remediation processes, documentation...',
          helpText: 'Bias reviews prevent discriminatory outcomes',
          aiPromptHint: 'Assess bias and fairness testing. Look for: (1) regular bias testing (pre-deployment and ongoing), (2) testing methodologies (disparate impact, fairness metrics), (3) protected characteristic analysis, (4) bias remediation procedures, (5) documentation and reporting, (6) diverse stakeholder input, (7) ethical review. Strong programs have systematic bias testing with remediation and transparency.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['bias testing', 'fairness', 'regular review', 'methodologies', 'remediation', 'documented', 'disparate impact', 'protected characteristics'],
              negative: ['no testing', 'informal', 'not considered', 'no remediation']
            }
          },
          tags: ['bias-testing', 'fairness', 'ethics', 'discrimination-prevention']
        },
        {
          question: 'Are AI systems categorized under EU AI Act?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 8,
          isRequired: false,
          options: [
            'Yes - formally categorized with compliance plan',
            'Assessment in progress',
            'Planning to assess',
            'Not yet assessed',
            'Not applicable'
          ],
          helpText: 'EU AI Act requires risk categorization and compliance',
          aiPromptHint: 'Evaluate EU AI Act compliance. Look for: (1) formal categorization of systems (unacceptable/high/limited/minimal risk), (2) compliance requirements identification per category, (3) compliance plan and timeline, (4) documentation and record-keeping, (5) conformity assessment for high-risk systems, (6) legal analysis and monitoring. Strong programs have completed categorization with compliance roadmaps.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formally categorized with compliance plan': 5,
              'Assessment in progress': 4,
              'Planning to assess': 3,
              'Not yet assessed': 2,
              'Not applicable': 1
            }
          },
          tags: ['eu-ai-act', 'risk-categorization', 'compliance', 'regulatory']
        },
        {
          question: 'What due diligence is performed on AI vendors?',
          type: QuestionType.TEXT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 9,
          isRequired: false,
          placeholder: 'Describe contract clauses (liability, IP, data use), vendor validation and certification, ongoing monitoring, exit strategy...',
          helpText: 'Vendor due diligence ensures quality and manages risk',
          aiPromptHint: 'Assess AI vendor management. Look for: (1) comprehensive due diligence (technical, operational, compliance), (2) contract protections (liability, IP, data use, audit rights), (3) vendor certifications and validation, (4) ongoing performance monitoring, (5) vendor risk assessment, (6) exit and transition planning, (7) vendor concentration risk. Strong programs have rigorous vendor due diligence with contractual protections.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['due diligence', 'contract', 'liability', 'validation', 'monitoring', 'audit rights', 'exit strategy', 'certifications'],
              negative: ['no diligence', 'informal', 'no contracts', 'unmonitored', 'no exit plan']
            }
          },
          tags: ['vendor-management', 'due-diligence', 'contracts', 'third-party-risk']
        },
        {
          question: 'Are fallback processes defined if AI fails?',
          type: QuestionType.SELECT,
          weight: 1.0,  // Standard question
          isFoundational: false,
          order: 10,
          isRequired: false,
          options: [
            'Yes - documented and tested fallback procedures',
            'Yes - informal backup plans',
            'Partially defined',
            'Under development',
            'No fallback plans'
          ],
          helpText: 'Fallback ensures business continuity if AI systems fail',
          aiPromptHint: 'Evaluate business continuity planning for AI. Look for: (1) documented fallback procedures, (2) manual process capability, (3) fallback testing and drills, (4) rapid detection of AI failures, (5) escalation procedures, (6) communication plans, (7) recovery procedures. Strong programs have tested fallback plans to ensure resilience.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - documented and tested fallback procedures': 5,
              'Yes - informal backup plans': 4,
              'Partially defined': 3,
              'Under development': 2,
              'No fallback plans': 1
            }
          },
          tags: ['business-continuity', 'fallback', 'resilience', 'disaster-recovery']
        }
      ]
    }
  ]
};

/**
 * Normalize question weights within a section to sum to 1.0
 * @param questions Array of questions with raw weights
 * @returns Array of questions with normalized weights
 */
function normalizeQuestionWeights(questions: QuestionData[]): QuestionData[] {
  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);

  if (totalWeight === 0) {
    // If all weights are 0, distribute equally
    return questions.map(q => ({ ...q, weight: 1.0 / questions.length }));
  }

  return questions.map(q => ({
    ...q,
    weight: q.weight / totalWeight  // Normalize to sum=1.0
  }));
}

/**
 * Seed the Financial Crime v3.0 template
 */
export async function seedEnhancedTemplates() {
  console.log('🌱 Starting Financial Crime Template v3.0 seeding...');

  try {
    // 1. Check if v3.0 already exists
    const existing = await prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' }
    });

    if (existing) {
      console.log('⚠️  v3.0 template already exists (id: ' + existing.id + '). Skipping...');
      console.log('💡 To re-seed, first delete the template:');
      console.log('   DELETE FROM "Template" WHERE slug = \'financial-crime-compliance-v3\';');
      return existing;
    }

    // 2. Validate section weights sum to 1.0
    const sectionWeightSum = FINANCIAL_CRIME_ENHANCED_TEMPLATE.sections
      .reduce((sum, s) => sum + s.weight, 0);

    if (Math.abs(sectionWeightSum - 1.0) > 0.001) {
      throw new Error(
        `Section weights sum to ${sectionWeightSum.toFixed(4)}, must equal 1.0 ` +
        `(difference: ${(sectionWeightSum - 1.0).toFixed(4)})`
      );
    }

    // 3. Normalize question weights per section
    const sectionsWithNormalizedQuestions = FINANCIAL_CRIME_ENHANCED_TEMPLATE.sections.map(section => ({
      ...section,
      questions: normalizeQuestionWeights(section.questions)
    }));

    // 4. Create template with sections and questions
    const template = await prisma.template.create({
      data: {
        name: FINANCIAL_CRIME_ENHANCED_TEMPLATE.name,
        slug: FINANCIAL_CRIME_ENHANCED_TEMPLATE.slug,
        description: FINANCIAL_CRIME_ENHANCED_TEMPLATE.description,
        category: FINANCIAL_CRIME_ENHANCED_TEMPLATE.category,
        version: FINANCIAL_CRIME_ENHANCED_TEMPLATE.version,
        isActive: FINANCIAL_CRIME_ENHANCED_TEMPLATE.isActive,
        estimatedMinutes: FINANCIAL_CRIME_ENHANCED_TEMPLATE.estimatedMinutes,
        tags: FINANCIAL_CRIME_ENHANCED_TEMPLATE.tags,
        createdBy: 'system',
        sections: {
          create: sectionsWithNormalizedQuestions.map(sectionData => ({
            title: sectionData.title,
            description: sectionData.description,
            weight: sectionData.weight,
            regulatoryPriority: sectionData.regulatoryPriority,
            order: sectionData.order,
            isRequired: sectionData.isRequired,
            questions: {
              create: sectionData.questions.map(questionData => ({
                text: questionData.question,
                type: questionData.type,
                weight: questionData.weight,
                isFoundational: questionData.isFoundational,
                required: questionData.isRequired,
                options: questionData.options || [],
                helpText: questionData.helpText,
                order: questionData.order,
                categoryTag: questionData.tags[0] || null,
                tags: questionData.tags,
                aiPromptHint: questionData.aiPromptHint,
                scoringRules: questionData.scoringRules,
                validation: questionData.validationRules || null,
              }))
            }
          }))
        }
      },
      include: {
        sections: {
          include: {
            questions: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    // 5. Verify and report
    const sectionCount = template.sections.length;
    const questionCount = template.sections.reduce(
      (sum, s) => sum + s.questions.length,
      0
    );
    const foundationalCount = template.sections.reduce(
      (sum, s) => sum + s.questions.filter(q => q.isFoundational).length,
      0
    );

    console.log('✅ v3.0 template seeded successfully');
    console.log(`   Template ID: ${template.id}`);
    console.log(`   Sections: ${sectionCount}`);
    console.log(`   Questions: ${questionCount}`);
    console.log(`   Foundational Questions: ${foundationalCount}`);
    console.log(`   Version: ${template.version}`);
    console.log(`   Active: ${template.isActive}`);
    console.log(`   Estimated Duration: ${FINANCIAL_CRIME_ENHANCED_TEMPLATE.estimatedMinutes} minutes`);

    // 6. Validate question weights per section
    for (const section of template.sections) {
      const qWeightSum = section.questions.reduce((sum, q) => sum + q.weight, 0);
      if (Math.abs(qWeightSum - 1.0) > 0.001) {
        console.warn(`⚠️  Section "${section.title}" question weights sum to ${qWeightSum.toFixed(4)}`);
      }
    }

    return template;

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * Clear the v3.0 template (for re-seeding or cleanup)
 */
export async function clearEnhancedTemplates() {
  console.log('🧹 Clearing Financial Crime Template v3.0...');

  try {
    const template = await prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' },
      include: {
        assessments: true
      }
    });

    if (!template) {
      console.log('ℹ️  v3.0 template not found. Nothing to clear.');
      return;
    }

    // Check if any assessments exist
    if (template.assessments.length > 0) {
      console.log(`⚠️  WARNING: ${template.assessments.length} assessments exist for this template.`);
      console.log('⚠️  Deletion will cascade to assessments, answers, gaps, risks, etc.');
      console.log('⚠️  Use with caution. Consider deactivating instead:');
      console.log('     UPDATE "Template" SET "isActive" = false WHERE slug = \'financial-crime-compliance-v3\';');
      throw new Error('Cannot delete template with existing assessments. Deactivate instead.');
    }

    // Safe to delete (no assessments)
    await prisma.template.delete({
      where: { slug: 'financial-crime-compliance-v3' }
    });

    console.log('✅ v3.0 template cleared successfully');

  } catch (error) {
    console.error('❌ Clearing failed:', error);
    throw error;
  }
}
