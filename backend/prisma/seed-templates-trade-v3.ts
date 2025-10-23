/**
 * Trade Compliance Assessment Template v3.0
 * Comprehensive trade compliance framework covering international trade regulations
 *
 * Coverage: 10 core sections
 * Questions: 105 total (33 foundational)
 * Duration: 105 minutes
 *
 * Improvements over v2.0:
 * - Expanded from 25 to 105 questions (4x increase)
 * - Added dedicated sections for:
 *   - Trade Risk Assessment Framework (10 questions)
 *   - Trade Finance for Banks (10 questions)
 *   - Supply Chain & End-Use Controls (10 questions)
 *   - Data, Technology & Recordkeeping (10 questions)
 *   - Training & Culture (10 questions)
 *   - Monitoring, Audit & Continuous Improvement (10 questions)
 *   - AI Readiness & Responsible Use (20 questions)
 * - Enhanced existing sections with deeper coverage:
 *   - Governance & Regulatory Readiness (5→10 questions)
 *   - Sanctions & Export Control Management (5→10 questions)
 *   - Customs & Documentation (5→10 questions)
 * - Regulatory-priority weighting aligned with WCO, OFAC, BIS, EU frameworks
 * - 50 foundational questions (42%) representing critical regulatory requirements
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
  regulatoryPriority?: string;
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

export const TRADE_COMPLIANCE_V3_TEMPLATE: TemplateData = {
  name: 'Trade Compliance Assessment v3.0',
  slug: 'trade-compliance-assessment-v3',
  category: TemplateCategory.TRADE_COMPLIANCE,
  description: 'Comprehensive enterprise-grade trade compliance assessment covering sanctions, export controls, customs, trade finance, supply chain due diligence, and AI readiness. Aligned with OFAC, BIS EAR, ITAR, EU Customs Code, WCO Framework, ICC UCP 600, Wolfsberg TBML Guidance, UFLPA, and EU AI Act requirements.',
  version: '3.0',
  estimatedMinutes: 105,
  instructions: `
This comprehensive assessment evaluates your organization's trade compliance program across 10 critical areas:

1. **Governance & Regulatory Readiness**: Organizational structure, policies, oversight, and regulatory change management
2. **Trade Risk Assessment Framework**: Systematic risk identification, categorization, and control mapping
3. **Sanctions & Export Control Management**: Critical controls for sanctions compliance and export restrictions
4. **Trade Finance (Banks)**: Trade finance-specific controls for financial institutions
5. **Customs & Documentation (Corporates)**: Import/export documentation and customs compliance for trading companies
6. **Supply Chain & End-Use Controls**: Supplier due diligence, end-use verification, and supply chain risk management
7. **Data, Technology & Recordkeeping**: Technology infrastructure, data management, and recordkeeping compliance
8. **Training & Culture**: Employee training, awareness programs, and compliance culture development
9. **Monitoring, Audit & Continuous Improvement**: Compliance monitoring, auditing, and program effectiveness
10. **AI Readiness & Responsible Use**: AI governance, ethics, and responsible use in trade compliance operations

**Instructions:**
- Answer all questions honestly and thoroughly
- Provide specific examples where requested
- Upload supporting documentation when available (policies, procedures, audit reports, training records)
- If unsure about a question, provide your best assessment and note any uncertainties
- Some sections may be more relevant to specific organization types (banks vs corporates)

**Regulatory Frameworks Covered:**
- OFAC Sanctions Framework
- BIS Export Administration Regulations (EAR)
- ITAR (International Traffic in Arms Regulations)
- WCO Framework of Standards
- EU Customs Code
- ICC Uniform Customs and Practice (UCP 600)
- Wolfsberg Trade-Based Money Laundering Guidance
- UFLPA (Uyghur Forced Labor Prevention Act)
- EU AI Act
- ISO 31000 Risk Management
- COSO Enterprise Risk Management

Your responses will be analyzed using AI to identify gaps, assess risks, and generate tailored recommendations aligned with international trade regulations.
  `,
  isActive: true,
  tags: ['trade-compliance', 'sanctions', 'export-control', 'customs', 'trade-finance', 'supply-chain', 'tbml', 'ai-readiness', 'enterprise', 'v3'],
  sections: [
    {
      title: 'Governance & Regulatory Readiness',
      description: 'Foundation of the trade compliance program including organizational structure, policies, and oversight',
      weight: 0.14,  // 14% - HIGHEST (Foundation)
      regulatoryPriority: 'WCO Framework, OFAC/BIS/ITAR, EU Customs Code',
      order: 1,
      isRequired: true,
      instructions: 'Focus on your compliance program governance and regulatory preparedness',
      questions: [
        {
          question: 'Is there a Trade Compliance Officer or equivalent role?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - dedicated full-time Trade Compliance Officer',
            'Yes - part-time designated officer with trade compliance focus',
            'General compliance officer handling trade compliance',
            'Senior management member',
            'External consultant',
            'No designated officer'
          ],
          helpText: 'The Trade Compliance Officer should have appropriate authority, resources, and direct access to senior management',
          aiPromptHint: 'Assess the appropriateness of TCO designation considering organizational size, trade complexity, and regulatory requirements. Evaluate independence, authority level, and adequacy of resources.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - dedicated full-time Trade Compliance Officer': 5,
              'Yes - part-time designated officer with trade compliance focus': 4,
              'General compliance officer handling trade compliance': 3,
              'Senior management member': 3,
              'External consultant': 2,
              'No designated officer': 1
            }
          },
          tags: ['governance', 'tco', 'organization', 'foundational']
        },
        {
          question: 'Are responsibilities defined across logistics, finance, and compliance teams?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Yes - comprehensive RACI matrix with clear ownership',
            'Yes - responsibilities documented but some gaps',
            'Partially defined - informal understanding',
            'No - responsibilities unclear or overlapping',
            'Not applicable - single person/team handles all'
          ],
          helpText: 'Clear role definition prevents compliance gaps and ensures accountability across cross-functional teams',
          aiPromptHint: 'Evaluate the clarity and comprehensiveness of role definitions across trade compliance functions. Look for formal documentation, training on responsibilities, and accountability mechanisms.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive RACI matrix with clear ownership': 5,
              'Yes - responsibilities documented but some gaps': 4,
              'Partially defined - informal understanding': 2,
              'No - responsibilities unclear or overlapping': 1,
              'Not applicable - single person/team handles all': 3
            }
          },
          tags: ['governance', 'organization', 'roles', 'foundational']
        },
        {
          question: 'Are trade compliance policies aligned with applicable regimes (EU, OFAC, BIS, ITAR, UN)?',
          type: QuestionType.MULTISELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 3,
          isRequired: true,
          options: [
            'EU Customs Code and regulations',
            'OFAC sanctions regulations',
            'BIS Export Administration Regulations (EAR)',
            'ITAR (International Traffic in Arms Regulations)',
            'UN Security Council sanctions',
            'WCO Framework of Standards',
            'Local/national customs regulations',
            'No formal policy alignment',
            'Unsure/need assessment'
          ],
          helpText: 'Select all regulatory regimes that apply to your trade operations. Policies should explicitly reference and align with these frameworks.',
          aiPromptHint: 'Assess the comprehensiveness of policy alignment with applicable trade regulations. Look for explicit references to regulatory requirements, regular policy updates to reflect regulatory changes, and coverage of all applicable regimes.',
          scoringRules: {
            scale: 5,
            countBased: true,
            penalties: {
              'No formal policy alignment': -3,
              'Unsure/need assessment': -2
            },
            ranges: {
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['governance', 'policy', 'regulatory-alignment', 'foundational']
        },
        {
          question: 'Are regulatory changes monitored and implemented promptly?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 4,
          isRequired: true,
          options: [
            'Yes - formal monitoring with documented implementation process',
            'Yes - monitoring in place but informal implementation',
            'Partially - ad hoc monitoring only',
            'No - reactive to enforcement/violations only',
            'Unsure/no process'
          ],
          helpText: 'Trade regulations change frequently. Effective monitoring and timely implementation are critical for ongoing compliance.',
          aiPromptHint: 'Evaluate the regulatory change management process. Look for systematic monitoring (subscriptions, alerts, trade associations), documented review processes, timely implementation procedures, and communication to affected staff.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal monitoring with documented implementation process': 5,
              'Yes - monitoring in place but informal implementation': 3,
              'Partially - ad hoc monitoring only': 2,
              'No - reactive to enforcement/violations only': 1,
              'Unsure/no process': 1
            }
          },
          tags: ['governance', 'regulatory-monitoring', 'change-management', 'foundational']
        },
        {
          question: 'Are compliance clauses included in contracts with freight forwarders and agents?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Yes - comprehensive compliance clauses in all contracts',
            'Yes - basic clauses in most contracts',
            'Partially - some contracts only',
            'No - no compliance clauses',
            'Not applicable - no use of freight forwarders/agents'
          ],
          helpText: 'Contractual compliance clauses ensure third parties understand and commit to meeting regulatory requirements',
          aiPromptHint: 'Assess the adequacy of contractual compliance provisions with third-party service providers. Look for specific obligations, audit rights, indemnification, and termination provisions for non-compliance.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive compliance clauses in all contracts': 5,
              'Yes - basic clauses in most contracts': 4,
              'Partially - some contracts only': 2,
              'No - no compliance clauses': 1,
              'Not applicable - no use of freight forwarders/agents': 5
            }
          },
          tags: ['governance', 'contracts', 'third-party']
        },
        {
          question: 'Are escalation procedures established for potential violations?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - documented escalation paths with clear timelines',
            'Yes - informal escalation understanding',
            'Partially - varies by violation type',
            'No formal escalation procedures',
            'Unsure'
          ],
          helpText: 'Clear escalation procedures ensure potential violations are addressed promptly and at appropriate management levels',
          aiPromptHint: 'Evaluate the clarity and adequacy of violation escalation procedures. Look for documented paths, timeframe requirements, decision authority levels, and voluntary self-disclosure protocols.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - documented escalation paths with clear timelines': 5,
              'Yes - informal escalation understanding': 3,
              'Partially - varies by violation type': 2,
              'No formal escalation procedures': 1,
              'Unsure': 1
            }
          },
          tags: ['governance', 'escalation', 'incident-response']
        },
        {
          question: 'Is trade compliance represented in risk committees?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - standing member of risk/compliance committee',
            'Yes - invited as needed',
            'No - not represented',
            'No risk committee exists',
            'Unsure'
          ],
          helpText: 'Representation in risk committees ensures trade compliance risks are considered in enterprise risk management',
          aiPromptHint: 'Assess the integration of trade compliance into enterprise risk governance. Representation in risk committees indicates appropriate elevation and consideration of trade compliance issues.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - standing member of risk/compliance committee': 5,
              'Yes - invited as needed': 3,
              'No - not represented': 1,
              'No risk committee exists': 2,
              'Unsure': 1
            }
          },
          tags: ['governance', 'risk-management', 'committee']
        },
        {
          question: 'Are resources and budgets adequate for compliance obligations?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - fully resourced with adequate budget',
            'Partially - resources adequate but budget constrained',
            'Partially - budget adequate but understaffed',
            'No - inadequate resources and budget',
            'Unsure/not evaluated'
          ],
          helpText: 'Adequate resources (staff, technology, training budget) are essential for effective compliance program execution',
          aiPromptHint: 'Evaluate resource adequacy considering trade volume, complexity, and regulatory requirements. Look for appropriate staffing levels, technology investments, and training budgets.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - fully resourced with adequate budget': 5,
              'Partially - resources adequate but budget constrained': 3,
              'Partially - budget adequate but understaffed': 3,
              'No - inadequate resources and budget': 1,
              'Unsure/not evaluated': 2
            }
          },
          tags: ['governance', 'resources', 'budget']
        },
        {
          question: 'Are trade controls harmonized across group entities?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Yes - centralized policies and controls across all entities',
            'Yes - framework policies with local adaptation',
            'Partially - some harmonization but significant gaps',
            'No - each entity operates independently',
            'Not applicable - single entity'
          ],
          helpText: 'For multi-entity organizations, harmonized controls ensure consistent compliance standards',
          aiPromptHint: 'Assess the degree of control harmonization across organizational entities. Look for centralized policies, shared systems, coordinated training, and consistent enforcement.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - centralized policies and controls across all entities': 5,
              'Yes - framework policies with local adaptation': 4,
              'Partially - some harmonization but significant gaps': 2,
              'No - each entity operates independently': 1,
              'Not applicable - single entity': 5
            }
          },
          tags: ['governance', 'harmonization', 'group-controls']
        }
      ]
    },
    {
      title: 'Trade Risk Assessment Framework',
      description: 'Systematic identification, assessment, and mitigation of trade compliance risks',
      weight: 0.11,  // 11%
      regulatoryPriority: 'WCO Risk Management Framework, ISO 31000',
      order: 2,
      isRequired: true,
      instructions: 'Focus on your risk assessment methodology and how you identify, assess, and manage trade compliance risks',
      questions: [
        {
          question: 'Is a formal trade risk assessment performed annually?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - comprehensive annual risk assessment with documentation',
            'Yes - annual assessment but limited scope',
            'Periodically but not annually',
            'No formal risk assessment',
            'Unsure'
          ],
          helpText: 'Regular risk assessments identify changing risk landscape and inform control priorities',
          aiPromptHint: 'Assess the formality, frequency, and comprehensiveness of trade risk assessments. Annual assessments should be documented, cover all trade activities, and drive resource allocation and control design.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive annual risk assessment with documentation': 5,
              'Yes - annual assessment but limited scope': 3,
              'Periodically but not annually': 2,
              'No formal risk assessment': 1,
              'Unsure': 1
            }
          },
          tags: ['risk-assessment', 'annual', 'foundational']
        },
        {
          question: 'Are risks categorized by goods, geography, and counterparties?',
          type: QuestionType.MULTISELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Product/goods risk classification',
            'Geographic/jurisdiction risk rating',
            'Customer/supplier risk profiling',
            'Transactional risk factors',
            'Operational risk assessment',
            'Third-party/agent risk evaluation',
            'None - no categorization',
            'Unsure'
          ],
          helpText: 'Multi-dimensional risk categorization enables risk-based resource allocation and targeted controls',
          aiPromptHint: 'Evaluate the sophistication of risk categorization. Effective programs assess risks across multiple dimensions (product, geography, counterparty, transaction type) to enable nuanced, risk-based approaches.',
          scoringRules: {
            scale: 5,
            countBased: true,
            penalties: {
              'None - no categorization': -4,
              'Unsure': -2
            },
            ranges: {
              '1-2': 2,
              '3-4': 3,
              '5-6': 5
            }
          },
          tags: ['risk-assessment', 'categorization', 'foundational']
        },
        {
          question: 'Are dual-use goods identified and managed?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 3,
          isRequired: true,
          options: [
            'Yes - comprehensive dual-use identification and control program',
            'Yes - basic identification with some controls',
            'Partially - aware but controls incomplete',
            'No - not specifically addressed',
            'Not applicable - no dual-use goods'
          ],
          helpText: 'Dual-use goods (commercial and military applications) face heightened export controls requiring specific management',
          aiPromptHint: 'Assess dual-use goods management. Look for proper ECCN classification, license requirements tracking, end-use screening, and specialized controls beyond standard commercial goods.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive dual-use identification and control program': 5,
              'Yes - basic identification with some controls': 3,
              'Partially - aware but controls incomplete': 2,
              'No - not specifically addressed': 1,
              'Not applicable - no dual-use goods': 5
            }
          },
          tags: ['risk-assessment', 'dual-use', 'export-control', 'foundational']
        },
        {
          question: 'Are trade-based money laundering (TBML) risks assessed?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - formal TBML risk assessment program',
            'Yes - informal TBML consideration',
            'No - TBML not assessed',
            'Not applicable - no financial services/banking',
            'Unsure'
          ],
          helpText: 'TBML uses trade transactions to disguise illicit funds. Financial institutions and certain industries should assess TBML risks.',
          aiPromptHint: 'Evaluate TBML risk assessment, particularly relevant for financial institutions, trade finance providers, and high-risk industries. Look for red flag indicators, transaction pattern analysis, and cross-border transaction monitoring.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal TBML risk assessment program': 5,
              'Yes - informal TBML consideration': 3,
              'No - TBML not assessed': 1,
              'Not applicable - no financial services/banking': 4,
              'Unsure': 1
            }
          },
          tags: ['risk-assessment', 'tbml', 'money-laundering']
        },
        {
          question: 'Are sanctions and export control exposures documented?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Yes - comprehensive documentation of all exposures',
            'Yes - basic documentation',
            'Partially - some gaps in documentation',
            'No documentation',
            'Unsure of exposures'
          ],
          helpText: 'Documented exposures inform control design and enable management oversight',
          aiPromptHint: 'Assess the documentation of sanctions and export control risk exposures. Look for identification of applicable regimes, prohibited/restricted parties, embargoed destinations, and controlled items.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive documentation of all exposures': 5,
              'Yes - basic documentation': 3,
              'Partially - some gaps in documentation': 2,
              'No documentation': 1,
              'Unsure of exposures': 1
            }
          },
          tags: ['risk-assessment', 'documentation', 'sanctions', 'export-control']
        },
        {
          question: 'Are risk ratings updated after geopolitical events or regulatory changes?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - dynamic risk ratings updated promptly',
            'Yes - periodic updates after major events',
            'No - static annual ratings only',
            'No formal risk rating updates',
            'Unsure'
          ],
          helpText: 'Geopolitical events and regulatory changes can rapidly alter risk landscape requiring timely reassessment',
          aiPromptHint: 'Evaluate the agility of risk assessment processes. Effective programs update risk ratings in response to sanctions announcements, conflicts, regulatory changes, and other relevant events.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - dynamic risk ratings updated promptly': 5,
              'Yes - periodic updates after major events': 3,
              'No - static annual ratings only': 2,
              'No formal risk rating updates': 1,
              'Unsure': 1
            }
          },
          tags: ['risk-assessment', 'dynamic', 'geopolitical']
        },
        {
          question: 'Are risk results reported to management?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - regular comprehensive risk reporting to senior management/board',
            'Yes - periodic summary reporting',
            'Yes - reporting upon request only',
            'No formal risk reporting to management',
            'Unsure'
          ],
          helpText: 'Management reporting ensures risk awareness at appropriate levels and enables informed decision-making',
          aiPromptHint: 'Assess the frequency, detail, and audience of risk reporting. Effective programs provide regular, comprehensive reports to senior management/board including risk trends, mitigation progress, and resource needs.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - regular comprehensive risk reporting to senior management/board': 5,
              'Yes - periodic summary reporting': 3,
              'Yes - reporting upon request only': 2,
              'No formal risk reporting to management': 1,
              'Unsure': 1
            }
          },
          tags: ['risk-assessment', 'reporting', 'management']
        },
        {
          question: 'Are controls mapped to mitigate identified risks?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - comprehensive risk-to-control mapping',
            'Yes - basic mapping for high risks',
            'Partially - some mapping but incomplete',
            'No formal risk-to-control mapping',
            'Unsure'
          ],
          helpText: 'Control mapping ensures identified risks have corresponding mitigating controls and identifies control gaps',
          aiPromptHint: 'Evaluate the linkage between identified risks and implemented controls. Look for formal risk-control matrices, gap identification, and control effectiveness assessment.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive risk-to-control mapping': 5,
              'Yes - basic mapping for high risks': 3,
              'Partially - some mapping but incomplete': 2,
              'No formal risk-to-control mapping': 1,
              'Unsure': 1
            }
          },
          tags: ['risk-assessment', 'controls', 'mapping']
        },
        {
          question: 'Are TBML typologies incorporated into risk assessments?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Yes - comprehensive TBML typology assessment',
            'Yes - basic typology awareness',
            'No - TBML typologies not incorporated',
            'Not applicable - no TBML risk',
            'Unsure'
          ],
          helpText: 'TBML typologies (over/under invoicing, phantom shipping, etc.) should inform transaction monitoring and risk assessment',
          aiPromptHint: 'For organizations with TBML risk exposure (financial institutions, trade finance), assess incorporation of known typologies into risk assessments and detection systems.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive TBML typology assessment': 5,
              'Yes - basic typology awareness': 3,
              'No - TBML typologies not incorporated': 1,
              'Not applicable - no TBML risk': 4,
              'Unsure': 1
            }
          },
          tags: ['risk-assessment', 'tbml', 'typologies']
        },
        {
          question: 'Is trade risk integrated with the overall FCC (Financial Crime Compliance) framework?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Yes - fully integrated trade and FCC risk frameworks',
            'Yes - some integration points',
            'No - separate frameworks',
            'Not applicable - no FCC framework',
            'Unsure'
          ],
          helpText: 'For financial institutions, integration ensures holistic view of compliance risks and efficient resource allocation',
          aiPromptHint: 'Assess integration of trade compliance risk with broader financial crime compliance (AML, sanctions, fraud). Look for unified risk assessment, shared data/systems, and coordinated controls.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - fully integrated trade and FCC risk frameworks': 5,
              'Yes - some integration points': 3,
              'No - separate frameworks': 2,
              'Not applicable - no FCC framework': 4,
              'Unsure': 1
            }
          },
          tags: ['risk-assessment', 'integration', 'fcc']
        }
      ]
    },
    {
      title: 'Sanctions & Export Control Management',
      description: 'Critical controls for sanctions compliance and export control management',
      weight: 0.13,  // 13%
      regulatoryPriority: 'OFAC, BIS EAR, ITAR, EU Sanctions',
      order: 3,
      isRequired: true,
      instructions: 'Focus on sanctions screening, export controls, and compliance verification',
      questions: [
        {
          question: 'Are counterparties screened against restricted and denied party lists?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - automated screening against comprehensive lists',
            'Yes - manual screening against key lists',
            'Partially - inconsistent screening',
            'No formal screening program',
            'Unsure'
          ],
          helpText: 'Screening against OFAC SDN, BIS DPL, EU sanctions lists, and other restricted party lists is a fundamental compliance requirement',
          aiPromptHint: 'Assess screening program comprehensiveness. Look for automated systems, coverage of all relevant lists (OFAC SDN, BIS DPL/Entity List, EU consolidated list, UN, etc.), screening at multiple touchpoints (onboarding, transaction, periodic), and documentation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - automated screening against comprehensive lists': 5,
              'Yes - manual screening against key lists': 3,
              'Partially - inconsistent screening': 1,
              'No formal screening program': 1,
              'Unsure': 1
            }
          },
          tags: ['sanctions', 'screening', 'restricted-parties', 'foundational']
        },
        {
          question: 'Are export licenses obtained, monitored, and renewed timely?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Yes - comprehensive license management system',
            'Yes - basic license tracking',
            'Partially - some licenses may lapse',
            'No formal license management',
            'Not applicable - no licensed exports'
          ],
          helpText: 'Export licenses must be obtained before shipment, properly utilized, and renewed before expiration',
          aiPromptHint: 'Evaluate export license management. Look for systems to track license applications, approvals, expirations, and utilization. Assess processes for ensuring shipments comply with license terms and conditions.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive license management system': 5,
              'Yes - basic license tracking': 3,
              'Partially - some licenses may lapse': 1,
              'No formal license management': 1,
              'Not applicable - no licensed exports': 5
            }
          },
          tags: ['export-control', 'licensing', 'management', 'foundational']
        },
        {
          question: 'Are goods classified correctly under HS/ECCN codes with periodic reviews?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 3,
          isRequired: true,
          options: [
            'Yes - formal classification program with expert review and periodic validation',
            'Yes - classification performed with periodic reviews',
            'Yes - initial classification but no periodic reviews',
            'Partially - some items unclassified or misclassified',
            'No formal classification process',
            'Unsure'
          ],
          helpText: 'Accurate classification under Harmonized System (HS) and Export Control Classification Numbers (ECCN) is essential for determining applicable controls and duties. Periodic reviews ensure classifications remain accurate as products and regulations change.',
          aiPromptHint: 'Assess classification accuracy, processes, and review frequency. Look for use of customs/export control experts, formal classification procedures, documentation, periodic reviews (annual or upon product changes), and consideration of regulatory updates to tariff schedules.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal classification program with expert review and periodic validation': 5,
              'Yes - classification performed with periodic reviews': 4,
              'Yes - initial classification but no periodic reviews': 2,
              'Partially - some items unclassified or misclassified': 1,
              'No formal classification process': 1,
              'Unsure': 1
            }
          },
          tags: ['classification', 'hs-codes', 'eccn', 'periodic-review', 'foundational']
        },
        {
          question: 'Are end-use and end-user declarations collected and validated?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 4,
          isRequired: true,
          options: [
            'Yes - comprehensive end-use documentation and validation',
            'Yes - declarations collected but limited validation',
            'Partially - collected for high-risk items only',
            'No end-use documentation collected',
            'Not applicable - no controlled exports'
          ],
          helpText: 'End-use and end-user information is critical for export control compliance and preventing diversion',
          aiPromptHint: 'Evaluate end-use control processes. Look for collection of end-use statements, validation against red flags, ongoing monitoring for diversion indicators, and documentation retention.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive end-use documentation and validation': 5,
              'Yes - declarations collected but limited validation': 3,
              'Partially - collected for high-risk items only': 2,
              'No end-use documentation collected': 1,
              'Not applicable - no controlled exports': 5
            }
          },
          tags: ['export-control', 'end-use', 'validation', 'foundational']
        },
        {
          question: 'Are routing and transshipment risks monitored?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Yes - comprehensive routing analysis and red flag monitoring',
            'Yes - basic routing review',
            'No formal routing risk monitoring',
            'Unsure'
          ],
          helpText: 'Unusual routing or transshipment patterns may indicate potential diversion to embargoed destinations',
          aiPromptHint: 'Assess routing risk management. Look for red flag indicators (circuitous routes, high-risk transit points, inconsistent destinations), validation of shipment routing, and escalation of suspicious patterns.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive routing analysis and red flag monitoring': 5,
              'Yes - basic routing review': 3,
              'No formal routing risk monitoring': 1,
              'Unsure': 1
            }
          },
          tags: ['export-control', 'routing', 'transshipment', 'diversion']
        },
        {
          question: 'Are high-risk jurisdictions flagged for enhanced review?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - automated flagging with enhanced review protocols',
            'Yes - manual flagging with basic review',
            'Partially - inconsistent application',
            'No formal high-risk jurisdiction controls',
            'Unsure'
          ],
          helpText: 'Embargoed destinations and high-risk jurisdictions require enhanced scrutiny beyond standard screening',
          aiPromptHint: 'Evaluate enhanced controls for high-risk jurisdictions. Look for identification of embargoed/high-risk countries, enhanced due diligence procedures, senior approval requirements, and ongoing monitoring.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - automated flagging with enhanced review protocols': 5,
              'Yes - manual flagging with basic review': 3,
              'Partially - inconsistent application': 2,
              'No formal high-risk jurisdiction controls': 1,
              'Unsure': 1
            }
          },
          tags: ['sanctions', 'high-risk', 'jurisdictions', 'enhanced-controls']
        },
        {
          question: 'Are violations documented and reported to authorities?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - formal violation reporting process with legal review',
            'Yes - violations reported but informal process',
            'Violations identified but not consistently reported',
            'No violation reporting process',
            'No violations to date'
          ],
          helpText: 'Many violations must be self-disclosed to authorities (OFAC, BIS). Voluntary self-disclosure can mitigate penalties.',
          aiPromptHint: 'Assess violation response and reporting. Look for processes to identify potential violations, legal review, voluntary self-disclosure decisions, corrective actions, and record retention.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal violation reporting process with legal review': 5,
              'Yes - violations reported but informal process': 3,
              'Violations identified but not consistently reported': 1,
              'No violation reporting process': 1,
              'No violations to date': 4
            }
          },
          tags: ['violations', 'reporting', 'self-disclosure']
        },
        {
          question: 'Are compliance checks embedded in order processing systems?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - automated compliance checks integrated in systems',
            'Yes - manual compliance checks before processing',
            'Partially - checks performed but not systematically',
            'No compliance checks in order processing',
            'Unsure'
          ],
          helpText: 'System-integrated compliance checks prevent prohibited transactions from being processed',
          aiPromptHint: 'Evaluate integration of compliance controls into transaction processing. Look for automated screening, license verification, export control checks before order acceptance/shipment.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - automated compliance checks integrated in systems': 5,
              'Yes - manual compliance checks before processing': 3,
              'Partially - checks performed but not systematically': 2,
              'No compliance checks in order processing': 1,
              'Unsure': 1
            }
          },
          tags: ['export-control', 'systems', 'automation', 'order-processing']
        },
        {
          question: 'Are escalation paths clear for potential sanctions breaches?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 9,
          isRequired: true,
          options: [
            'Yes - documented escalation procedures with clear authority levels',
            'Yes - informal escalation understanding',
            'Partially - varies by situation',
            'No formal escalation procedures',
            'Unsure'
          ],
          helpText: 'Potential sanctions violations require rapid escalation to appropriate decision-makers and legal counsel',
          aiPromptHint: 'Assess sanctions escalation procedures. Look for documented paths, timeframe requirements, authority to stop/block transactions, legal review triggers, and documentation requirements.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - documented escalation procedures with clear authority levels': 5,
              'Yes - informal escalation understanding': 3,
              'Partially - varies by situation': 2,
              'No formal escalation procedures': 1,
              'Unsure': 1
            }
          },
          tags: ['sanctions', 'escalation', 'procedures', 'foundational']
        }
      ]
    },
    {
      title: 'Trade Finance (Banks)',
      description: 'Trade finance-specific controls for banks and financial institutions',
      weight: 0.10,  // 10%
      regulatoryPriority: 'ICC Uniform Customs, Wolfsberg TBML Guidance',
      order: 4,
      isRequired: true,
      instructions: 'Focus on trade finance operations, TBML controls, and document review (primarily for financial institutions)',
      questions: [
        {
          question: 'Are letters of credit and guarantees screened for sanctions exposure?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - comprehensive automated screening of all parties',
            'Yes - manual screening of key parties',
            'Partially - inconsistent screening',
            'No formal screening of trade finance instruments',
            'Not applicable - no trade finance services'
          ],
          helpText: 'All parties to trade finance instruments must be screened against sanctions lists',
          aiPromptHint: 'Assess trade finance sanctions screening. Look for screening of applicants, beneficiaries, advising banks, shipping lines, and all parties named in documents against comprehensive sanctions lists.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive automated screening of all parties': 5,
              'Yes - manual screening of key parties': 3,
              'Partially - inconsistent screening': 1,
              'No formal screening of trade finance instruments': 1,
              'Not applicable - no trade finance services': 5
            }
          },
          tags: ['trade-finance', 'sanctions', 'screening', 'lc', 'foundational']
        },
        {
          question: 'Are trade documents checked for TBML red flags?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Yes - systematic red flag checking with documented procedures',
            'Yes - informal red flag awareness',
            'Partially - checks performed occasionally',
            'No TBML red flag checking',
            'Not applicable - no trade finance services'
          ],
          helpText: 'Trade documents should be reviewed for TBML indicators (price anomalies, document inconsistencies, unusual routing, etc.)',
          aiPromptHint: 'Evaluate TBML red flag detection in trade finance document review. Look for documented red flag indicators, staff training, escalation procedures, and integration with transaction monitoring.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - systematic red flag checking with documented procedures': 5,
              'Yes - informal red flag awareness': 3,
              'Partially - checks performed occasionally': 2,
              'No TBML red flag checking': 1,
              'Not applicable - no trade finance services': 5
            }
          },
          tags: ['trade-finance', 'tbml', 'red-flags', 'document-review', 'foundational']
        },
        {
          question: 'Are suspicious patterns (round-tripping, over/under-invoicing) detected?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 3,
          isRequired: true,
          options: [
            'Yes - automated detection systems for TBML typologies',
            'Yes - manual analysis for suspicious patterns',
            'Partially - ad hoc detection only',
            'No systematic pattern detection',
            'Not applicable - no trade finance services'
          ],
          helpText: 'Common TBML patterns include over/under invoicing, round-tripping, phantom shipping, and structuring',
          aiPromptHint: 'Assess detection of TBML typologies. Look for systems/procedures to identify pricing anomalies, circular transactions, inconsistent commodity flows, and other known TBML patterns.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - automated detection systems for TBML typologies': 5,
              'Yes - manual analysis for suspicious patterns': 3,
              'Partially - ad hoc detection only': 2,
              'No systematic pattern detection': 1,
              'Not applicable - no trade finance services': 5
            }
          },
          tags: ['trade-finance', 'tbml', 'typologies', 'detection', 'foundational']
        },
        {
          question: 'Are trade finance systems linked to KYC data?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - full integration with KYC/CDD systems',
            'Yes - some linkage but manual processes required',
            'No - separate systems requiring manual checks',
            'Not applicable - no trade finance services'
          ],
          helpText: 'Integration with KYC data ensures customer risk profiles inform trade finance decisions',
          aiPromptHint: 'Evaluate integration between trade finance and KYC systems. Look for automated access to customer risk ratings, beneficial ownership, PEP status, and adverse media information.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - full integration with KYC/CDD systems': 5,
              'Yes - some linkage but manual processes required': 3,
              'No - separate systems requiring manual checks': 1,
              'Not applicable - no trade finance services': 5
            }
          },
          tags: ['trade-finance', 'kyc', 'integration', 'systems']
        },
        {
          question: 'Are red-flag indicators built into transaction review workflows?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Yes - automated red flag alerts in workflow systems',
            'Yes - manual red flag checklists',
            'Partially - limited red flag guidance',
            'No red flag integration in workflows',
            'Not applicable - no trade finance services'
          ],
          helpText: 'Embedding red flags in workflows ensures consistent application and documentation of review',
          aiPromptHint: 'Assess incorporation of TBML red flags into trade finance workflows. Look for automated alerts, mandatory checklists, escalation triggers, and documentation requirements.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - automated red flag alerts in workflow systems': 5,
              'Yes - manual red flag checklists': 3,
              'Partially - limited red flag guidance': 2,
              'No red flag integration in workflows': 1,
              'Not applicable - no trade finance services': 5
            }
          },
          tags: ['trade-finance', 'red-flags', 'workflow', 'automation']
        },
        {
          question: 'Are staff trained on ICC/Wolfsberg trade compliance standards?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - comprehensive training on ICC rules and Wolfsberg guidance',
            'Yes - basic trade finance compliance training',
            'Partially - training for some staff only',
            'No formal trade compliance training',
            'Not applicable - no trade finance services'
          ],
          helpText: 'ICC Uniform Customs and Wolfsberg TBML guidance provide industry standards for trade finance compliance',
          aiPromptHint: 'Evaluate trade finance staff training on industry standards. Look for coverage of ICC UCP 600, Wolfsberg Trade Finance Principles, TBML indicators, and compliance procedures.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive training on ICC rules and Wolfsberg guidance': 5,
              'Yes - basic trade finance compliance training': 3,
              'Partially - training for some staff only': 2,
              'No formal trade compliance training': 1,
              'Not applicable - no trade finance services': 5
            }
          },
          tags: ['trade-finance', 'training', 'icc', 'wolfsberg']
        },
        {
          question: 'Are exceptions approved by compliance before execution?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - mandatory compliance approval for all exceptions',
            'Yes - compliance approval for major exceptions',
            'Partially - inconsistent exception handling',
            'No compliance involvement in exceptions',
            'Not applicable - no exceptions or no trade finance'
          ],
          helpText: 'Trade finance exceptions (document discrepancies, late presentations) may present compliance risks requiring review',
          aiPromptHint: 'Assess exception management in trade finance. Look for compliance review requirements, approval authority levels, risk assessment of exceptions, and documentation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - mandatory compliance approval for all exceptions': 5,
              'Yes - compliance approval for major exceptions': 3,
              'Partially - inconsistent exception handling': 2,
              'No compliance involvement in exceptions': 1,
              'Not applicable - no exceptions or no trade finance': 4
            }
          },
          tags: ['trade-finance', 'exceptions', 'approval', 'compliance']
        },
        {
          question: 'Are blocked or rejected transactions logged and analyzed?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - comprehensive logging with periodic analysis',
            'Yes - logging but limited analysis',
            'Partially - some logging',
            'No systematic logging of blocked transactions',
            'Not applicable - no blocked transactions or no trade finance'
          ],
          helpText: 'Blocked transaction analysis can identify attempted sanctions evasion and inform risk assessments',
          aiPromptHint: 'Evaluate blocked transaction management. Look for comprehensive logging, periodic analysis for patterns, reporting to authorities where required, and use of data for risk assessment updates.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive logging with periodic analysis': 5,
              'Yes - logging but limited analysis': 3,
              'Partially - some logging': 2,
              'No systematic logging of blocked transactions': 1,
              'Not applicable - no blocked transactions or no trade finance': 4
            }
          },
          tags: ['trade-finance', 'blocked-transactions', 'logging', 'analysis']
        },
        {
          question: 'Are external trade partners (correspondent banks) due-diligenced?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Yes - comprehensive due diligence on all correspondent relationships',
            'Yes - basic due diligence',
            'Partially - due diligence for some correspondents only',
            'No formal correspondent due diligence',
            'Not applicable - no correspondent banking'
          ],
          helpText: 'Correspondent banks used for trade finance must be assessed for sanctions/AML compliance',
          aiPromptHint: 'Assess correspondent bank due diligence for trade finance. Look for review of compliance programs, sanctions screening capabilities, TBML controls, and periodic reassessment.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive due diligence on all correspondent relationships': 5,
              'Yes - basic due diligence': 3,
              'Partially - due diligence for some correspondents only': 2,
              'No formal correspondent due diligence': 1,
              'Not applicable - no correspondent banking': 5
            }
          },
          tags: ['trade-finance', 'correspondent-banking', 'due-diligence']
        },
        {
          question: 'Are trade finance operations included in compliance audits?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Yes - regular comprehensive trade finance compliance audits',
            'Yes - trade finance included in general audits',
            'Partially - occasional trade finance review',
            'No audit coverage of trade finance',
            'Not applicable - no trade finance services'
          ],
          helpText: 'Regular audit of trade finance operations ensures control effectiveness and identifies improvements',
          aiPromptHint: 'Evaluate audit coverage of trade finance. Look for trade finance-specific audit scope, frequency, review of TBML controls, sanctions screening, and document review processes.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - regular comprehensive trade finance compliance audits': 5,
              'Yes - trade finance included in general audits': 3,
              'Partially - occasional trade finance review': 2,
              'No audit coverage of trade finance': 1,
              'Not applicable - no trade finance services': 5
            }
          },
          tags: ['trade-finance', 'audit', 'compliance-review']
        }
      ]
    },
    {
      title: 'Customs & Documentation (Corporates)',
      description: 'Import/export documentation and customs compliance for trading companies',
      weight: 0.12,  // 12%
      regulatoryPriority: 'WCO Standards, EU Customs Code, CBP Regulations',
      order: 5,
      isRequired: true,
      instructions: 'Focus on customs compliance, documentation accuracy, and retention (primarily for importing/exporting companies)',
      questions: [
        {
          question: 'Are customs declarations accurate and compliant with local laws?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - comprehensive accuracy controls and validation',
            'Yes - basic accuracy checks',
            'Partially - accuracy issues identified',
            'No formal accuracy controls',
            'Not applicable - no customs declarations'
          ],
          helpText: 'Accurate customs declarations are a legal requirement and prevent penalties, delays, and enforcement actions',
          aiPromptHint: 'Assess customs declaration accuracy controls. Look for validation procedures, expert review, system checks, periodic audits, and corrective action processes for errors.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive accuracy controls and validation': 5,
              'Yes - basic accuracy checks': 3,
              'Partially - accuracy issues identified': 1,
              'No formal accuracy controls': 1,
              'Not applicable - no customs declarations': 5
            }
          },
          tags: ['customs', 'declarations', 'accuracy', 'foundational']
        },
        {
          question: 'Are invoices, packing lists, and BoL verified for consistency?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Yes - systematic verification of document consistency',
            'Yes - manual spot checks',
            'Partially - verification for high-value shipments only',
            'No formal verification process',
            'Unsure'
          ],
          helpText: 'Document inconsistencies can indicate errors, TBML, or customs violations',
          aiPromptHint: 'Assess trade document verification. Look for checks of consistency between commercial invoices, packing lists, bills of lading, and customs declarations. Inconsistencies should trigger review.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - systematic verification of document consistency': 5,
              'Yes - manual spot checks': 3,
              'Partially - verification for high-value shipments only': 2,
              'No formal verification process': 1,
              'Unsure': 1
            }
          },
          tags: ['customs', 'documentation', 'verification', 'consistency', 'foundational']
        },
        {
          question: 'Are freight forwarders vetted for compliance?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - comprehensive compliance due diligence on all forwarders',
            'Yes - basic vetting',
            'Partially - vetting of major forwarders only',
            'No formal forwarder vetting',
            'Not applicable - no use of freight forwarders'
          ],
          helpText: 'Freight forwarders act as your agent and their compliance failures can create liability',
          aiPromptHint: 'Evaluate freight forwarder due diligence. Look for assessment of compliance capabilities, licensing, insurance, contractual compliance obligations, and periodic reviews.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive compliance due diligence on all forwarders': 5,
              'Yes - basic vetting': 3,
              'Partially - vetting of major forwarders only': 2,
              'No formal forwarder vetting': 1,
              'Not applicable - no use of freight forwarders': 5
            }
          },
          tags: ['customs', 'freight-forwarders', 'due-diligence', 'third-party']
        },
        {
          question: 'Are proof-of-origin and preference documents maintained?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 6,
          isRequired: true,
          options: [
            'Yes - comprehensive origin documentation for all shipments',
            'Yes - documentation for shipments claiming preferences',
            'Partially - some documentation gaps',
            'No systematic origin documentation',
            'Not applicable - no preference claims'
          ],
          helpText: 'Origin documents are required for customs clearance and preference claims, and must be retained',
          aiPromptHint: 'Evaluate country of origin documentation. Look for collection and retention of certificates of origin, supplier declarations, and documentation to support preference claims (e.g., USMCA).',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive origin documentation for all shipments': 5,
              'Yes - documentation for shipments claiming preferences': 4,
              'Partially - some documentation gaps': 2,
              'No systematic origin documentation': 1,
              'Not applicable - no preference claims': 4
            }
          },
          tags: ['customs', 'origin', 'documentation', 'preferences', 'foundational']
        },
        {
          question: 'Are customs brokers contractually bound to compliance standards?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - comprehensive compliance clauses in broker contracts',
            'Yes - basic compliance obligations in contracts',
            'No compliance provisions in broker contracts',
            'Not applicable - no use of customs brokers'
          ],
          helpText: 'Customs brokers file entries on your behalf, and contractual compliance obligations help ensure proper conduct',
          aiPromptHint: 'Assess customs broker contract provisions. Look for compliance obligations, indemnification, audit rights, training requirements, and error notification/correction procedures.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive compliance clauses in broker contracts': 5,
              'Yes - basic compliance obligations in contracts': 3,
              'No compliance provisions in broker contracts': 1,
              'Not applicable - no use of customs brokers': 5
            }
          },
          tags: ['customs', 'brokers', 'contracts', 'compliance']
        },
        {
          question: 'Are audits conducted on import/export documentation?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - regular comprehensive documentation audits',
            'Yes - periodic spot audits',
            'Rarely - audits only when issues arise',
            'No documentation audits conducted',
            'Unsure'
          ],
          helpText: 'Regular audits identify documentation errors and compliance gaps before regulatory examination',
          aiPromptHint: 'Evaluate documentation audit program. Look for audit frequency, scope, sampling methodology, error tracking, and corrective action processes.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - regular comprehensive documentation audits': 5,
              'Yes - periodic spot audits': 3,
              'Rarely - audits only when issues arise': 2,
              'No documentation audits conducted': 1,
              'Unsure': 1
            }
          },
          tags: ['customs', 'documentation', 'audit', 'review']
        },
        {
          question: 'Are customs documents (invoices, bills of lading, certificates of origin) retained per requirements?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 9,
          isRequired: true,
          options: [
            'Yes - all customs documents retained with proper organization',
            'Yes - documents retained but organization needs improvement',
            'Partially - some documents retained, gaps exist',
            'No systematic retention of customs documents',
            'Unsure of requirements'
          ],
          helpText: 'Customs authorities typically require retention of commercial invoices, bills of lading, packing lists, certificates of origin, and entry documents for 5-7 years',
          aiPromptHint: 'Assess customs-specific document retention. Look for retention of commercial invoices, bills of lading (air waybills, ocean bills), packing lists, certificates of origin, customs entries/declarations, duty payment records, and preference documents. Verify retention periods meet jurisdiction requirements (typically 5-7 years).',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - all customs documents retained with proper organization': 5,
              'Yes - documents retained but organization needs improvement': 3,
              'Partially - some documents retained, gaps exist': 2,
              'No systematic retention of customs documents': 1,
              'Unsure of requirements': 1
            }
          },
          tags: ['customs', 'documentation', 'retention', 'invoices', 'bol', 'origin', 'foundational']
        },
        {
          question: 'Are non-conformities tracked and corrected?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Yes - formal non-conformance tracking and correction system',
            'Yes - informal tracking and correction',
            'Partially - corrections made but not systematically tracked',
            'No formal non-conformance management',
            'Unsure'
          ],
          helpText: 'Tracking errors and non-conformances enables identification of systemic issues and continuous improvement',
          aiPromptHint: 'Evaluate non-conformance management. Look for error/exception logging, root cause analysis, corrective actions, trend analysis, and management reporting.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal non-conformance tracking and correction system': 5,
              'Yes - informal tracking and correction': 3,
              'Partially - corrections made but not systematically tracked': 2,
              'No formal non-conformance management': 1,
              'Unsure': 1
            }
          },
          tags: ['customs', 'non-conformance', 'quality', 'tracking']
        }
      ]
    },
    {
      title: 'Supply Chain & End-Use Controls',
      description: 'Supplier due diligence, end-use verification, and supply chain risk management',
      weight: 0.11,  // 11%
      regulatoryPriority: 'BIS End-Use Controls, UFLPA, Supply Chain Transparency',
      order: 6,
      isRequired: true,
      instructions: 'Focus on supplier screening, end-use controls, and supply chain visibility',
      questions: [
        {
          question: 'Are supplier due diligence records comprehensive and accessible for audit?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - comprehensive due diligence files with complete documentation',
            'Yes - basic due diligence records maintained',
            'Partially - incomplete or inconsistent documentation',
            'No - limited due diligence documentation',
            'Unsure'
          ],
          helpText: 'Supplier due diligence documentation should include screening results, risk assessments, approvals, contracts, and periodic review records for audit purposes',
          aiPromptHint: 'Assess quality and completeness of supplier due diligence documentation. Look for screening records, risk assessments, approval documentation, onboarding files, contracts with compliance clauses, periodic review records, country of origin documentation, and accessibility for internal/external audits.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive due diligence files with complete documentation': 5,
              'Yes - basic due diligence records maintained': 3,
              'Partially - incomplete or inconsistent documentation': 2,
              'No - limited due diligence documentation': 1,
              'Unsure': 1
            }
          },
          tags: ['supply-chain', 'supplier-due-diligence', 'documentation', 'audit-trail', 'foundational']
        },
        {
          question: 'Are shipping routes and ports monitored for diversion risk?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'Yes - systematic monitoring with risk analysis',
            'Yes - basic route review',
            'Partially - occasional monitoring',
            'No route monitoring',
            'Unsure'
          ],
          helpText: 'Unusual routing patterns may indicate diversion to prohibited destinations',
          aiPromptHint: 'Assess shipping route monitoring. Look for validation of logical routes, red flag indicators for circuitous routing, transshipment risk assessment, and escalation procedures.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - systematic monitoring with risk analysis': 5,
              'Yes - basic route review': 3,
              'Partially - occasional monitoring': 2,
              'No route monitoring': 1,
              'Unsure': 1
            }
          },
          tags: ['supply-chain', 'routing', 'diversion-risk', 'monitoring']
        },
        {
          question: 'Are re-exports and transit trades tracked?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - comprehensive re-export tracking system',
            'Yes - basic tracking',
            'Partially - limited tracking',
            'No re-export tracking',
            'Not applicable - no re-exports'
          ],
          helpText: 'Re-exports may require additional authorizations and present diversion risks',
          aiPromptHint: 'Evaluate re-export control processes. Look for identification of re-export transactions, license requirement determination, tracking systems, and compliance verification.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive re-export tracking system': 5,
              'Yes - basic tracking': 3,
              'Partially - limited tracking': 2,
              'No re-export tracking': 1,
              'Not applicable - no re-exports': 5
            }
          },
          tags: ['supply-chain', 're-exports', 'tracking', 'transit-trade']
        },
        {
          question: 'Are logistics partners included in compliance reviews?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Yes - regular compliance reviews of all logistics partners',
            'Yes - periodic reviews of major partners',
            'Partially - occasional reviews',
            'No compliance reviews of logistics partners',
            'Not applicable - no logistics partners'
          ],
          helpText: 'Logistics partners handle shipments and must understand compliance requirements',
          aiPromptHint: 'Assess logistics partner compliance oversight. Look for due diligence procedures, compliance training requirements, contractual obligations, and periodic performance reviews.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - regular compliance reviews of all logistics partners': 5,
              'Yes - periodic reviews of major partners': 3,
              'Partially - occasional reviews': 2,
              'No compliance reviews of logistics partners': 1,
              'Not applicable - no logistics partners': 5
            }
          },
          tags: ['supply-chain', 'logistics', 'third-party', 'compliance-review']
        },
        {
          question: 'Are human rights or ESG criteria part of supplier due diligence?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 6,
          isRequired: true,
          options: [
            'Yes - comprehensive human rights and ESG due diligence',
            'Yes - basic human rights screening',
            'Partially - limited ESG consideration',
            'No human rights or ESG due diligence',
            'Unsure'
          ],
          helpText: 'UFLPA and other regulations require forced labor screening. ESG factors are increasingly important.',
          aiPromptHint: 'Evaluate forced labor and ESG due diligence. Look for Uyghur Forced Labor Prevention Act compliance, supplier codes of conduct, audit programs, and remediation procedures.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive human rights and ESG due diligence': 5,
              'Yes - basic human rights screening': 3,
              'Partially - limited ESG consideration': 2,
              'No human rights or ESG due diligence': 1,
              'Unsure': 1
            }
          },
          tags: ['supply-chain', 'human-rights', 'esg', 'uflpa', 'forced-labor', 'foundational']
        },
        {
          question: 'Are risk alerts generated for unusual trade routes?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - automated risk alerts for unusual patterns',
            'Yes - manual review identifies unusual routes',
            'Partially - limited alert capability',
            'No risk alerts for routing',
            'Unsure'
          ],
          helpText: 'Automated alerts enable timely review of potentially concerning shipment patterns',
          aiPromptHint: 'Assess risk alerting capabilities. Look for system-generated alerts based on route deviations, high-risk transit points, or pattern anomalies, with appropriate escalation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - automated risk alerts for unusual patterns': 5,
              'Yes - manual review identifies unusual routes': 3,
              'Partially - limited alert capability': 2,
              'No risk alerts for routing': 1,
              'Unsure': 1
            }
          },
          tags: ['supply-chain', 'risk-alerts', 'monitoring', 'automation']
        },
        {
          question: 'Are contractual clauses on export controls enforced downstream?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - comprehensive downstream compliance clauses with enforcement',
            'Yes - clauses in place but limited enforcement',
            'Partially - clauses in some contracts',
            'No downstream export control clauses',
            'Not applicable - no controlled items'
          ],
          helpText: 'Downstream control prevents unauthorized re-export or use of controlled items',
          aiPromptHint: 'Evaluate downstream export control provisions. Look for contractual restrictions on re-export, end-use limitations, audit rights, and enforcement mechanisms.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive downstream compliance clauses with enforcement': 5,
              'Yes - clauses in place but limited enforcement': 3,
              'Partially - clauses in some contracts': 2,
              'No downstream export control clauses': 1,
              'Not applicable - no controlled items': 5
            }
          },
          tags: ['supply-chain', 'export-control', 'contracts', 'downstream']
        },
        {
          question: 'Are escalation paths defined for end-use uncertainty?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Yes - documented escalation procedures for end-use concerns',
            'Yes - informal escalation understanding',
            'Partially - varies by situation',
            'No defined escalation paths',
            'Unsure'
          ],
          helpText: 'End-use uncertainties require prompt escalation to compliance and management',
          aiPromptHint: 'Assess end-use escalation procedures. Look for clear escalation paths, decision authority, stop-shipment protocols, and documentation requirements when end-use is uncertain.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - documented escalation procedures for end-use concerns': 5,
              'Yes - informal escalation understanding': 3,
              'Partially - varies by situation': 2,
              'No defined escalation paths': 1,
              'Unsure': 1
            }
          },
          tags: ['supply-chain', 'end-use', 'escalation', 'procedures']
        },
        {
          question: 'Are supply chain mapping and transparency tools used?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Yes - comprehensive supply chain mapping with technology tools',
            'Yes - basic supply chain visibility',
            'Partially - limited visibility',
            'No supply chain mapping',
            'Unsure'
          ],
          helpText: 'Supply chain transparency enables identification of risks and compliance gaps',
          aiPromptHint: 'Evaluate supply chain transparency. Look for mapping of suppliers, sub-suppliers, country of origin tracking, and technology tools for visibility across multiple tiers.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive supply chain mapping with technology tools': 5,
              'Yes - basic supply chain visibility': 3,
              'Partially - limited visibility': 2,
              'No supply chain mapping': 1,
              'Unsure': 1
            }
          },
          tags: ['supply-chain', 'mapping', 'transparency', 'visibility']
        }
      ]
    },
    {
      title: 'Data, Technology & Recordkeeping',
      description: 'Technology infrastructure, data management, and recordkeeping compliance',
      weight: 0.08,  // 8%
      regulatoryPriority: 'Data Retention Requirements, System Validation',
      order: 7,
      isRequired: true,
      instructions: 'Focus on technology systems, data quality, and recordkeeping',
      questions: [
        {
          question: 'Are trade compliance records stored centrally and retrievable?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - centralized electronic repository with search capabilities',
            'Yes - centralized storage but limited search',
            'Partially - some records centralized',
            'No - decentralized record storage',
            'Unsure'
          ],
          helpText: 'Centralized recordkeeping enables efficient retrieval for audits and regulatory requests',
          aiPromptHint: 'Assess record management systems. Look for centralized repository, electronic storage, metadata/indexing, search capabilities, access controls, and backup procedures.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - centralized electronic repository with search capabilities': 5,
              'Yes - centralized storage but limited search': 3,
              'Partially - some records centralized': 2,
              'No - decentralized record storage': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'recordkeeping', 'centralization', 'foundational']
        },
        {
          question: 'Are screening systems integrated with ERP/logistics systems?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Yes - full integration with automated data flow',
            'Yes - partial integration requiring some manual input',
            'No - separate systems requiring manual data transfer',
            'No screening system in place',
            'Unsure'
          ],
          helpText: 'System integration reduces errors and enables real-time compliance checks',
          aiPromptHint: 'Evaluate systems integration. Look for automated data flow between screening and operational systems, real-time checks, minimal manual intervention, and data consistency.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - full integration with automated data flow': 5,
              'Yes - partial integration requiring some manual input': 3,
              'No - separate systems requiring manual data transfer': 1,
              'No screening system in place': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'integration', 'systems', 'screening', 'foundational']
        },
        {
          question: 'Are data retention policies compliant with regulations?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 3,
          isRequired: true,
          options: [
            'Yes - comprehensive retention policy meeting all requirements',
            'Yes - retention policy in place but may have gaps',
            'Partially - informal retention practices',
            'No formal retention policy',
            'Unsure of requirements'
          ],
          helpText: 'Regulatory retention requirements typically range from 5-7 years for trade documents',
          aiPromptHint: 'Assess data retention compliance. Look for formal policies covering all document types, retention periods aligned with regulations, secure storage, and disposal procedures.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive retention policy meeting all requirements': 5,
              'Yes - retention policy in place but may have gaps': 3,
              'Partially - informal retention practices': 2,
              'No formal retention policy': 1,
              'Unsure of requirements': 1
            }
          },
          tags: ['data-technology', 'retention', 'compliance', 'foundational']
        },
        {
          question: 'Are access controls and audit logs in place?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - comprehensive access controls with detailed audit logs',
            'Yes - basic access controls and logging',
            'Partially - limited controls or logging',
            'No formal access controls or audit logs',
            'Unsure'
          ],
          helpText: 'Access controls protect sensitive data and audit logs enable investigation and compliance verification',
          aiPromptHint: 'Evaluate data security controls. Look for role-based access, authentication requirements, audit logging of data access/changes, log retention, and regular review.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive access controls with detailed audit logs': 5,
              'Yes - basic access controls and logging': 3,
              'Partially - limited controls or logging': 2,
              'No formal access controls or audit logs': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'security', 'access-control', 'audit-logs']
        },
        {
          question: 'Are manual processes minimized through digitalization?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Yes - extensive automation of compliance processes',
            'Yes - some automation but manual processes remain',
            'Limited automation - mostly manual processes',
            'No automation - fully manual processes',
            'Unsure'
          ],
          helpText: 'Automation reduces errors, improves efficiency, and enhances compliance effectiveness',
          aiPromptHint: 'Assess digitalization and automation. Look for automated screening, classification, documentation, reporting, and monitoring with minimal manual intervention.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - extensive automation of compliance processes': 5,
              'Yes - some automation but manual processes remain': 3,
              'Limited automation - mostly manual processes': 2,
              'No automation - fully manual processes': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'automation', 'digitalization', 'efficiency']
        },
        {
          question: 'Is there a dashboard for monitoring trade compliance metrics?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - comprehensive compliance dashboard with real-time metrics',
            'Yes - basic reporting of key metrics',
            'Partially - ad hoc reporting only',
            'No compliance metrics dashboard',
            'Unsure'
          ],
          helpText: 'Compliance dashboards enable monitoring of program effectiveness and early issue identification',
          aiPromptHint: 'Evaluate compliance metrics monitoring. Look for dashboards showing screening volume, hit rates, escalations, license status, training completion, and audit findings.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive compliance dashboard with real-time metrics': 5,
              'Yes - basic reporting of key metrics': 3,
              'Partially - ad hoc reporting only': 2,
              'No compliance metrics dashboard': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'dashboard', 'metrics', 'monitoring']
        },
        {
          question: 'Are system updates and vendor changes approved by compliance?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - formal compliance review and approval required',
            'Yes - compliance consulted but not formal approval',
            'Partially - compliance involved in some changes',
            'No - compliance not involved in system changes',
            'Unsure'
          ],
          helpText: 'System changes can impact compliance controls and require review',
          aiPromptHint: 'Assess compliance governance over technology changes. Look for change management procedures requiring compliance review, validation of control maintenance, and documentation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal compliance review and approval required': 5,
              'Yes - compliance consulted but not formal approval': 3,
              'Partially - compliance involved in some changes': 2,
              'No - compliance not involved in system changes': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'change-management', 'governance', 'approval']
        },
        {
          question: 'Are trade data validated for completeness and accuracy?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - comprehensive data validation controls',
            'Yes - basic validation checks',
            'Partially - limited validation',
            'No systematic data validation',
            'Unsure'
          ],
          helpText: 'Data quality is essential for effective compliance controls and decision-making',
          aiPromptHint: 'Evaluate data validation procedures. Look for automated validation rules, mandatory field requirements, consistency checks, error reporting, and data quality metrics.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive data validation controls': 5,
              'Yes - basic validation checks': 3,
              'Partially - limited validation': 2,
              'No systematic data validation': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'validation', 'data-quality', 'accuracy']
        },
        {
          question: 'Is there backup and business continuity planning for trade systems?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Yes - comprehensive backup and BCP for all trade systems',
            'Yes - basic backup procedures',
            'Partially - backup for some systems only',
            'No formal backup or BCP',
            'Unsure'
          ],
          helpText: 'Business continuity ensures compliance operations can continue during system disruptions',
          aiPromptHint: 'Assess backup and business continuity. Look for regular backups, disaster recovery procedures, redundancy, testing of recovery, and alternate processing capabilities.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive backup and BCP for all trade systems': 5,
              'Yes - basic backup procedures': 3,
              'Partially - backup for some systems only': 2,
              'No formal backup or BCP': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'backup', 'business-continuity', 'disaster-recovery']
        },
        {
          question: 'Is a roadmap defined for trade compliance automation?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Yes - detailed automation roadmap with timelines',
            'Yes - general automation goals',
            'Under development',
            'No automation roadmap',
            'Unsure'
          ],
          helpText: 'Strategic planning for automation ensures continuous improvement and resource allocation',
          aiPromptHint: 'Evaluate automation strategy. Look for documented roadmap, prioritized initiatives, resource allocation, timelines, and alignment with compliance program needs.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - detailed automation roadmap with timelines': 5,
              'Yes - general automation goals': 3,
              'Under development': 2,
              'No automation roadmap': 1,
              'Unsure': 1
            }
          },
          tags: ['data-technology', 'automation', 'roadmap', 'strategy']
        }
      ]
    },
    {
      title: 'Training & Culture',
      description: 'Employee training, awareness programs, and compliance culture',
      weight: 0.05,  // 5%
      regulatoryPriority: 'Training Requirements, Compliance Culture',
      order: 8,
      isRequired: true,
      instructions: 'Focus on training programs, awareness, and building a compliance culture',
      questions: [
        {
          question: 'Is trade compliance training mandatory for relevant employees?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - mandatory training with enforcement',
            'Yes - training available but not strictly enforced',
            'Partially - mandatory for some roles only',
            'No - training is optional',
            'No formal training program'
          ],
          helpText: 'Mandatory training ensures all relevant employees understand compliance obligations',
          aiPromptHint: 'Assess training mandate and enforcement. Look for documented requirements, tracking of completion, consequences for non-compliance, and coverage of all relevant roles.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - mandatory training with enforcement': 5,
              'Yes - training available but not strictly enforced': 3,
              'Partially - mandatory for some roles only': 2,
              'No - training is optional': 1,
              'No formal training program': 1
            }
          },
          tags: ['training', 'mandatory', 'enforcement', 'foundational']
        },
        {
          question: 'Are refresher trainings conducted annually?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Yes - annual refresher training required',
            'Yes - periodic training but not annually',
            'No - only initial training provided',
            'No formal training program',
            'Unsure'
          ],
          helpText: 'Regular refresher training keeps employees current on regulatory changes and reinforces compliance',
          aiPromptHint: 'Evaluate refresher training frequency. Annual training is regulatory best practice. Look for scheduled refreshers, updated content, and tracking of completion.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - annual refresher training required': 5,
              'Yes - periodic training but not annually': 3,
              'No - only initial training provided': 1,
              'No formal training program': 1,
              'Unsure': 1
            }
          },
          tags: ['training', 'refresher', 'annual', 'foundational']
        },
        {
          question: 'Are procurement, logistics, and finance staff trained on export controls?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'Yes - comprehensive role-specific training for all functions',
            'Yes - general training covering all functions',
            'Partially - training for some functions only',
            'No cross-functional training',
            'Unsure'
          ],
          helpText: 'Trade compliance spans multiple functions requiring coordinated training',
          aiPromptHint: 'Assess cross-functional training coverage. Look for role-specific content for procurement (supplier screening), logistics (shipping controls), and finance (payment screening).',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive role-specific training for all functions': 5,
              'Yes - general training covering all functions': 3,
              'Partially - training for some functions only': 2,
              'No cross-functional training': 1,
              'Unsure': 1
            }
          },
          tags: ['training', 'cross-functional', 'procurement', 'logistics', 'finance']
        },
        {
          question: 'Are awareness campaigns run for high-risk regions or goods?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - targeted awareness campaigns for emerging risks',
            'Yes - general awareness communications',
            'Occasionally - ad hoc communications',
            'No targeted awareness campaigns',
            'Unsure'
          ],
          helpText: 'Timely awareness campaigns alert staff to emerging risks (new sanctions, high-risk products)',
          aiPromptHint: 'Evaluate risk-based awareness communications. Look for timely alerts on sanctions announcements, new regulations, high-risk transactions, and lessons learned.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - targeted awareness campaigns for emerging risks': 5,
              'Yes - general awareness communications': 3,
              'Occasionally - ad hoc communications': 2,
              'No targeted awareness campaigns': 1,
              'Unsure': 1
            }
          },
          tags: ['training', 'awareness', 'risk-based', 'campaigns']
        },
        {
          question: 'Are escalation procedures understood by all employees?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Yes - escalation training included with periodic reinforcement',
            'Yes - escalation procedures communicated but not regularly reinforced',
            'Partially - some employees understand escalation',
            'No - escalation procedures not well communicated',
            'Unsure'
          ],
          helpText: 'Employees must know how and when to escalate potential compliance issues',
          aiPromptHint: 'Assess escalation awareness. Look for training on "when to escalate," clear contact points, whistleblower protections, and no-retaliation policies.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - escalation training included with periodic reinforcement': 5,
              'Yes - escalation procedures communicated but not regularly reinforced': 3,
              'Partially - some employees understand escalation': 2,
              'No - escalation procedures not well communicated': 1,
              'Unsure': 1
            }
          },
          tags: ['training', 'escalation', 'awareness', 'procedures']
        },
        {
          question: 'Are trade compliance KPIs linked to performance management?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - compliance KPIs included in performance reviews',
            'Yes - compliance considered but not formal KPIs',
            'Partially - KPIs for compliance roles only',
            'No - compliance not in performance management',
            'Unsure'
          ],
          helpText: 'Linking compliance to performance creates accountability and reinforces importance',
          aiPromptHint: 'Evaluate performance management integration. Look for compliance KPIs in job descriptions, performance reviews, and incentive structures for relevant roles.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - compliance KPIs included in performance reviews': 5,
              'Yes - compliance considered but not formal KPIs': 3,
              'Partially - KPIs for compliance roles only': 2,
              'No - compliance not in performance management': 1,
              'Unsure': 1
            }
          },
          tags: ['training', 'kpis', 'performance-management', 'accountability']
        },
        {
          question: 'Are incidents used as learning opportunities?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - systematic lessons learned process with communication',
            'Yes - informal lessons learned',
            'Occasionally - some incidents analyzed',
            'No - incidents not used for learning',
            'No incidents to date'
          ],
          helpText: 'Converting incidents into training improves future compliance',
          aiPromptHint: 'Assess lessons learned process. Look for root cause analysis, communication of findings (anonymized), training updates, and control improvements based on incidents.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - systematic lessons learned process with communication': 5,
              'Yes - informal lessons learned': 3,
              'Occasionally - some incidents analyzed': 2,
              'No - incidents not used for learning': 1,
              'No incidents to date': 4
            }
          },
          tags: ['training', 'lessons-learned', 'incidents', 'continuous-improvement']
        },
        {
          question: 'Are management communications reinforcing compliance culture?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - regular management messaging on compliance importance',
            'Yes - occasional management communications',
            'Rarely - limited management visibility',
            'No - compliance not emphasized by management',
            'Unsure'
          ],
          helpText: '"Tone from the top" is critical for establishing strong compliance culture',
          aiPromptHint: 'Evaluate management support for compliance culture. Look for regular communications from senior management, compliance included in company meetings, visible support for compliance team.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - regular management messaging on compliance importance': 5,
              'Yes - occasional management communications': 3,
              'Rarely - limited management visibility': 2,
              'No - compliance not emphasized by management': 1,
              'Unsure': 1
            }
          },
          tags: ['training', 'culture', 'tone-from-top', 'management-support']
        },
        {
          question: 'Are new hires trained during onboarding?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Yes - compliance training required during onboarding',
            'Yes - training provided within first 90 days',
            'Partially - training for some new hires',
            'No - no onboarding compliance training',
            'Unsure'
          ],
          helpText: 'Early training ensures new employees understand compliance obligations from the start',
          aiPromptHint: 'Assess onboarding training. Look for compliance module in orientation, role-specific training timing, documentation of completion, and systems access contingent on training.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - compliance training required during onboarding': 5,
              'Yes - training provided within first 90 days': 3,
              'Partially - training for some new hires': 2,
              'No - no onboarding compliance training': 1,
              'Unsure': 1
            }
          },
          tags: ['training', 'onboarding', 'new-hires']
        },
        {
          question: 'Are training programs updated for regulatory changes?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Yes - training updated promptly for regulatory changes',
            'Yes - training updated annually',
            'Occasionally - updates lag behind changes',
            'No - training content is static',
            'Unsure'
          ],
          helpText: 'Current training content ensures employees are aware of latest requirements',
          aiPromptHint: 'Evaluate training content currency. Look for process to monitor regulatory changes, update training materials, and communicate updates to employees in timely manner.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - training updated promptly for regulatory changes': 5,
              'Yes - training updated annually': 3,
              'Occasionally - updates lag behind changes': 2,
              'No - training content is static': 1,
              'Unsure': 1
            }
          },
          tags: ['training', 'updates', 'regulatory-changes', 'currency']
        }
      ]
    },
    {
      title: 'Monitoring, Audit & Continuous Improvement',
      description: 'Compliance monitoring, auditing, and program improvement',
      weight: 0.08,  // 8%
      regulatoryPriority: 'Independent Testing, Continuous Improvement',
      order: 9,
      isRequired: true,
      instructions: 'Focus on control testing, audits, and continuous improvement',
      questions: [
        {
          question: 'Are trade compliance controls tested periodically?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - comprehensive periodic control testing',
            'Yes - some controls tested regularly',
            'Occasionally - ad hoc testing only',
            'No formal control testing',
            'Unsure'
          ],
          helpText: 'Regular control testing validates effectiveness and identifies weaknesses',
          aiPromptHint: 'Assess control testing program. Look for documented test procedures, coverage of key controls (screening, classification, license management), frequency, and findings tracking.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive periodic control testing': 5,
              'Yes - some controls tested regularly': 3,
              'Occasionally - ad hoc testing only': 2,
              'No formal control testing': 1,
              'Unsure': 1
            }
          },
          tags: ['monitoring-audit', 'control-testing', 'effectiveness', 'foundational']
        },
        {
          question: 'Are internal or external audits performed annually?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Yes - annual independent audit of trade compliance',
            'Yes - annual internal audit',
            'Periodically but not annually',
            'No formal audit program',
            'Unsure'
          ],
          helpText: 'Annual audits are regulatory best practice for trade compliance programs',
          aiPromptHint: 'Evaluate audit frequency and independence. Independent external audits provide greater assurance. Look for comprehensive scope, qualified auditors, and action on findings.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - annual independent audit of trade compliance': 5,
              'Yes - annual internal audit': 4,
              'Periodically but not annually': 2,
              'No formal audit program': 1,
              'Unsure': 1
            }
          },
          tags: ['monitoring-audit', 'audit', 'annual', 'independence', 'foundational']
        },
        {
          question: 'Are corrective actions tracked to closure?',
          type: QuestionType.SELECT,
          weight: 1.5,  // Foundational
          isFoundational: true,
          order: 3,
          isRequired: true,
          options: [
            'Yes - formal corrective action tracking system',
            'Yes - corrective actions tracked informally',
            'Partially - some actions tracked',
            'No systematic tracking of corrective actions',
            'Unsure'
          ],
          helpText: 'Tracking ensures audit findings and identified issues are actually remediated',
          aiPromptHint: 'Assess corrective action management. Look for action item tracking, assignment of ownership, deadlines, status monitoring, verification of closure, and escalation of overdue items.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal corrective action tracking system': 5,
              'Yes - corrective actions tracked informally': 3,
              'Partially - some actions tracked': 2,
              'No systematic tracking of corrective actions': 1,
              'Unsure': 1
            }
          },
          tags: ['monitoring-audit', 'corrective-actions', 'tracking', 'remediation', 'foundational']
        },
        {
          question: 'Are trade compliance KPIs and KRIs defined?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - comprehensive KPIs and KRIs with regular monitoring',
            'Yes - basic metrics tracked',
            'Partially - limited metrics',
            'No formal KPIs or KRIs',
            'Unsure'
          ],
          helpText: 'Key Performance Indicators and Key Risk Indicators enable program monitoring and management',
          aiPromptHint: 'Evaluate metrics program. Look for defined KPIs (screening volume, training completion) and KRIs (hit rates, violations, audit findings), targets, regular reporting, and trend analysis.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive KPIs and KRIs with regular monitoring': 5,
              'Yes - basic metrics tracked': 3,
              'Partially - limited metrics': 2,
              'No formal KPIs or KRIs': 1,
              'Unsure': 1
            }
          },
          tags: ['monitoring-audit', 'kpis', 'kris', 'metrics', 'performance']
        },
        {
          question: 'Are near-misses analyzed for lessons learned?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 5,
          isRequired: true,
          options: [
            'Yes - systematic near-miss analysis and communication',
            'Yes - informal analysis',
            'Occasionally - some near-misses reviewed',
            'No near-miss analysis',
            'No near-misses identified'
          ],
          helpText: 'Near-miss analysis enables proactive risk mitigation before violations occur',
          aiPromptHint: 'Assess near-miss review process. Look for identification of near-misses (e.g., screening catches, last-minute license holds), root cause analysis, and control improvements.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - systematic near-miss analysis and communication': 5,
              'Yes - informal analysis': 3,
              'Occasionally - some near-misses reviewed': 2,
              'No near-miss analysis': 1,
              'No near-misses identified': 3
            }
          },
          tags: ['monitoring-audit', 'near-miss', 'lessons-learned', 'prevention']
        },
        {
          question: 'Are management reports produced on compliance effectiveness?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 6,
          isRequired: true,
          options: [
            'Yes - regular comprehensive management reporting',
            'Yes - periodic summary reports',
            'Occasionally - reporting upon request',
            'No management reporting on compliance',
            'Unsure'
          ],
          helpText: 'Regular reporting keeps management informed and enables oversight',
          aiPromptHint: 'Evaluate management reporting. Look for regular reports to senior management/board covering metrics, audit findings, incidents, regulatory changes, and resource needs.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - regular comprehensive management reporting': 5,
              'Yes - periodic summary reports': 3,
              'Occasionally - reporting upon request': 2,
              'No management reporting on compliance': 1,
              'Unsure': 1
            }
          },
          tags: ['monitoring-audit', 'reporting', 'management-oversight']
        },
        {
          question: 'Are peer or benchmark assessments used?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - regular benchmarking against peers/industry standards',
            'Yes - occasional peer comparisons',
            'No - no benchmarking',
            'Unsure'
          ],
          helpText: 'Benchmarking provides external perspective on program maturity and identifies improvement opportunities',
          aiPromptHint: 'Assess use of external benchmarks. Look for participation in industry groups, peer assessments, maturity model self-assessments, and gap analysis against leading practices.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - regular benchmarking against peers/industry standards': 5,
              'Yes - occasional peer comparisons': 3,
              'No - no benchmarking': 1,
              'Unsure': 1
            }
          },
          tags: ['monitoring-audit', 'benchmarking', 'peer-assessment', 'best-practices']
        },
        {
          question: 'Are system performance and alert accuracy validated?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - regular validation of system performance',
            'Yes - periodic validation',
            'Occasionally - limited validation',
            'No system validation',
            'Not applicable - no automated systems'
          ],
          helpText: 'System validation ensures screening and other controls operate as intended',
          aiPromptHint: 'Evaluate system validation. Look for testing of screening accuracy, false positive rates, classification logic, alert generation, and periodic tuning based on performance metrics.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - regular validation of system performance': 5,
              'Yes - periodic validation': 3,
              'Occasionally - limited validation': 2,
              'No system validation': 1,
              'Not applicable - no automated systems': 4
            }
          },
          tags: ['monitoring-audit', 'system-validation', 'testing', 'accuracy']
        },
        {
          question: 'Are findings from authorities or partners incorporated into updates?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Yes - systematic incorporation of external findings',
            'Yes - findings considered but not systematically',
            'Occasionally - ad hoc incorporation',
            'No - external findings not incorporated',
            'No relevant findings received'
          ],
          helpText: 'Learning from regulatory findings and partner feedback improves compliance',
          aiPromptHint: 'Assess responsiveness to external input. Look for processes to review regulatory guidance, examination findings (own or industry), partner feedback, and incorporation into program updates.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - systematic incorporation of external findings': 5,
              'Yes - findings considered but not systematically': 3,
              'Occasionally - ad hoc incorporation': 2,
              'No - external findings not incorporated': 1,
              'No relevant findings received': 4
            }
          },
          tags: ['monitoring-audit', 'regulatory-feedback', 'continuous-improvement']
        },
        {
          question: 'Is continuous improvement embedded in compliance planning?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Yes - formal continuous improvement program',
            'Yes - improvement initiatives identified informally',
            'Partially - limited improvement planning',
            'No - reactive compliance approach only',
            'Unsure'
          ],
          helpText: 'Proactive improvement culture drives program maturity and risk reduction',
          aiPromptHint: 'Evaluate continuous improvement mindset. Look for annual compliance plan with improvement initiatives, resource allocation for enhancements, innovation encouragement, and tracking of improvements.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal continuous improvement program': 5,
              'Yes - improvement initiatives identified informally': 3,
              'Partially - limited improvement planning': 2,
              'No - reactive compliance approach only': 1,
              'Unsure': 1
            }
          },
          tags: ['monitoring-audit', 'continuous-improvement', 'planning', 'maturity']
        }
      ]
    },
    {
      title: 'AI Readiness & Responsible Use',
      description: 'AI governance, ethics, and responsible use in trade compliance operations',
      weight: 0.08,  // 8%
      regulatoryPriority: 'EU AI Act, Model Risk Management, Algorithmic Transparency',
      order: 10,
      isRequired: true,
      instructions: 'Focus on AI governance, model validation, and responsible AI use (particularly relevant for organizations using or planning to use AI in trade compliance)',
      questions: [
        {
          question: 'Has the organization defined an AI or digital strategy covering trade compliance?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: [
            'Yes - comprehensive AI strategy including trade compliance use cases',
            'Yes - general AI strategy with some trade compliance consideration',
            'Under development',
            'No AI strategy defined',
            'Not applicable - no AI plans'
          ],
          helpText: 'AI strategy aligns technology adoption with business objectives and compliance requirements',
          aiPromptHint: 'Assess AI strategic planning. Look for documented strategy, identified trade compliance use cases (screening, classification, risk scoring), resource allocation, and governance framework.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive AI strategy including trade compliance use cases': 5,
              'Yes - general AI strategy with some trade compliance consideration': 3,
              'Under development': 2,
              'No AI strategy defined': 1,
              'Not applicable - no AI plans': 3
            }
          },
          tags: ['ai-readiness', 'strategy', 'governance', 'foundational']
        },
        {
          question: 'Are AI governance structures in place (policy, oversight committee)?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 2,
          isRequired: true,
          options: [
            'Yes - comprehensive AI governance (policy, committee, oversight)',
            'Yes - basic AI governance in place',
            'Partially - governance under development',
            'No AI governance structures',
            'Not applicable - no AI usage'
          ],
          helpText: 'AI governance ensures responsible use, risk management, and regulatory compliance',
          aiPromptHint: 'Evaluate AI governance framework. Look for AI policy/principles, governance committee, risk assessment processes, approval requirements, and compliance integration.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive AI governance (policy, committee, oversight)': 5,
              'Yes - basic AI governance in place': 3,
              'Partially - governance under development': 2,
              'No AI governance structures': 1,
              'Not applicable - no AI usage': 4
            }
          },
          tags: ['ai-readiness', 'governance', 'oversight', 'foundational']
        },
        {
          question: 'Are trade compliance use cases for AI clearly defined (screening, document analysis, risk scoring)?',
          type: QuestionType.MULTISELECT,
          weight: 1.5,
          isFoundational: false,
          order: 3,
          isRequired: true,
          options: [
            'Sanctions/restricted party screening',
            'Document analysis and classification',
            'Risk scoring and profiling',
            'Pattern detection and anomaly identification',
            'Automated classification (HS/ECCN)',
            'Natural language processing for compliance review',
            'Predictive analytics for risk assessment',
            'None - no AI use cases defined',
            'Considering options'
          ],
          helpText: 'Clear use case definition ensures AI is applied appropriately to compliance needs',
          aiPromptHint: 'Assess AI use case clarity. Look for documented use cases, business justification, expected benefits, risk assessment, and governance requirements for each application.',
          scoringRules: {
            scale: 5,
            countBased: true,
            penalties: {
              'None - no AI use cases defined': -4,
              'Considering options': -1
            },
            ranges: {
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['ai-readiness', 'use-cases', 'applications']
        },
        {
          question: 'Are data sources for AI training verified for accuracy and licensing?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 4,
          isRequired: true,
          options: [
            'Yes - comprehensive data verification and licensing management',
            'Yes - basic data quality checks',
            'Partially - limited verification',
            'No formal data verification',
            'Not applicable - no AI training'
          ],
          helpText: 'AI model quality depends on training data quality and appropriate licensing',
          aiPromptHint: 'Evaluate training data governance. Look for data source validation, accuracy verification, licensing compliance, data lineage, and bias assessment in training datasets.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive data verification and licensing management': 5,
              'Yes - basic data quality checks': 3,
              'Partially - limited verification': 2,
              'No formal data verification': 1,
              'Not applicable - no AI training': 4
            }
          },
          tags: ['ai-readiness', 'data-quality', 'training-data', 'licensing']
        },
        {
          question: 'Are models explainable and their limitations documented?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 5,
          isRequired: true,
          options: [
            'Yes - comprehensive model documentation including limitations',
            'Yes - basic model documentation',
            'Partially - some documentation',
            'No model documentation',
            'Not applicable - no AI models'
          ],
          helpText: 'Model explainability and limitation awareness are critical for responsible AI use and regulatory compliance',
          aiPromptHint: 'Assess model documentation and explainability. Look for documented decision logic, performance limitations, confidence thresholds, and explainability techniques (SHAP, LIME) for regulatory review.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive model documentation including limitations': 5,
              'Yes - basic model documentation': 3,
              'Partially - some documentation': 2,
              'No model documentation': 1,
              'Not applicable - no AI models': 4
            }
          },
          tags: ['ai-readiness', 'explainability', 'documentation', 'transparency', 'foundational']
        },
        {
          question: 'Is there human oversight for AI-assisted trade screening or document checks?',
          type: QuestionType.SELECT,
          weight: 2.0,  // Foundational
          isFoundational: true,
          order: 6,
          isRequired: true,
          options: [
            'Yes - mandatory human review of AI decisions',
            'Yes - human review for high-risk cases',
            'Partially - limited human oversight',
            'No - fully automated decisions',
            'Not applicable - no AI-assisted screening'
          ],
          helpText: 'Human oversight prevents AI errors from causing compliance violations and provides accountability',
          aiPromptHint: 'Evaluate human-in-the-loop controls. Look for mandatory human review requirements, override capabilities, escalation procedures, and documentation of review decisions.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - mandatory human review of AI decisions': 5,
              'Yes - human review for high-risk cases': 4,
              'Partially - limited human oversight': 2,
              'No - fully automated decisions': 1,
              'Not applicable - no AI-assisted screening': 4
            }
          },
          tags: ['ai-readiness', 'human-oversight', 'review', 'accountability', 'foundational']
        },
        {
          question: 'Are model validation and performance monitoring conducted regularly?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 7,
          isRequired: true,
          options: [
            'Yes - comprehensive regular validation and monitoring',
            'Yes - periodic validation',
            'Occasionally - ad hoc validation',
            'No formal validation or monitoring',
            'Not applicable - no AI models'
          ],
          helpText: 'Regular validation ensures models continue to perform as intended and detect model drift',
          aiPromptHint: 'Assess model validation program. Look for pre-deployment validation, ongoing performance monitoring, drift detection, accuracy metrics, and retraining triggers.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive regular validation and monitoring': 5,
              'Yes - periodic validation': 3,
              'Occasionally - ad hoc validation': 2,
              'No formal validation or monitoring': 1,
              'Not applicable - no AI models': 4
            }
          },
          tags: ['ai-readiness', 'validation', 'monitoring', 'model-performance']
        },
        {
          question: 'Are bias, accuracy, and fairness assessments performed?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 8,
          isRequired: true,
          options: [
            'Yes - comprehensive bias and fairness testing',
            'Yes - basic accuracy assessments',
            'Partially - limited testing',
            'No bias or fairness assessments',
            'Not applicable - no AI models'
          ],
          helpText: 'Bias assessments ensure AI doesn\'t discriminate and maintains fairness in compliance decisions',
          aiPromptHint: 'Evaluate fairness and bias testing. Look for disparate impact analysis, demographic bias testing, fairness metrics, and mitigation strategies for identified biases.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive bias and fairness testing': 5,
              'Yes - basic accuracy assessments': 3,
              'Partially - limited testing': 2,
              'No bias or fairness assessments': 1,
              'Not applicable - no AI models': 4
            }
          },
          tags: ['ai-readiness', 'bias', 'fairness', 'ethics']
        },
        {
          question: 'Are AI vendors assessed for compliance and data protection?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 9,
          isRequired: true,
          options: [
            'Yes - comprehensive vendor due diligence',
            'Yes - basic vendor assessment',
            'Partially - limited vendor review',
            'No vendor assessments',
            'Not applicable - no AI vendors'
          ],
          helpText: 'AI vendor assessments ensure third-party tools meet compliance and security requirements',
          aiPromptHint: 'Assess AI vendor due diligence. Look for evaluation of vendor compliance capabilities, data protection, security, model transparency, and contractual safeguards.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive vendor due diligence': 5,
              'Yes - basic vendor assessment': 3,
              'Partially - limited vendor review': 2,
              'No vendor assessments': 1,
              'Not applicable - no AI vendors': 4
            }
          },
          tags: ['ai-readiness', 'vendor-management', 'due-diligence']
        },
        {
          question: 'Are AI systems categorized and risk-rated under internal governance or EU AI Act criteria?',
          type: QuestionType.SELECT,
          weight: 1.5,
          isFoundational: false,
          order: 10,
          isRequired: true,
          options: [
            'Yes - comprehensive risk categorization aligned with EU AI Act',
            'Yes - basic risk categorization',
            'Under development',
            'No risk categorization',
            'Not applicable - no AI systems'
          ],
          helpText: 'AI risk categorization enables appropriate governance and compliance measures',
          aiPromptHint: 'Evaluate AI risk classification. Look for categorization framework (high/medium/low risk), EU AI Act alignment, risk-based controls, and governance requirements by risk level.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive risk categorization aligned with EU AI Act': 5,
              'Yes - basic risk categorization': 3,
              'Under development': 2,
              'No risk categorization': 1,
              'Not applicable - no AI systems': 4
            }
          },
          tags: ['ai-readiness', 'risk-rating', 'eu-ai-act', 'categorization']
        },
        {
          question: 'Are employees trained to interpret AI outputs responsibly?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 11,
          isRequired: true,
          options: [
            'Yes - comprehensive AI literacy training',
            'Yes - basic training on AI tool usage',
            'Partially - limited AI training',
            'No AI-specific training',
            'Not applicable - no AI tools'
          ],
          helpText: 'Employee understanding of AI capabilities and limitations is essential for responsible use',
          aiPromptHint: 'Assess AI training program. Look for training on AI tool capabilities, limitations, interpretation of outputs, override procedures, and escalation of unusual results.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive AI literacy training': 5,
              'Yes - basic training on AI tool usage': 3,
              'Partially - limited AI training': 2,
              'No AI-specific training': 1,
              'Not applicable - no AI tools': 4
            }
          },
          tags: ['ai-readiness', 'training', 'literacy', 'responsible-use']
        },
        {
          question: 'Is there an incident process for AI-related compliance failures?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 12,
          isRequired: true,
          options: [
            'Yes - formal AI incident response process',
            'Yes - general incident process includes AI',
            'Under development',
            'No AI incident process',
            'Not applicable - no AI usage'
          ],
          helpText: 'AI incident procedures ensure timely response to AI-related compliance issues',
          aiPromptHint: 'Evaluate AI incident management. Look for procedures to identify AI failures, assess impact, implement workarounds, investigate root cause, and prevent recurrence.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - formal AI incident response process': 5,
              'Yes - general incident process includes AI': 3,
              'Under development': 2,
              'No AI incident process': 1,
              'Not applicable - no AI usage': 4
            }
          },
          tags: ['ai-readiness', 'incident-response', 'contingency']
        },
        {
          question: 'Are manual fallback or override processes in place?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 13,
          isRequired: true,
          options: [
            'Yes - comprehensive manual fallback capabilities',
            'Yes - basic override procedures',
            'Partially - limited manual capability',
            'No fallback processes',
            'Not applicable - no AI automation'
          ],
          helpText: 'Manual fallbacks ensure business continuity when AI systems fail or produce questionable results',
          aiPromptHint: 'Assess business continuity for AI. Look for documented manual procedures, override capabilities, emergency protocols, and staff training on manual processes.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive manual fallback capabilities': 5,
              'Yes - basic override procedures': 3,
              'Partially - limited manual capability': 2,
              'No fallback processes': 1,
              'Not applicable - no AI automation': 4
            }
          },
          tags: ['ai-readiness', 'fallback', 'override', 'business-continuity']
        },
        {
          question: 'Are data privacy and export control rules applied to AI datasets?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 14,
          isRequired: true,
          options: [
            'Yes - comprehensive data governance for AI datasets',
            'Yes - basic privacy controls',
            'Partially - limited data protection',
            'No specific data governance for AI',
            'Not applicable - no AI datasets'
          ],
          helpText: 'AI datasets may contain sensitive or controlled information requiring protection',
          aiPromptHint: 'Evaluate data protection for AI. Look for privacy controls, anonymization/pseudonymization, export control assessment of technical data, and data transfer restrictions.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive data governance for AI datasets': 5,
              'Yes - basic privacy controls': 3,
              'Partially - limited data protection': 2,
              'No specific data governance for AI': 1,
              'Not applicable - no AI datasets': 4
            }
          },
          tags: ['ai-readiness', 'data-privacy', 'export-control', 'data-protection']
        },
        {
          question: 'Is the trade compliance team involved in AI design and procurement?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 15,
          isRequired: true,
          options: [
            'Yes - compliance involved in all AI initiatives',
            'Yes - compliance consulted on major initiatives',
            'Partially - limited compliance involvement',
            'No - compliance not involved in AI decisions',
            'Not applicable - no AI initiatives'
          ],
          helpText: 'Early compliance involvement ensures AI tools meet regulatory requirements',
          aiPromptHint: 'Assess compliance integration in AI lifecycle. Look for compliance participation in requirements definition, vendor selection, solution design, testing, and deployment approval.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - compliance involved in all AI initiatives': 5,
              'Yes - compliance consulted on major initiatives': 3,
              'Partially - limited compliance involvement': 2,
              'No - compliance not involved in AI decisions': 1,
              'Not applicable - no AI initiatives': 4
            }
          },
          tags: ['ai-readiness', 'compliance-involvement', 'procurement', 'design']
        },
        {
          question: 'Are AI performance dashboards or audit logs maintained?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 16,
          isRequired: true,
          options: [
            'Yes - comprehensive AI monitoring and logging',
            'Yes - basic performance tracking',
            'Partially - limited monitoring',
            'No AI-specific monitoring',
            'Not applicable - no AI systems'
          ],
          helpText: 'AI monitoring enables oversight, audit, and continuous improvement',
          aiPromptHint: 'Evaluate AI monitoring infrastructure. Look for performance dashboards, audit trails of AI decisions, logging of model predictions, and anomaly detection.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive AI monitoring and logging': 5,
              'Yes - basic performance tracking': 3,
              'Partially - limited monitoring': 2,
              'No AI-specific monitoring': 1,
              'Not applicable - no AI systems': 4
            }
          },
          tags: ['ai-readiness', 'monitoring', 'audit-logs', 'dashboards']
        },
        {
          question: 'Is there documentation for algorithmic decision logic used in screening?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 17,
          isRequired: true,
          options: [
            'Yes - comprehensive algorithm documentation',
            'Yes - basic documentation',
            'Partially - some documentation',
            'No algorithm documentation',
            'Not applicable - no algorithmic screening'
          ],
          helpText: 'Algorithm documentation enables regulatory review and audit',
          aiPromptHint: 'Assess algorithmic transparency. Look for documented decision trees, scoring logic, weighting factors, threshold settings, and rationale for algorithmic choices.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive algorithm documentation': 5,
              'Yes - basic documentation': 3,
              'Partially - some documentation': 2,
              'No algorithm documentation': 1,
              'Not applicable - no algorithmic screening': 4
            }
          },
          tags: ['ai-readiness', 'documentation', 'algorithms', 'transparency']
        },
        {
          question: 'Are external audits or certifications for AI tools considered?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 18,
          isRequired: true,
          options: [
            'Yes - AI tools externally audited/certified',
            'Under consideration',
            'No external validation',
            'Not applicable - no AI tools'
          ],
          helpText: 'External validation provides independent assurance of AI tool quality and compliance',
          aiPromptHint: 'Evaluate external validation of AI. Look for third-party audits, certifications (ISO, SOC 2), penetration testing, and independent model validation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - AI tools externally audited/certified': 5,
              'Under consideration': 3,
              'No external validation': 1,
              'Not applicable - no AI tools': 4
            }
          },
          tags: ['ai-readiness', 'audit', 'certification', 'external-validation']
        },
        {
          question: 'Are ethical standards and transparency disclosures applied to AI usage?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 19,
          isRequired: true,
          options: [
            'Yes - comprehensive AI ethics framework with transparency',
            'Yes - basic ethical guidelines',
            'Under development',
            'No ethical standards for AI',
            'Not applicable - no AI usage'
          ],
          helpText: 'Ethical AI use and transparency build trust and meet regulatory expectations',
          aiPromptHint: 'Assess AI ethics program. Look for ethical principles/guidelines, transparency about AI use, disclosure to affected parties, and ethical review of AI applications.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive AI ethics framework with transparency': 5,
              'Yes - basic ethical guidelines': 3,
              'Under development': 2,
              'No ethical standards for AI': 1,
              'Not applicable - no AI usage': 4
            }
          },
          tags: ['ai-readiness', 'ethics', 'transparency', 'responsible-ai']
        },
        {
          question: 'Is AI adoption aligned with the organization\'s compliance risk appetite and governance framework?',
          type: QuestionType.SELECT,
          weight: 1.0,
          isFoundational: false,
          order: 20,
          isRequired: true,
          options: [
            'Yes - AI adoption fully aligned with risk appetite',
            'Yes - generally aligned with some gaps',
            'Partially - limited alignment',
            'No - AI adoption not aligned with risk framework',
            'Not applicable - no AI adoption'
          ],
          helpText: 'AI adoption should align with organizational risk tolerance and governance structures',
          aiPromptHint: 'Evaluate AI-risk alignment. Look for documented risk appetite for AI, governance approval of AI initiatives, risk-based decision-making, and integration with enterprise risk management.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - AI adoption fully aligned with risk appetite': 5,
              'Yes - generally aligned with some gaps': 3,
              'Partially - limited alignment': 2,
              'No - AI adoption not aligned with risk framework': 1,
              'Not applicable - no AI adoption': 4
            }
          },
          tags: ['ai-readiness', 'risk-appetite', 'alignment', 'governance']
        }
      ]
    }
  ]
};

/**
 * Seed the Trade Compliance v3.0 template
 */
