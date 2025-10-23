/**
 * Template Seed Data for Heliolus Platform
 * Comprehensive assessment templates for Financial Crime and Trade Compliance
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
  displayOrder: number;
  isRequired: boolean;
  instructions?: string;
  questions: QuestionData[];
}

export interface QuestionData {
  question: string;
  type: QuestionType;
  displayOrder: number;
  isRequired: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  aiPromptHint?: string;
  scoringRules: any;
  validationRules?: any;
  tags: string[];
}

export const FINANCIAL_CRIME_TEMPLATE: TemplateData = {
  name: 'Financial Crime Compliance Assessment',
  slug: 'financial-crime-compliance',
  category: TemplateCategory.FINANCIAL_CRIME,
  description: 'Comprehensive assessment evaluating AML/CFT, KYC, sanctions screening, and transaction monitoring capabilities for financial institutions and regulated entities.',
  version: '2.0',
  estimatedMinutes: 45,
  instructions: `
This assessment evaluates your organization's financial crime compliance framework across five critical areas:

1. **Geographic Risk Assessment**: Understanding exposure to high-risk jurisdictions and sanctions regimes
2. **Product & Service Risk**: Evaluation of inherent risks in your offerings and customer base
3. **Transaction Risk & Monitoring**: Assessment of transaction monitoring capabilities and suspicious activity detection
4. **Governance & Controls**: Review of organizational structure, policies, and oversight mechanisms
5. **Regulatory Alignment**: Evaluation of compliance with applicable regulations and reporting requirements

**Instructions:**
- Answer all questions honestly and thoroughly
- Provide specific examples where requested
- Upload supporting documentation when available
- If unsure about a question, provide your best assessment and note any uncertainties

Your responses will be analyzed using AI to identify gaps, assess risks, and generate tailored recommendations.
  `,
  isActive: true,
  tags: ['aml', 'kyc', 'sanctions', 'financial-crime', 'compliance'],
  sections: [
    {
      title: 'Geographic Risk Assessment',
      description: 'Evaluation of exposure to high-risk jurisdictions and geographic compliance considerations',
      displayOrder: 1,
      isRequired: true,
      instructions: 'Focus on your organization\'s geographic footprint and associated compliance risks',
      questions: [
        {
          question: 'What countries/jurisdictions does your organization operate in or serve customers from?',
          type: QuestionType.MULTISELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'United States', 'United Kingdom', 'European Union (specify countries)',
            'Canada', 'Australia', 'Japan', 'Singapore', 'Hong Kong',
            'Switzerland', 'Middle East (specify countries)', 'Latin America (specify countries)',
            'Africa (specify countries)', 'Other (specify)'
          ],
          helpText: 'Select all jurisdictions where you have operations, customers, or business activities',
          aiPromptHint: 'Analyze the geographic risk profile based on selected jurisdictions. Consider FATF ratings, sanctions regimes, and regulatory complexity. Flag high-risk jurisdictions and assess overall geographic risk exposure.',
          scoringRules: {
            scale: 5,
            criteria: {
              5: 'Operations limited to low-risk jurisdictions with strong AML frameworks',
              4: 'Primarily low-risk jurisdictions with minimal high-risk exposure',
              3: 'Mixed risk profile with moderate high-risk jurisdiction exposure',
              2: 'Significant exposure to high-risk or non-cooperative jurisdictions',
              1: 'Heavy exposure to sanctioned or high-risk jurisdictions without adequate controls'
            }
          },
          tags: ['geographic-risk', 'jurisdiction', 'fatf', 'sanctions']
        },
        {
          question: 'How does your organization assess and monitor country/jurisdiction risk?',
          type: QuestionType.TEXT,
          displayOrder: 2,
          isRequired: true,
          placeholder: 'Describe your country risk assessment methodology, frequency of updates, and risk rating systems...',
          helpText: 'Explain your process for evaluating geographic risks including data sources, update frequency, and risk categorization',
          aiPromptHint: 'Evaluate the sophistication and comprehensiveness of the country risk assessment process. Look for use of recognized risk sources (FATF, Transparency International), regular updates, risk-based approach, and integration with business decisions.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['fatf', 'risk assessment', 'regular updates', 'risk matrix', 'due diligence'],
              negative: ['no process', 'informal', 'outdated', 'manual only']
            }
          },
          tags: ['risk-assessment', 'monitoring', 'methodology']
        },
        {
          question: 'Do you have enhanced due diligence procedures for high-risk jurisdictions?',
          type: QuestionType.SELECT,
          displayOrder: 3,
          isRequired: true,
          options: ['Yes - comprehensive procedures', 'Yes - basic procedures', 'Partially implemented', 'No - under development', 'No procedures in place'],
          helpText: 'Enhanced Due Diligence (EDD) should include additional verification, monitoring, and approval requirements',
          aiPromptHint: 'Assess the adequacy of enhanced due diligence procedures for high-risk jurisdictions. Look for risk-based approach, additional verification requirements, enhanced monitoring, and senior management approval processes.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive procedures': 5,
              'Yes - basic procedures': 4,
              'Partially implemented': 3,
              'No - under development': 2,
              'No procedures in place': 1
            }
          },
          tags: ['edd', 'high-risk', 'procedures', 'due-diligence']
        },
        {
          question: 'How do you stay current with sanctions regime changes and updates?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe your sanctions monitoring process, data sources, and update procedures...',
          helpText: 'Explain how you monitor for sanctions updates from OFAC, EU, UN, and other relevant authorities',
          aiPromptHint: 'Evaluate the sanctions monitoring process for completeness and timeliness. Look for use of multiple authoritative sources, real-time updates, automated screening updates, and staff training on changes.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['real-time', 'automated', 'multiple sources', 'ofac', 'training'],
              negative: ['manual', 'infrequent', 'single source', 'delays']
            }
          },
          tags: ['sanctions', 'monitoring', 'updates', 'ofac']
        }
      ]
    },
    {
      title: 'Product & Service Risk',
      description: 'Assessment of inherent risks in products, services, and customer segments',
      displayOrder: 2,
      isRequired: true,
      instructions: 'Consider the money laundering and terrorist financing risks inherent in your business model',
      questions: [
        {
          question: 'What types of financial products or services does your organization offer?',
          type: QuestionType.MULTISELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'Deposit accounts', 'Lending/Credit', 'Wire transfers', 'Foreign exchange',
            'Trade finance', 'Private banking', 'Investment services', 'Payment processing',
            'Money transmission', 'Cryptocurrency services', 'Prepaid cards',
            'Cash services', 'Trust services', 'Other (specify)'
          ],
          helpText: 'Select all applicable products and services offered to customers',
          aiPromptHint: 'Analyze the inherent money laundering and terrorist financing risks associated with the selected products/services. Consider velocity, anonymity, cross-border nature, and regulatory focus areas.',
          scoringRules: {
            scale: 5,
            riskFactors: {
              high: ['cryptocurrency', 'money transmission', 'cash services', 'private banking'],
              medium: ['wire transfers', 'foreign exchange', 'trade finance'],
              low: ['deposit accounts', 'lending']
            }
          },
          tags: ['products', 'services', 'inherent-risk', 'ml-risk']
        },
        {
          question: 'How do you conduct product risk assessments for new and existing offerings?',
          type: QuestionType.TEXT,
          displayOrder: 2,
          isRequired: true,
          placeholder: 'Describe your product risk assessment methodology, approval process, and review frequency...',
          helpText: 'Explain your process for evaluating ML/TF risks in products before launch and ongoing reviews',
          aiPromptHint: 'Evaluate the product risk assessment process for comprehensiveness and risk-based approach. Look for formal methodology, risk factors consideration, approval requirements, periodic reviews, and risk mitigation measures.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['risk matrix', 'formal process', 'approval', 'periodic review', 'mitigation'],
              negative: ['no process', 'informal', 'ad hoc', 'no reviews']
            }
          },
          tags: ['product-risk', 'assessment', 'methodology', 'approval']
        },
        {
          question: 'What is your customer risk profile and segmentation approach?',
          type: QuestionType.TEXT,
          displayOrder: 3,
          isRequired: true,
          placeholder: 'Describe your customer segments, risk categories, and differentiated approaches...',
          helpText: 'Explain how you categorize customers by risk level and apply different due diligence measures',
          aiPromptHint: 'Assess the sophistication of customer risk segmentation. Look for multiple risk factors, clear criteria, differentiated due diligence approaches, and regular reassessment of customer risk profiles.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['risk-based', 'segmentation', 'multiple factors', 'regular review'],
              negative: ['one size fits all', 'basic', 'no segmentation']
            }
          },
          tags: ['customer-risk', 'segmentation', 'risk-profiling']
        },
        {
          question: 'Do you serve Politically Exposed Persons (PEPs) or high-risk customers?',
          type: QuestionType.SELECT,
          displayOrder: 4,
          isRequired: true,
          options: ['Yes - with enhanced controls', 'Yes - with basic controls', 'Limited exposure', 'No PEP customers', 'Unsure/No formal identification'],
          helpText: 'PEPs include government officials, their families, and close associates',
          aiPromptHint: 'Evaluate PEP exposure and control adequacy. Assess identification processes, enhanced due diligence measures, ongoing monitoring, and senior management approval requirements.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - with enhanced controls': 4,
              'Yes - with basic controls': 3,
              'Limited exposure': 4,
              'No PEP customers': 5,
              'Unsure/No formal identification': 1
            }
          },
          tags: ['pep', 'high-risk', 'enhanced-controls']
        },
        {
          question: 'How do you handle high-risk or unusual transaction patterns?',
          type: QuestionType.TEXT,
          displayOrder: 5,
          isRequired: true,
          placeholder: 'Describe your approach to identifying, investigating, and managing unusual transactions...',
          helpText: 'Explain your process for handling transactions that fall outside normal customer patterns',
          aiPromptHint: 'Analyze the unusual transaction handling process. Look for clear escalation procedures, investigation protocols, documentation requirements, and decision-making authority levels.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['investigation', 'escalation', 'documentation', 'approval', 'monitoring'],
              negative: ['manual', 'informal', 'no process', 'unclear']
            }
          },
          tags: ['unusual-transactions', 'investigation', 'escalation']
        }
      ]
    },
    {
      title: 'Transaction Risk & Monitoring',
      description: 'Evaluation of transaction monitoring systems and suspicious activity detection capabilities',
      displayOrder: 3,
      isRequired: true,
      instructions: 'Focus on your ability to detect and investigate potentially suspicious transactions',
      questions: [
        {
          question: 'What type of transaction monitoring system do you use?',
          type: QuestionType.SELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'Advanced AI/ML-based system',
            'Rules-based system with behavioral analytics',
            'Basic rules-based system',
            'Manual monitoring processes',
            'No formal monitoring system'
          ],
          helpText: 'Transaction monitoring systems should detect unusual patterns and potential money laundering activities',
          aiPromptHint: 'Evaluate the sophistication and effectiveness of the transaction monitoring system. Consider detection capabilities, false positive rates, coverage, and ability to adapt to new typologies.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Advanced AI/ML-based system': 5,
              'Rules-based system with behavioral analytics': 4,
              'Basic rules-based system': 3,
              'Manual monitoring processes': 2,
              'No formal monitoring system': 1
            }
          },
          tags: ['transaction-monitoring', 'system', 'technology']
        },
        {
          question: 'How do you tune and optimize your monitoring rules and scenarios?',
          type: QuestionType.TEXT,
          displayOrder: 2,
          isRequired: true,
          placeholder: 'Describe your rule tuning process, performance metrics, and optimization frequency...',
          helpText: 'Effective monitoring requires regular tuning to balance detection with false positives',
          aiPromptHint: 'Assess the rule tuning and optimization process. Look for regular performance reviews, metrics tracking, false positive management, and scenario effectiveness analysis.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['regular tuning', 'metrics', 'false positive', 'optimization', 'performance'],
              negative: ['no tuning', 'static rules', 'high false positives', 'manual']
            }
          },
          tags: ['rule-tuning', 'optimization', 'false-positives']
        },
        {
          question: 'What is your average monthly volume of transaction monitoring alerts?',
          type: QuestionType.SELECT,
          displayOrder: 3,
          isRequired: true,
          options: ['0-100 alerts', '101-500 alerts', '501-1,000 alerts', '1,001-5,000 alerts', 'Over 5,000 alerts', 'Unknown/Not tracked'],
          helpText: 'Alert volumes should be manageable and proportionate to your transaction volumes',
          aiPromptHint: 'Evaluate alert volume appropriateness relative to business size and transaction volume. Assess if volumes are manageable for effective investigation.',
          scoringRules: {
            scale: 5,
            contextual: true,
            businessSize: 'Consider organization size and transaction volume'
          },
          tags: ['alert-volume', 'monitoring', 'investigation']
        },
        {
          question: 'How do you investigate and disposition monitoring alerts?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe your alert investigation process, timeframes, documentation, and escalation procedures...',
          helpText: 'Include investigation procedures, timeframes, documentation requirements, and escalation paths',
          aiPromptHint: 'Analyze the alert investigation process for thoroughness and efficiency. Look for clear procedures, appropriate timeframes, proper documentation, escalation protocols, and quality assurance measures.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['formal process', 'timeframes', 'documentation', 'escalation', 'quality review'],
              negative: ['informal', 'no timeframes', 'poor documentation', 'manual']
            }
          },
          tags: ['alert-investigation', 'procedures', 'documentation']
        },
        {
          question: 'What tools and databases do you use for transaction investigation?',
          type: QuestionType.MULTISELECT,
          displayOrder: 5,
          isRequired: true,
          options: [
            'Internal transaction history',
            'Public records databases',
            'Commercial investigation tools',
            'Internet searches',
            'Regulatory databases',
            'Sanctions screening results',
            'Industry databases',
            'News and media searches',
            'Other (specify)'
          ],
          helpText: 'Select all resources used during alert investigations',
          aiPromptHint: 'Evaluate the comprehensiveness of investigation tools and resources. More diverse and sophisticated tools generally enable more thorough investigations.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '1-2': 2,
              '3-4': 3,
              '5-6': 4,
              '7+': 5
            }
          },
          tags: ['investigation-tools', 'databases', 'resources']
        }
      ]
    },
    {
      title: 'Governance & Controls',
      description: 'Assessment of organizational structure, policies, and oversight mechanisms',
      displayOrder: 4,
      isRequired: true,
      instructions: 'Focus on your compliance program structure and governance framework',
      questions: [
        {
          question: 'Who is your designated AML/BSA Officer or equivalent compliance officer?',
          type: QuestionType.SELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'Dedicated full-time AML Officer',
            'Part-time designated officer with AML focus',
            'General compliance officer handling AML',
            'Senior management member',
            'External consultant',
            'No designated officer'
          ],
          helpText: 'The AML Officer should have appropriate authority, resources, and direct access to senior management',
          aiPromptHint: 'Assess the appropriateness of AML Officer designation considering organizational size, complexity, and regulatory requirements. Evaluate independence and authority level.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Dedicated full-time AML Officer': 5,
              'Part-time designated officer with AML focus': 4,
              'General compliance officer handling AML': 3,
              'Senior management member': 3,
              'External consultant': 2,
              'No designated officer': 1
            }
          },
          tags: ['aml-officer', 'governance', 'responsibility']
        },
        {
          question: 'How often does your board or senior management review AML compliance?',
          type: QuestionType.SELECT,
          displayOrder: 2,
          isRequired: true,
          options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually', 'As needed/Ad hoc', 'Never/No formal review'],
          helpText: 'Regular board oversight is essential for effective AML program governance',
          aiPromptHint: 'Evaluate the frequency and adequacy of board/senior management oversight. More frequent reviews generally indicate stronger governance and oversight.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Monthly': 5,
              'Quarterly': 4,
              'Semi-annually': 3,
              'Annually': 2,
              'As needed/Ad hoc': 2,
              'Never/No formal review': 1
            }
          },
          tags: ['board-oversight', 'governance', 'review-frequency']
        },
        {
          question: 'Describe your AML training program for staff and management',
          type: QuestionType.TEXT,
          displayOrder: 3,
          isRequired: true,
          placeholder: 'Include training content, frequency, delivery methods, and record-keeping...',
          helpText: 'Training should be risk-based, role-specific, and regularly updated',
          aiPromptHint: 'Evaluate the AML training program for comprehensiveness, risk-based approach, role specificity, frequency, and effectiveness measurement. Look for regular updates and record-keeping.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['role-specific', 'regular', 'updated', 'records', 'testing', 'risk-based'],
              negative: ['generic', 'infrequent', 'outdated', 'no records', 'one-time']
            }
          },
          tags: ['training', 'staff-development', 'awareness']
        },
        {
          question: 'How do you ensure third parties and agents comply with AML requirements?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe due diligence, contractual requirements, monitoring, and oversight of third parties...',
          helpText: 'Include agent due diligence, contractual obligations, monitoring, and audit procedures',
          aiPromptHint: 'Assess third-party risk management for AML compliance. Look for proper due diligence, contractual provisions, ongoing monitoring, audit rights, and risk-based oversight.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['due diligence', 'contracts', 'monitoring', 'audit', 'risk-based'],
              negative: ['no process', 'minimal oversight', 'informal', 'no contracts']
            }
          },
          tags: ['third-party', 'agent-oversight', 'due-diligence']
        },
        {
          question: 'What internal audit or independent testing do you conduct on your AML program?',
          type: QuestionType.SELECT,
          displayOrder: 5,
          isRequired: true,
          options: [
            'Annual comprehensive independent audit',
            'Regular internal audit with external validation',
            'Periodic internal review only',
            'Management self-assessment',
            'No formal testing program'
          ],
          helpText: 'Independent testing helps identify program weaknesses and ensure effectiveness',
          aiPromptHint: 'Evaluate the independence and comprehensiveness of AML program testing. Independent audits provide better assurance than self-assessments.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Annual comprehensive independent audit': 5,
              'Regular internal audit with external validation': 4,
              'Periodic internal review only': 3,
              'Management self-assessment': 2,
              'No formal testing program': 1
            }
          },
          tags: ['audit', 'testing', 'independent-review']
        }
      ]
    },
    {
      title: 'Regulatory Alignment',
      description: 'Evaluation of compliance with applicable AML/CFT regulations and reporting requirements',
      displayOrder: 5,
      isRequired: true,
      instructions: 'Consider your specific regulatory obligations and reporting practices',
      questions: [
        {
          question: 'Which AML/CFT regulations apply to your organization?',
          type: QuestionType.MULTISELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'Bank Secrecy Act (BSA) - US',
            'Anti-Money Laundering Act (AMLA) - US',
            'EU AML Directives',
            'UK Money Laundering Regulations',
            'FATF Recommendations',
            'Local/National AML laws',
            'OFAC Sanctions',
            'Other sanctions regimes',
            'Industry-specific regulations'
          ],
          helpText: 'Select all applicable regulatory frameworks based on your jurisdictions and business type',
          aiPromptHint: 'Assess regulatory complexity and compliance burden based on applicable frameworks. Multiple jurisdictions increase complexity but demonstrate global operations.',
          scoringRules: {
            scale: 5,
            complexityBased: true,
            note: 'More regulations increase complexity but demonstrate broader compliance scope'
          },
          tags: ['regulations', 'compliance-framework', 'jurisdiction']
        },
        {
          question: 'How do you file Suspicious Activity Reports (SARs) or equivalent?',
          type: QuestionType.TEXT,
          displayOrder: 2,
          isRequired: true,
          placeholder: 'Describe your SAR filing process, timeframes, quality review, and record-keeping...',
          helpText: 'Include decision criteria, approval process, filing timeframes, and record retention',
          aiPromptHint: 'Evaluate SAR filing process for compliance with regulatory requirements. Look for timely filing, proper review and approval, quality controls, and appropriate record-keeping.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['timely', 'review', 'approval', 'quality', 'records', 'criteria'],
              negative: ['delays', 'no process', 'informal', 'poor quality']
            }
          },
          tags: ['sar-filing', 'suspicious-activity', 'reporting']
        },
        {
          question: 'What is your Currency Transaction Report (CTR) filing volume and process?',
          type: QuestionType.SELECT,
          displayOrder: 3,
          isRequired: false,
          options: [
            '0 CTRs (no cash transactions >$10K)',
            '1-10 CTRs per month',
            '11-50 CTRs per month',
            '51-200 CTRs per month',
            'Over 200 CTRs per month',
            'Not applicable to our business'
          ],
          helpText: 'CTRs are required for cash transactions over $10,000 in the US',
          aiPromptHint: 'Assess CTR filing volume relative to business type and cash transaction exposure. Evaluate if volume is appropriate for the business model.',
          scoringRules: {
            scale: 5,
            businessContextual: true,
            note: 'Score based on appropriateness for business type'
          },
          tags: ['ctr-filing', 'cash-transactions', 'reporting']
        },
        {
          question: 'How do you maintain records and respond to regulatory requests?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe your record retention policies, data management, and regulatory response procedures...',
          helpText: 'Include retention periods, data accessibility, search capabilities, and response timeframes',
          aiPromptHint: 'Evaluate record-keeping and regulatory response capabilities. Look for appropriate retention periods, organized systems, quick retrieval capabilities, and timely response procedures.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['retention policy', 'organized', 'searchable', 'timely response', 'procedures'],
              negative: ['disorganized', 'manual', 'delays', 'no policy', 'difficult retrieval']
            }
          },
          tags: ['record-keeping', 'regulatory-response', 'data-management']
        },
        {
          question: 'Have you had any regulatory examinations, findings, or enforcement actions?',
          type: QuestionType.SELECT,
          displayOrder: 5,
          isRequired: true,
          options: [
            'No examinations or issues',
            'Clean examinations with no findings',
            'Minor findings - all remediated',
            'Significant findings - remediation in progress',
            'Enforcement action - resolved',
            'Current regulatory issues'
          ],
          helpText: 'Include examinations, audit findings, consent orders, or penalties from the last 3 years',
          aiPromptHint: 'Assess regulatory history and current standing. Clean history indicates effective compliance, while issues suggest need for program improvements.',
          scoringRules: {
            scale: 5,
            mapping: {
              'No examinations or issues': 4,
              'Clean examinations with no findings': 5,
              'Minor findings - all remediated': 4,
              'Significant findings - remediation in progress': 2,
              'Enforcement action - resolved': 2,
              'Current regulatory issues': 1
            }
          },
          tags: ['regulatory-history', 'examinations', 'enforcement']
        }
      ]
    }
  ]
};

export const TRADE_COMPLIANCE_TEMPLATE: TemplateData = {
  name: 'Trade Compliance Assessment',
  slug: 'trade-compliance-assessment',
  category: TemplateCategory.TRADE_COMPLIANCE,
  description: 'Comprehensive evaluation of international trade compliance capabilities including export controls, import regulations, trade sanctions, and supply chain compliance.',
  version: '2.0',
  estimatedMinutes: 40,
  instructions: `
This assessment evaluates your organization's international trade compliance program across five key areas:

1. **Export Controls**: Compliance with export control regulations and dual-use technology controls
2. **Import Regulations**: Assessment of import compliance, customs procedures, and classification accuracy
3. **Trade Sanctions**: Evaluation of sanctions screening and restricted party compliance
4. **Documentation & Procedures**: Review of trade documentation accuracy and procedural compliance
5. **Supply Chain Compliance**: Assessment of supplier due diligence and supply chain risk management

**Instructions:**
- Focus on your current trade operations and compliance practices
- Provide specific examples of procedures and controls
- Upload relevant trade documentation and policies when available
- Consider both import and export activities in your responses

The assessment will analyze your responses to identify compliance gaps and provide actionable recommendations.
  `,
  isActive: true,
  tags: ['export-control', 'import-regulation', 'trade-sanctions', 'supply-chain', 'customs'],
  sections: [
    {
      title: 'Export Controls',
      description: 'Assessment of export control compliance and dual-use technology management',
      displayOrder: 1,
      isRequired: true,
      instructions: 'Focus on your export control procedures and technology transfer compliance',
      questions: [
        {
          question: 'What types of products or technologies does your organization export?',
          type: QuestionType.MULTISELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'Commercial goods (non-controlled)',
            'Dual-use items (EAR controlled)',
            'Military/Defense articles (ITAR controlled)',
            'Software and technology',
            'Technical data and blueprints',
            'Encryption products',
            'Medical devices',
            'Chemicals',
            'No exports',
            'Other (specify)'
          ],
          helpText: 'Select all categories of products or technologies you export',
          aiPromptHint: 'Analyze export control risk based on product types. ITAR and dual-use items carry higher compliance requirements and penalties. Assess the complexity of applicable regulations.',
          scoringRules: {
            scale: 5,
            riskFactors: {
              high: ['Military/Defense articles', 'Dual-use items', 'Encryption products'],
              medium: ['Software and technology', 'Technical data', 'Chemicals'],
              low: ['Commercial goods', 'Medical devices']
            }
          },
          tags: ['export-control', 'product-classification', 'itar', 'ear']
        },
        {
          question: 'How do you classify products for export control purposes?',
          type: QuestionType.TEXT,
          displayOrder: 2,
          isRequired: true,
          placeholder: 'Describe your classification process, use of expert resources, and documentation procedures...',
          helpText: 'Include your process for determining Export Control Classification Numbers (ECCNs) or ITAR designations',
          aiPromptHint: 'Evaluate the rigor and accuracy of export classification processes. Look for use of expert resources, formal procedures, documentation, and regular reviews.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['expert review', 'formal process', 'documentation', 'eccn', 'regular review'],
              negative: ['informal', 'no process', 'assumptions', 'undocumented']
            }
          },
          tags: ['classification', 'eccn', 'export-control']
        },
        {
          question: 'What export licensing procedures do you follow?',
          type: QuestionType.TEXT,
          displayOrder: 3,
          isRequired: true,
          placeholder: 'Describe license application processes, exemption usage, and approval procedures...',
          helpText: 'Include license applications, license exemptions (e.g., ENC), and internal approval processes',
          aiPromptHint: 'Assess export licensing compliance procedures. Look for proper license applications, appropriate use of exemptions, internal controls, and approval processes.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['license application', 'exemption', 'approval process', 'tracking', 'compliance'],
              negative: ['no licenses', 'informal', 'assumptions', 'violations']
            }
          },
          tags: ['export-licensing', 'approvals', 'exemptions']
        },
        {
          question: 'How do you screen export destinations and end users?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe your screening process, databases used, and red flag procedures...',
          helpText: 'Include screening against restricted party lists and end-use/end-user verification',
          aiPromptHint: 'Evaluate destination and end-user screening processes. Look for comprehensive screening, multiple databases, red flag identification, and verification procedures.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['screening', 'restricted parties', 'verification', 'red flags', 'databases'],
              negative: ['no screening', 'minimal', 'informal', 'no verification']
            }
          },
          tags: ['screening', 'end-user', 'restricted-parties']
        },
        {
          question: 'Do you have deemed export controls for foreign national employees or visitors?',
          type: QuestionType.SELECT,
          displayOrder: 5,
          isRequired: true,
          options: [
            'Yes - comprehensive deemed export program',
            'Yes - basic controls in place',
            'Partially implemented',
            'No - but no foreign nationals with access',
            'No controls - not aware of requirement'
          ],
          helpText: 'Deemed exports occur when controlled technology is shared with foreign nationals',
          aiPromptHint: 'Assess deemed export compliance. This is a commonly overlooked area that can result in significant violations. Evaluate awareness and control implementation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive deemed export program': 5,
              'Yes - basic controls in place': 4,
              'Partially implemented': 3,
              'No - but no foreign nationals with access': 4,
              'No controls - not aware of requirement': 1
            }
          },
          tags: ['deemed-export', 'foreign-nationals', 'technology-control']
        }
      ]
    },
    {
      title: 'Import Regulations',
      description: 'Evaluation of import compliance procedures and customs requirements',
      displayOrder: 2,
      isRequired: true,
      instructions: 'Consider your import operations and customs compliance practices',
      questions: [
        {
          question: 'What types of goods does your organization import?',
          type: QuestionType.MULTISELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'Raw materials',
            'Finished goods for resale',
            'Manufacturing equipment',
            'Technology products',
            'Textiles and apparel',
            'Food and agricultural products',
            'Chemicals',
            'Medical devices',
            'No imports',
            'Other (specify)'
          ],
          helpText: 'Select all categories of goods you import',
          aiPromptHint: 'Analyze import complexity based on product types. Different goods have varying regulatory requirements and potential risks.',
          scoringRules: {
            scale: 5,
            complexity: 'based_on_variety_and_regulatory_requirements'
          },
          tags: ['import-goods', 'product-types', 'customs']
        },
        {
          question: 'How do you ensure accurate customs classification and valuation?',
          type: QuestionType.TEXT,
          displayOrder: 2,
          isRequired: true,
          placeholder: 'Describe your classification process, use of customs brokers, and valuation methods...',
          helpText: 'Include HTS code determination, valuation methods, and quality assurance procedures',
          aiPromptHint: 'Evaluate customs classification and valuation accuracy procedures. Look for proper HTS classification, transfer pricing compliance, and professional broker usage.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['hts classification', 'customs broker', 'valuation', 'quality assurance', 'professional'],
              negative: ['informal', 'estimates', 'no verification', 'inaccurate']
            }
          },
          tags: ['classification', 'valuation', 'hts-codes', 'customs-broker']
        },
        {
          question: 'What country of origin determination and marking procedures do you follow?',
          type: QuestionType.TEXT,
          displayOrder: 3,
          isRequired: true,
          placeholder: 'Describe origin determination methods, marking compliance, and certificate procedures...',
          helpText: 'Include country of origin rules, marking requirements, and certificate of origin procedures',
          aiPromptHint: 'Assess country of origin compliance procedures. This affects duty rates, trade agreements, and marking requirements. Look for proper determination methods and documentation.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['origin determination', 'marking', 'certificates', 'trade agreements', 'documentation'],
              negative: ['assumptions', 'no marking', 'unclear origin', 'no procedures']
            }
          },
          tags: ['country-origin', 'marking', 'certificates', 'trade-agreements']
        },
        {
          question: 'How do you handle special trade programs and preferences?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe use of trade agreements, duty preferences, and special programs...',
          helpText: 'Include NAFTA/USMCA, GSP, free trade agreements, and other preference programs',
          aiPromptHint: 'Evaluate utilization of trade preferences and special programs. These can provide duty savings but require proper compliance and documentation.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['trade agreements', 'preferences', 'documentation', 'compliance', 'savings'],
              negative: ['not using', 'unaware', 'non-compliant', 'no documentation']
            }
          },
          tags: ['trade-preferences', 'free-trade-agreements', 'duty-savings']
        },
        {
          question: 'What import compliance monitoring and audit procedures do you have?',
          type: QuestionType.TEXT,
          displayOrder: 5,
          isRequired: true,
          placeholder: 'Describe compliance monitoring, internal audits, and corrective action procedures...',
          helpText: 'Include periodic reviews, compliance monitoring, and procedures for addressing errors',
          aiPromptHint: 'Assess import compliance monitoring and audit capabilities. Look for proactive compliance measures, error detection, and corrective action processes.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['monitoring', 'audit', 'reviews', 'corrective action', 'proactive'],
              negative: ['reactive only', 'no monitoring', 'no audits', 'informal']
            }
          },
          tags: ['compliance-monitoring', 'audit', 'corrective-action']
        }
      ]
    },
    {
      title: 'Trade Sanctions',
      description: 'Assessment of trade sanctions compliance and restricted party screening',
      displayOrder: 3,
      isRequired: true,
      instructions: 'Focus on your sanctions compliance and restricted party screening procedures',
      questions: [
        {
          question: 'Which sanctions regimes apply to your trade operations?',
          type: QuestionType.MULTISELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'U.S. OFAC sanctions',
            'EU sanctions',
            'UK sanctions',
            'UN sanctions',
            'Sectoral sanctions (e.g., Russia, Iran)',
            'Country-specific embargoes',
            'Entity-specific sanctions',
            'Secondary sanctions',
            'Not applicable - no sanctions exposure'
          ],
          helpText: 'Select all applicable sanctions regimes based on your operations and markets',
          aiPromptHint: 'Analyze sanctions compliance complexity based on applicable regimes. Multiple regimes increase complexity but demonstrate global trade exposure.',
          scoringRules: {
            scale: 5,
            complexity: 'based_on_number_and_complexity_of_regimes'
          },
          tags: ['sanctions', 'ofac', 'compliance-regimes']
        },
        {
          question: 'How do you screen customers, suppliers, and business partners?',
          type: QuestionType.TEXT,
          displayOrder: 2,
          isRequired: true,
          placeholder: 'Describe screening procedures, databases used, and frequency of checks...',
          helpText: 'Include initial screening, ongoing monitoring, and screening database updates',
          aiPromptHint: 'Evaluate sanctions screening procedures for comprehensiveness and effectiveness. Look for multiple databases, regular updates, ongoing monitoring, and proper documentation.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['screening', 'multiple databases', 'ongoing monitoring', 'regular updates', 'documentation'],
              negative: ['manual', 'infrequent', 'single database', 'no monitoring']
            }
          },
          tags: ['sanctions-screening', 'customer-screening', 'supplier-screening']
        },
        {
          question: 'What procedures do you follow when screening identifies a potential match?',
          type: QuestionType.TEXT,
          displayOrder: 3,
          isRequired: true,
          placeholder: 'Describe investigation procedures, approval requirements, and documentation practices...',
          helpText: 'Include false positive resolution, escalation procedures, and record-keeping',
          aiPromptHint: 'Assess match resolution procedures. Look for thorough investigation, proper escalation, documentation requirements, and conservative approach to potential matches.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['investigation', 'escalation', 'documentation', 'conservative approach', 'approval'],
              negative: ['informal', 'assumptions', 'poor documentation', 'risky decisions']
            }
          },
          tags: ['match-resolution', 'false-positives', 'investigation']
        },
        {
          question: 'How do you stay current with sanctions updates and changes?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe monitoring procedures, update sources, and staff notification processes...',
          helpText: 'Include monitoring of OFAC, EU, and other relevant authorities for sanctions updates',
          aiPromptHint: 'Evaluate sanctions update monitoring procedures. Timely awareness of changes is critical for compliance. Look for multiple sources, timely updates, and staff communication.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['monitoring', 'timely updates', 'multiple sources', 'staff notification', 'procedures'],
              negative: ['infrequent', 'manual', 'single source', 'delays', 'informal']
            }
          },
          tags: ['sanctions-updates', 'monitoring', 'compliance-updates']
        },
        {
          question: 'Do you have procedures for handling sanctions violations or potential violations?',
          type: QuestionType.SELECT,
          displayOrder: 5,
          isRequired: true,
          options: [
            'Yes - comprehensive violation response procedures',
            'Yes - basic procedures in place',
            'Informal procedures only',
            'No formal procedures',
            'Never considered this scenario'
          ],
          helpText: 'Violation response should include investigation, reporting, and corrective actions',
          aiPromptHint: 'Assess sanctions violation response preparedness. Proper procedures demonstrate compliance awareness and preparedness for potential issues.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Yes - comprehensive violation response procedures': 5,
              'Yes - basic procedures in place': 4,
              'Informal procedures only': 2,
              'No formal procedures': 1,
              'Never considered this scenario': 1
            }
          },
          tags: ['violation-response', 'incident-management', 'compliance-procedures']
        }
      ]
    },
    {
      title: 'Documentation & Procedures',
      description: 'Assessment of trade documentation accuracy and procedural compliance',
      displayOrder: 4,
      isRequired: true,
      instructions: 'Focus on your trade documentation practices and procedural controls',
      questions: [
        {
          question: 'What trade documents does your organization prepare and maintain?',
          type: QuestionType.MULTISELECT,
          displayOrder: 1,
          isRequired: true,
          options: [
            'Commercial invoices',
            'Bills of lading/Airway bills',
            'Packing lists',
            'Export/Import licenses',
            'Certificates of origin',
            'Shipper\'s Export Declarations (SEDs)',
            'AES filings',
            'Customs declarations',
            'Insurance certificates',
            'Other (specify)'
          ],
          helpText: 'Select all trade documents you regularly prepare or review',
          aiPromptHint: 'Evaluate trade documentation comprehensiveness. More document types generally indicate more comprehensive trade operations and compliance awareness.',
          scoringRules: {
            scale: 5,
            countBased: true,
            ranges: {
              '1-3': 2,
              '4-6': 3,
              '7-8': 4,
              '9+': 5
            }
          },
          tags: ['trade-documents', 'documentation', 'compliance']
        },
        {
          question: 'How do you ensure accuracy and completeness of trade documentation?',
          type: QuestionType.TEXT,
          displayOrder: 2,
          isRequired: true,
          placeholder: 'Describe review processes, quality controls, and accuracy verification procedures...',
          helpText: 'Include review procedures, approval requirements, and error correction processes',
          aiPromptHint: 'Assess documentation quality control procedures. Look for systematic reviews, approval processes, accuracy verification, and error correction mechanisms.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['review', 'quality control', 'approval', 'verification', 'accuracy'],
              negative: ['informal', 'no review', 'errors', 'incomplete', 'assumptions']
            }
          },
          tags: ['quality-control', 'documentation-accuracy', 'review-processes']
        },
        {
          question: 'What record retention policies do you follow for trade documents?',
          type: QuestionType.TEXT,
          displayOrder: 3,
          isRequired: true,
          placeholder: 'Describe retention periods, storage methods, and retrieval procedures...',
          helpText: 'Include retention timeframes, storage systems, and accessibility for audits or inquiries',
          aiPromptHint: 'Evaluate record retention compliance. Look for appropriate retention periods (typically 5+ years), organized storage, and easy retrieval capabilities.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['5 years', 'organized', 'electronic', 'retrieval', 'backup'],
              negative: ['short retention', 'disorganized', 'manual', 'difficult access']
            }
          },
          tags: ['record-retention', 'document-storage', 'compliance-records']
        },
        {
          question: 'How do you handle amendments, corrections, or post-shipment changes?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe procedures for document amendments, customs corrections, and change management...',
          helpText: 'Include amendment procedures, customs notifications, and documentation of changes',
          aiPromptHint: 'Assess change management procedures for trade documentation. Look for proper amendment processes, customs notifications, and audit trails.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['amendment', 'notification', 'audit trail', 'procedures', 'documentation'],
              negative: ['informal', 'no process', 'undocumented', 'reactive only']
            }
          },
          tags: ['change-management', 'amendments', 'corrections']
        },
        {
          question: 'What quality assurance and compliance monitoring do you perform?',
          type: QuestionType.TEXT,
          displayOrder: 5,
          isRequired: true,
          placeholder: 'Describe quality reviews, compliance monitoring, and performance metrics...',
          helpText: 'Include periodic reviews, error tracking, and compliance performance measurement',
          aiPromptHint: 'Evaluate quality assurance and monitoring procedures. Look for proactive monitoring, metrics tracking, trend analysis, and continuous improvement.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['quality assurance', 'monitoring', 'metrics', 'reviews', 'improvement'],
              negative: ['reactive', 'no monitoring', 'informal', 'no metrics']
            }
          },
          tags: ['quality-assurance', 'compliance-monitoring', 'performance-metrics']
        }
      ]
    },
    {
      title: 'Supply Chain Compliance',
      description: 'Evaluation of supplier due diligence and supply chain risk management',
      displayOrder: 5,
      isRequired: true,
      instructions: 'Consider your supplier relationships and supply chain compliance practices',
      questions: [
        {
          question: 'How do you conduct due diligence on suppliers and business partners?',
          type: QuestionType.TEXT,
          displayOrder: 1,
          isRequired: true,
          placeholder: 'Describe supplier vetting, risk assessment, and ongoing monitoring procedures...',
          helpText: 'Include initial due diligence, risk categorization, and periodic reviews',
          aiPromptHint: 'Evaluate supplier due diligence procedures for comprehensiveness and risk-based approach. Look for proper vetting, risk assessment, documentation, and ongoing monitoring.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['due diligence', 'risk assessment', 'vetting', 'monitoring', 'documentation'],
              negative: ['informal', 'minimal', 'no process', 'reactive only']
            }
          },
          tags: ['supplier-due-diligence', 'risk-assessment', 'vendor-management']
        },
        {
          question: 'What supply chain visibility do you have regarding product origins?',
          type: QuestionType.SELECT,
          displayOrder: 2,
          isRequired: true,
          options: [
            'Complete visibility - detailed supply chain mapping',
            'Good visibility - major suppliers and sub-suppliers known',
            'Moderate visibility - direct suppliers known',
            'Limited visibility - basic supplier information only',
            'Poor visibility - minimal supply chain knowledge'
          ],
          helpText: 'Supply chain visibility helps identify compliance risks and country of origin issues',
          aiPromptHint: 'Assess supply chain visibility for trade compliance risk management. Better visibility enables more effective compliance and risk mitigation.',
          scoringRules: {
            scale: 5,
            mapping: {
              'Complete visibility - detailed supply chain mapping': 5,
              'Good visibility - major suppliers and sub-suppliers known': 4,
              'Moderate visibility - direct suppliers known': 3,
              'Limited visibility - basic supplier information only': 2,
              'Poor visibility - minimal supply chain knowledge': 1
            }
          },
          tags: ['supply-chain-visibility', 'traceability', 'origin-tracking']
        },
        {
          question: 'How do you address forced labor and human trafficking risks in your supply chain?',
          type: QuestionType.TEXT,
          displayOrder: 3,
          isRequired: true,
          placeholder: 'Describe policies, supplier requirements, and monitoring procedures for labor compliance...',
          helpText: 'Include supplier codes of conduct, auditing, and remediation procedures',
          aiPromptHint: 'Evaluate forced labor compliance procedures. This is increasingly important for trade compliance, especially under regulations like UFLPA. Look for policies, monitoring, and enforcement.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['policy', 'code of conduct', 'audits', 'monitoring', 'remediation'],
              negative: ['no policy', 'informal', 'unaware', 'no monitoring']
            }
          },
          tags: ['forced-labor', 'human-trafficking', 'ethical-sourcing', 'uflpa']
        },
        {
          question: 'What procedures do you follow for supplier compliance monitoring?',
          type: QuestionType.TEXT,
          displayOrder: 4,
          isRequired: true,
          placeholder: 'Describe ongoing monitoring, audit procedures, and performance evaluation methods...',
          helpText: 'Include periodic reviews, compliance certifications, and corrective action procedures',
          aiPromptHint: 'Assess ongoing supplier monitoring procedures. Look for regular reviews, compliance tracking, audit rights, and corrective action processes.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['monitoring', 'periodic review', 'audits', 'certifications', 'corrective action'],
              negative: ['one-time', 'informal', 'no monitoring', 'reactive only']
            }
          },
          tags: ['supplier-monitoring', 'compliance-tracking', 'audit-procedures']
        },
        {
          question: 'How do you handle supply chain disruptions or compliance violations?',
          type: QuestionType.TEXT,
          displayOrder: 5,
          isRequired: true,
          placeholder: 'Describe contingency planning, alternative sourcing, and violation response procedures...',
          helpText: 'Include business continuity plans, alternative suppliers, and corrective action processes',
          aiPromptHint: 'Evaluate supply chain risk management and violation response procedures. Look for contingency planning, alternative sourcing options, and systematic violation response.',
          scoringRules: {
            scale: 5,
            keywords: {
              positive: ['contingency', 'alternatives', 'response procedures', 'business continuity', 'corrective action'],
              negative: ['reactive', 'no plan', 'single source', 'informal response']
            }
          },
          tags: ['supply-chain-risk', 'contingency-planning', 'violation-response']
        }
      ]
    }
  ]
};

export const ALL_TEMPLATES = [
  FINANCIAL_CRIME_TEMPLATE,
  TRADE_COMPLIANCE_TEMPLATE
];

export async function seedTemplates() {
  console.log('🌱 Starting template seeding...');

  try {
    // Create templates with their full structure
    for (const templateData of ALL_TEMPLATES) {
      console.log(`Creating template: ${templateData.name}`);

      // Check if template already exists
      const existingTemplate = await prisma.template.findUnique({
        where: { slug: templateData.slug }
      });

      if (existingTemplate) {
        console.log(`Template ${templateData.slug} already exists, skipping...`);
        continue;
      }

      // Create template
      const template = await prisma.template.create({
        data: {
          name: templateData.name,
          slug: templateData.slug,
          category: templateData.category,
          description: templateData.description,
          version: templateData.version,
          isActive: templateData.isActive,
          createdBy: 'system',
        }
      });

      console.log(`✅ Created template: ${template.name} (${template.id})`);

      // Create sections
      for (const sectionData of templateData.sections) {
        const section = await prisma.section.create({
          data: {
            templateId: template.id,
            title: sectionData.title,
            description: sectionData.description,
            order: sectionData.displayOrder,
            weight: 1.0,
          }
        });

        console.log(`  📁 Created section: ${section.title}`);

        // Create questions
        for (const questionData of sectionData.questions) {
          const question = await prisma.question.create({
            data: {
              sectionId: section.id,
              text: questionData.question,
              type: questionData.type,
              order: questionData.displayOrder,
              required: questionData.isRequired,
              options: questionData.options || [],
              helpText: questionData.helpText,
              aiPromptHint: questionData.aiPromptHint,
              scoringRules: questionData.scoringRules,
              weight: 1.0,
            }
          });

          console.log(`    ❓ Created question: ${questionData.question.substring(0, 50)}...`);
        }
      }

      console.log(`✅ Template ${templateData.name} seeded successfully with ${templateData.sections.length} sections`);
    }

    console.log('🎉 Template seeding completed successfully!');

    // Print summary
    const templateCount = await prisma.template.count();
    const sectionCount = await prisma.section.count();
    const questionCount = await prisma.question.count();

    console.log('\n📊 Seeding Summary:');
    console.log(`  Templates: ${templateCount}`);
    console.log(`  Sections: ${sectionCount}`);
    console.log(`  Questions: ${questionCount}`);

  } catch (error) {
    console.error('❌ Template seeding failed:', error);
    throw error;
  }
}

export async function clearTemplates() {
  console.log('🧹 Clearing existing template data...');

  try {
    // Delete in reverse order to handle foreign key constraints
    await prisma.question.deleteMany();
    await prisma.section.deleteMany();
    await prisma.template.deleteMany();

    console.log('✅ Template data cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear template data:', error);
    throw error;
  }
}

// Export individual functions for use in other seed files
export { seedTemplates as default };

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates()
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}