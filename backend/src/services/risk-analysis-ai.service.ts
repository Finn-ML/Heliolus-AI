/**
 * Risk Analysis AI Service
 * Generates AI-powered key findings and mitigation strategies from assessment gaps
 * Uses OpenAI to synthesize insights from compliance gaps and organizational context
 */

import { BaseService, ServiceContext } from './base.service';
import OpenAI from 'openai';

// Type definitions for API responses
export interface KeyFinding {
  finding: string;          // Brief description of the synthesized finding
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;      // Detailed explanation including impact and regulatory implications
}

export interface MitigationStrategy {
  strategy: string;         // Specific, actionable strategy description
  priority: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  impact: 'high' | 'medium' | 'low';
  rationale?: string;       // Why this strategy is important
  estimatedTimeframe?: string;
  keyActions?: string[];
  businessOwner?: string;   // AI-generated responsible business owner/role
  estimatedBudget?: string; // AI-generated budget estimate (e.g., "$25k-$50k")
  riskReductionPercent?: number; // AI-generated expected risk reduction percentage
  remediationDays?: number; // AI-generated estimated days to implement
}

// Type for Gap from database
interface Gap {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation?: string;
}

// Type for Risk from database
interface Risk {
  id: string;
  category: string;
  title: string;
  description: string;
  likelihood: string;
  impact: string;
  riskLevel: string;
  mitigation?: string;
}

// Organization context for mitigation strategies
interface OrganizationContext {
  size?: string;
  industry?: string;
  geography?: string;
  riskProfile?: string;
  annualRevenue?: string;
  complianceTeamSize?: string;
}

export class RiskAnalysisAIService extends BaseService {
  private openai: OpenAI | null = null;
  private useOpenAI: boolean = false;
  private openaiInitialized: boolean = false;
  private activeRequests: number = 0;
  private readonly MAX_CONCURRENT_REQUESTS = 5;
  private requestQueue: Array<() => Promise<void>> = [];

  constructor() {
    super();
  }