export async function seedTradeComplianceV3() {
  console.log('🌱 Seeding Trade Compliance Assessment v3.0 template...');

  // Check if template already exists
  const existing = await prisma.template.findUnique({
    where: { slug: TRADE_COMPLIANCE_V3_TEMPLATE.slug }
  });

  if (existing) {
    console.log(`⚠️  Template '${TRADE_COMPLIANCE_V3_TEMPLATE.slug}' already exists, skipping...`);
    return existing;
  }

  // Create the template with all sections and questions
  const template = await prisma.template.create({
    data: {
      name: TRADE_COMPLIANCE_V3_TEMPLATE.name,
      slug: TRADE_COMPLIANCE_V3_TEMPLATE.slug,
      category: TRADE_COMPLIANCE_V3_TEMPLATE.category,
      description: TRADE_COMPLIANCE_V3_TEMPLATE.description,
      version: TRADE_COMPLIANCE_V3_TEMPLATE.version,
      estimatedMinutes: TRADE_COMPLIANCE_V3_TEMPLATE.estimatedMinutes,
      isActive: TRADE_COMPLIANCE_V3_TEMPLATE.isActive,
      tags: TRADE_COMPLIANCE_V3_TEMPLATE.tags,
      createdBy: 'system',
      sections: {
        create: TRADE_COMPLIANCE_V3_TEMPLATE.sections.map((section) => ({
          title: section.title,
          description: section.description,
          weight: section.weight,
          order: section.order,
          isRequired: section.isRequired,
          questions: {
            create: section.questions.map((question) => ({
              text: question.question,
              type: question.type,
              weight: question.weight,
              isFoundational: question.isFoundational,
              order: question.order,
              required: question.isRequired,
              options: question.options || [],
              helpText: question.helpText,
              aiPromptHint: question.aiPromptHint,
              scoringRules: question.scoringRules,
              validation: question.validationRules,
              tags: question.tags || []
            }))
          }
        }))
      }
    },
    include: {
      sections: {
        include: {
          questions: true
        }
      }
    }
  });

  console.log(`✅ Created template: ${template.name} (${template.sections.length} sections)`);

  // Log statistics
  const totalQuestions = template.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const foundationalQuestions = template.sections.reduce(
    (sum, s) => sum + s.questions.filter(q => q.isFoundational).length,
    0
  );

  console.log(`   📊 Statistics:`);
  console.log(`      - Total Questions: ${totalQuestions}`);
  console.log(`      - Foundational Questions: ${foundationalQuestions} (${Math.round(foundationalQuestions / totalQuestions * 100)}%)`);
  console.log(`      - Estimated Time: ${template.estimatedMinutes} minutes`);

  return template;
}