  /**
   * Ensure OpenAI client is initialized (lazy initialization)
   */
  private ensureOpenAIInitialized(): void {
    if (this.openaiInitialized) return;

    this.openaiInitialized = true;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.includes('your-api-key')) {
      this.logger.warn('OpenAI API key not configured, using fallback responses');
      this.useOpenAI = false;
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      this.useOpenAI = true;
      this.logger.info('OpenAI client initialized for risk analysis');
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI client', { error });
      this.useOpenAI = false;
    }
  }

  /**
   * Generate key findings from gaps in a specific category
   */
  async generateKeyFindings(
    category: string,
    gaps: Gap[],
    context?: ServiceContext
  ): Promise<KeyFinding[]> {
    this.ensureOpenAIInitialized();

    const startTime = Date.now();
    this.logger.info('Generating key findings', { category, gapCount: gaps.length });

    try {
      if (!this.useOpenAI || gaps.length === 0) {
        return this.generateFallbackKeyFindings(gaps);
      }

      // Rate limiting
      await this.waitForCapacity();

      const prompt = this.buildKeyFindingsPrompt(category, gaps);
      const response = await this.callOpenAI(prompt, 0.3);

      if (!response) {
        return this.generateFallbackKeyFindings(gaps);
      }

      const parsed = this.parseKeyFindingsResponse(response);

      if (!parsed) {
        return this.generateFallbackKeyFindings(gaps);
      }

      this.logger.info('Key findings generated successfully', {
        category,
        findingsCount: parsed.length,
        duration: Date.now() - startTime
      });

      return parsed;
    } catch (error) {
      this.logger.error('Error generating key findings', {
        error,
        category,
        duration: Date.now() - startTime
      });
      return this.generateFallbackKeyFindings(gaps);
    }
  }

  /**
   * Generate mitigation strategies for gaps in a category
   */
  async generateMitigationStrategies(
    category: string,
    gaps: Gap[],
    risks: Risk[],
    organization: OrganizationContext,
    context?: ServiceContext
  ): Promise<MitigationStrategy[]> {
    this.ensureOpenAIInitialized();

    const startTime = Date.now();
    this.logger.info('Generating mitigation strategies', {
      category,
      gapCount: gaps.length,
      riskCount: risks.length
    });

    try {
      if (!this.useOpenAI || gaps.length === 0) {
        return this.generateFallbackMitigationStrategies(gaps);
      }

      // Rate limiting
      await this.waitForCapacity();

      const prompt = this.buildMitigationPrompt(category, gaps, risks, organization);
      const response = await this.callOpenAI(prompt, 0.4);

      if (!response) {
        return this.generateFallbackMitigationStrategies(gaps);
      }

      const parsed = this.parseMitigationResponse(response);

      if (!parsed) {
        return this.generateFallbackMitigationStrategies(gaps);
      }

      this.logger.info('Mitigation strategies generated successfully', {
        category,
        strategiesCount: parsed.length,
        duration: Date.now() - startTime
      });

      return parsed;
    } catch (error) {
      this.logger.error('Error generating mitigation strategies', {
        error,
        category,
        duration: Date.now() - startTime
      });
      return this.generateFallbackMitigationStrategies(gaps);
    }
  }

  /**
   * Build prompt for key findings generation
   */
  private buildKeyFindingsPrompt(category: string, gaps: Gap[]): string {
    const gapsDescription = gaps
      .slice(0, 20) // Limit to prevent token overflow
      .map(g => `- [${g.severity}] ${g.title}: ${g.description}`)
      .join('\n');

    return `
Analyze the following compliance gaps in the "${category}" category and synthesize 3-5 key findings.

Gaps:
${gapsDescription}

Return JSON with this exact structure:
{
  "keyFindings": [
    {
      "finding": "Brief description of the synthesized finding",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "description": "Detailed explanation including impact and regulatory implications"
    }
  ]
}

Focus on:
1. Clustering related gaps into broader findings
2. Highlighting systemic issues rather than individual gaps
3. Prioritizing findings by regulatory risk and business impact
4. Ensuring each finding represents multiple gaps where possible
5. Using clear, actionable language

Generate between 3 and 5 findings that capture the most critical issues.`;
  }

  /**
   * Build prompt for mitigation strategies generation
   */
  private buildMitigationPrompt(
    category: string,
    gaps: Gap[],
    risks: Risk[],
    organization: OrganizationContext
  ): string {
    const gapsSummary = gaps
      .slice(0, 10)
      .map(g => `- [${g.severity}] ${g.title}`)
      .join('\n');

    const orgContext = `
Organization Context:
- Size: ${organization.size || 'Not specified'}
- Industry: ${organization.industry || 'Not specified'}
- Geography: ${organization.geography || 'Not specified'}
- Risk Profile: ${organization.riskProfile || 'Not specified'}
- Annual Revenue: ${organization.annualRevenue || 'Not specified'}
- Compliance Team Size: ${organization.complianceTeamSize || 'Not specified'}`;

    return `
Generate 4 prioritized mitigation strategies for "${category}" compliance gaps.

${orgContext}

Gaps to Address (${gaps.length} total):
${gapsSummary}

Critical risks identified: ${risks.filter(r => r.riskLevel === 'CRITICAL').length}
High risks identified: ${risks.filter(r => r.riskLevel === 'HIGH').length}

Return JSON with exactly 4 strategies covering all priority levels:
{
  "strategies": [
    {
      "strategy": "Specific, actionable strategy description",
      "priority": "immediate|short-term|medium-term|long-term",
      "impact": "high|medium|low",
      "rationale": "Why this strategy is important",
      "estimatedTimeframe": "Realistic timeframe (e.g., '1-2 weeks', '3-6 months')",
      "keyActions": ["Action 1", "Action 2", "Action 3"],
      "businessOwner": "Recommended business owner role (e.g., 'Chief Compliance Officer', 'Head of Risk')",
      "estimatedBudget": "Budget estimate range in dollars (e.g., '$25k-$50k', '$100k-$150k')",
      "riskReductionPercent": 15,
      "remediationDays": 30
    }
  ]
}

Requirements:
1. Include ONE strategy for each priority level (immediate, short-term, medium-term, long-term)
2. Consider the organization's size and resources when estimating budget and timeline
3. Focus on practical, implementable solutions
4. Address the highest severity gaps first
5. Include specific actions and realistic timeframes
6. Assign appropriate business owner based on the compliance area (not generic titles)
7. Estimate budget based on gap count, severity, and organization size
8. Provide realistic risk reduction percentage (typically 10-30% per strategy)
9. Estimate remediation days considering priority and complexity`;
  }

  /**
   * Call OpenAI API with rate limiting
   */
  private async callOpenAI(prompt: string, temperature: number): Promise<string | null> {
    if (!this.openai) return null;

    this.activeRequests++;
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a compliance and risk management expert. Provide structured JSON responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature,
        max_tokens: 1000
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      this.logger.error('OpenAI API call failed', { error });
      return null;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  /**
   * Rate limiting: wait for available capacity
   */
  private async waitForCapacity(): Promise<void> {
    if (this.activeRequests < this.MAX_CONCURRENT_REQUESTS) {
      return;
    }

    return new Promise((resolve) => {
      this.requestQueue.push(async () => {
        resolve();
      });
    });
  }

  /**
   * Process queued requests when capacity is available
   */
  private processQueue(): void {
    while (this.requestQueue.length > 0 && this.activeRequests < this.MAX_CONCURRENT_REQUESTS) {
      const next = this.requestQueue.shift();
      if (next) {
        next();
      }
    }
  }

  /**
   * Parse key findings response from OpenAI
   */
  private parseKeyFindingsResponse(response: string): KeyFinding[] | null {
    try {
      const parsed = JSON.parse(response);

      if (!parsed.keyFindings || !Array.isArray(parsed.keyFindings)) {
        throw new Error('Invalid response structure');
      }

      return parsed.keyFindings.filter((finding: any) =>
        finding.finding &&
        finding.severity &&
        finding.description
      );
    } catch (error) {
      this.logger.error('Failed to parse key findings response', { error, response });
      return null;
    }
  }

  /**
   * Parse mitigation strategies response from OpenAI
   */
  private parseMitigationResponse(response: string): MitigationStrategy[] | null {
    try {
      const parsed = JSON.parse(response);

      if (!parsed.strategies || !Array.isArray(parsed.strategies)) {
        throw new Error('Invalid response structure');
      }

      return parsed.strategies.filter((strategy: any) =>
        strategy.strategy &&
        strategy.priority &&
        strategy.impact
      );
    } catch (error) {
      this.logger.error('Failed to parse mitigation response', { error, response });
      return null;
    }
  }

  /**
   * Generate fallback key findings when OpenAI is unavailable
   */
  private generateFallbackKeyFindings(gaps: Gap[]): KeyFinding[] {
    this.logger.info('Using fallback key findings generation');

    // Group gaps by severity
    const critical = gaps.filter(g => g.severity === 'CRITICAL');
    const high = gaps.filter(g => g.severity === 'HIGH');
    const medium = gaps.filter(g => g.severity === 'MEDIUM');
    const low = gaps.filter(g => g.severity === 'LOW');

    const findings: KeyFinding[] = [];

    if (critical.length > 0) {
      findings.push({
        finding: `Critical compliance gaps identified (${critical.length} issues)`,
        severity: 'CRITICAL',
        description: `Multiple critical gaps requiring immediate attention: ${critical.slice(0, 3).map(g => g.title).join(', ')}. These issues pose significant regulatory risk and require urgent remediation.`
      });
    }

    if (high.length > 0) {
      findings.push({
        finding: `High-priority gaps affecting compliance posture (${high.length} issues)`,
        severity: 'HIGH',
        description: `Several high-priority gaps identified: ${high.slice(0, 3).map(g => g.title).join(', ')}. These require prompt action to reduce compliance risk.`
      });
    }

    if (medium.length > 0) {
      findings.push({
        finding: `Moderate compliance improvements needed (${medium.length} issues)`,
        severity: 'MEDIUM',
        description: `Areas for improvement identified: ${medium.slice(0, 3).map(g => g.title).join(', ')}. Address these to strengthen overall compliance framework.`
      });
    }

    if (low.length > 0 && findings.length < 3) {
      findings.push({
        finding: `Minor compliance enhancements recommended (${low.length} issues)`,
        severity: 'LOW',
        description: `Low-priority items for consideration: ${low.slice(0, 3).map(g => g.title).join(', ')}. These can be addressed as resources permit.`
      });
    }

    return findings;
  }

  /**
   * Generate fallback mitigation strategies when OpenAI is unavailable
   */
  private generateFallbackMitigationStrategies(gaps: Gap[]): MitigationStrategy[] {
    this.logger.info('Using fallback mitigation strategies generation');

    const critical = gaps.filter(g => g.severity === 'CRITICAL');
    const high = gaps.filter(g => g.severity === 'HIGH');

    return [
      {
        strategy: critical.length > 0
          ? `Address ${critical.length} critical gaps immediately to prevent regulatory violations`
          : 'Conduct comprehensive compliance assessment',
        priority: 'immediate',
        impact: 'high',
        rationale: 'Critical gaps pose immediate regulatory risk',
        estimatedTimeframe: '1-2 weeks',
        keyActions: [
          'Identify quick wins',
          'Allocate emergency resources',
          'Implement temporary controls'
        ],
        businessOwner: 'Chief Compliance Officer',
        estimatedBudget: critical.length > 3 ? '$50k-$100k' : '$25k-$50k',
        riskReductionPercent: 25,
        remediationDays: 14
      },
      {
        strategy: high.length > 0
          ? `Remediate ${high.length} high-priority gaps to reduce compliance risk`
          : 'Strengthen key compliance controls',
        priority: 'short-term',
        impact: 'high',
        rationale: 'High-priority gaps need prompt attention',
        estimatedTimeframe: '1-3 months',
        keyActions: [
          'Develop remediation plans',
          'Assign responsible parties',
          'Set clear deadlines'
        ],
        businessOwner: 'Head of Compliance',
        estimatedBudget: high.length > 5 ? '$75k-$125k' : '$40k-$75k',
        riskReductionPercent: 20,
        remediationDays: 60
      },
      {
        strategy: 'Implement systematic compliance improvements',
        priority: 'medium-term',
        impact: 'medium',
        rationale: 'Build sustainable compliance processes',
        estimatedTimeframe: '3-6 months',
        keyActions: [
          'Design process improvements',
          'Deploy technology solutions',
          'Train compliance team'
        ],
        businessOwner: 'Compliance Director',
        estimatedBudget: '$100k-$200k',
        riskReductionPercent: 15,
        remediationDays: 120
      },
      {
        strategy: 'Establish continuous compliance monitoring program',
        priority: 'long-term',
        impact: 'medium',
        rationale: 'Prevent future compliance gaps',
        estimatedTimeframe: '6-12 months',
        keyActions: [
          'Implement monitoring tools',
          'Create compliance dashboards',
          'Establish regular audits'
        ],
        businessOwner: 'Chief Risk Officer',
        estimatedBudget: '$150k-$300k',
        riskReductionPercent: 10,
        remediationDays: 270
      }
    ];
  }
}