/**
 * Evidence Classification Service
 * Classifies documents into evidence tiers (TIER_0, TIER_1, TIER_2) using AI analysis
 * Implements caching and circuit breaker patterns for reliability
 */

import { BaseService } from './base.service';
import { EvidenceTier } from '../generated/prisma';
import OpenAI from 'openai';
import { objectStorageClient } from '../objectStorage';

export interface ClassificationResult {
  tier: EvidenceTier;
  confidence: number; // 0-1
  reason: string;
  indicators: {
    hasTimestamps?: boolean;
    hasVersionControl?: boolean;
    hasApprovalSignatures?: boolean;
    isStructuredData?: boolean;
  };
}

export interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export class EvidenceClassificationService extends BaseService {
  private openai: OpenAI | null = null;
  private useOpenAI: boolean = false;
  private circuitBreaker: CircuitBreakerState;
  private readonly CIRCUIT_FAILURE_THRESHOLD = 5;
  private readonly CIRCUIT_RESET_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CONTENT_LENGTH = 5000; // First 5000 chars

  // In-memory cache (simplified - would use Redis in production)
  private cache: Map<string, { result: ClassificationResult; timestamp: number }>;
  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    super();

    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.useOpenAI = true;
      this.logger.info('Evidence Classification Service initialized with OpenAI');
    } else {
      this.logger.warn('Evidence Classification Service using fallback (no OpenAI API key)');
    }

    // Initialize circuit breaker
    this.circuitBreaker = {
      failureCount: 0,
      lastFailureTime: null,
      state: 'CLOSED',
    };

    // Initialize in-memory cache
    this.cache = new Map();
  }

  /**
   * Classify a document into an evidence tier
   */
  async classifyDocument(documentId: string): Promise<ClassificationResult> {
    try {
      // Check cache first
      const cached = this.getCachedResult(documentId);
      if (cached) {
        this.logger.info('Using cached classification result', { documentId });
        return cached;
      }

      // Fetch document from database
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Check circuit breaker state
      if (this.isCircuitOpen()) {
        this.logger.warn('Circuit breaker OPEN - returning default tier', { documentId });
        return this.createFallbackResult('Circuit breaker open - service temporarily unavailable');
      }

      // Fetch document content from object storage
      const content = await this.fetchDocumentContent(document.s3Bucket, document.s3Key);

      // Classify using OpenAI (or fallback to heuristics)
      let result: ClassificationResult;
      if (this.useOpenAI && this.openai) {
        try {
          result = await this.classifyWithAI(content, document.filename);
        } catch (aiError) {
          // AI failed, fall back to heuristics
          this.logger.warn('AI classification failed, using heuristics fallback', {
            documentId,
            error: aiError instanceof Error ? aiError.message : String(aiError),
          });
          result = this.classifyWithHeuristics(content, document.filename);
        }
      } else {
        result = this.classifyWithHeuristics(content, document.filename);
      }

      // Save classification to database
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          evidenceTier: result.tier,
          tierConfidenceScore: result.confidence,
          tierClassificationReason: result.reason,
          classifiedAt: new Date(),
        },
      });

      // Cache the result
      this.cacheResult(documentId, result);

      // Reset circuit breaker on success
      this.recordSuccess();

      this.logger.info('Document classified successfully', {
        documentId,
        tier: result.tier,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      this.logger.error('Document classification failed', {
        documentId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Record failure for circuit breaker
      this.recordFailure();

      // Return fallback result
      return this.createFallbackResult(
        `Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Classify document content using OpenAI GPT-4
   */
  private async classifyWithAI(content: string, filename: string): Promise<ClassificationResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const truncatedContent = content.substring(0, this.MAX_CONTENT_LENGTH);

    const prompt = this.buildClassificationPrompt(truncatedContent, filename);

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert compliance auditor analyzing documentation quality. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse AI response
      const parsed = JSON.parse(response);

      return {
        tier: this.mapTierString(parsed.tier),
        confidence: parsed.confidence || 0.5,
        reason: parsed.reason || 'AI classification',
        indicators: parsed.indicators || {},
      };
    } catch (error) {
      this.logger.error('OpenAI classification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Classify document using simple heuristics (fallback when AI unavailable)
   */
  private classifyWithHeuristics(content: string, filename: string): ClassificationResult {
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // TIER_2 indicators: System-generated data
    const tier2Patterns = [
      /generated on:/i,
      /timestamp:/i,
      /system id:/i,
      /^".*",".*",".*"$/m, // CSV format
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO timestamps
    ];

    const isTier2 = tier2Patterns.some(pattern => pattern.test(content)) ||
                   lowerFilename.match(/\.(csv|json|xml|log)$/);

    if (isTier2) {
      return {
        tier: EvidenceTier.TIER_2,
        confidence: 0.7,
        reason: 'System-generated format detected (CSV, JSON, logs, or timestamped data)',
        indicators: {
          hasTimestamps: /\d{4}-\d{2}-\d{2}/.test(content),
          isStructuredData: /^".*",".*"/.test(content) || lowerFilename.includes('.csv'),
        },
      };
    }

    // TIER_1 indicators: Policy documents
    const tier1Patterns = [
      /policy\s+document/i,
      /version\s+\d+/i,
      /approved\s+by/i,
      /effective\s+date/i,
      /procedure/i,
    ];

    const isTier1 = tier1Patterns.some(pattern => pattern.test(content)) ||
                   lowerFilename.match(/policy|procedure|guideline/);

    if (isTier1) {
      return {
        tier: EvidenceTier.TIER_1,
        confidence: 0.6,
        reason: 'Policy document format detected (formal policies, procedures, or versioned documents)',
        indicators: {
          hasVersionControl: /version\s+\d+/i.test(content),
          hasApprovalSignatures: /approved\s+by/i.test(content),
        },
      };
    }

    // Default: TIER_0 (self-declared)
    return {
      tier: EvidenceTier.TIER_0,
      confidence: 0.5,
      reason: 'No formal structure or system-generated indicators found - classified as self-declared',
      indicators: {},
    };
  }

  /**
   * Fetch document content from Replit object storage
   */
  private async fetchDocumentContent(bucket: string, key: string): Promise<string> {
    try {
      const file = objectStorageClient.bucket(bucket).file(key);
      const [content] = await file.download();
      return content.toString('utf-8');
    } catch (error) {
      this.logger.error('Failed to fetch document from object storage', {
        bucket,
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to fetch document content');
    }
  }

  /**
   * Build OpenAI classification prompt
   */
  private buildClassificationPrompt(content: string, filename: string): string {
    return `
You are an expert compliance auditor analyzing documentation quality.

Classify this document into one of three evidence tiers:

TIER_2 (System-Generated):
- Database exports, API logs, system reports
- Automated outputs with timestamps, version numbers
- Machine-generated data with structured format

TIER_1 (Policy Documents):
- Formal policies, procedures, workflows
- Documents with approval signatures, version control
- Official company documentation

TIER_0 (Self-Declared):
- Emails, informal notes, draft documents
- Statements without formal approval process
- Unstructured informal communication

Analyze the following document and respond with JSON:
{
  "tier": "TIER_0" | "TIER_1" | "TIER_2",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of classification rationale",
  "indicators": {
    "hasTimestamps": boolean,
    "hasVersionControl": boolean,
    "hasApprovalSignatures": boolean,
    "isStructuredData": boolean
  }
}

Filename: ${filename}

Document content:
${content}
`.trim();
  }

  /**
   * Map tier string to enum
   */
  private mapTierString(tier: string): EvidenceTier {
    switch (tier) {
      case 'TIER_2':
        return EvidenceTier.TIER_2;
      case 'TIER_1':
        return EvidenceTier.TIER_1;
      case 'TIER_0':
      default:
        return EvidenceTier.TIER_0;
    }
  }

  /**
   * Create fallback result for errors
   */
  private createFallbackResult(reason: string): ClassificationResult {
    return {
      tier: EvidenceTier.TIER_0,
      confidence: 0.0,
      reason: `Classification failed - defaulting to self-declared tier. ${reason}`,
      indicators: {},
    };
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'CLOSED') {
      return false;
    }

    if (this.circuitBreaker.state === 'OPEN') {
      const now = Date.now();
      const timeSinceFailure = now - (this.circuitBreaker.lastFailureTime || 0);

      if (timeSinceFailure >= this.CIRCUIT_RESET_TIMEOUT) {
        // Transition to HALF_OPEN to try again
        this.circuitBreaker.state = 'HALF_OPEN';
        this.logger.info('Circuit breaker transitioning to HALF_OPEN');
        return false;
      }

      return true;
    }

    // HALF_OPEN state - allow one request through
    return false;
  }

  /**
   * Record successful classification
   */
  private recordSuccess(): void {
    if (this.circuitBreaker.state !== 'CLOSED') {
      this.logger.info('Circuit breaker closing after successful request');
    }
    this.circuitBreaker = {
      failureCount: 0,
      lastFailureTime: null,
      state: 'CLOSED',
    };
  }

  /**
   * Record failed classification
   */
  private recordFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failureCount >= this.CIRCUIT_FAILURE_THRESHOLD) {
      this.circuitBreaker.state = 'OPEN';
      this.logger.warn('Circuit breaker OPENED after consecutive failures', {
        failureCount: this.circuitBreaker.failureCount,
      });
    }
  }

  /**
   * Get cached classification result
   */
  private getCachedResult(documentId: string): ClassificationResult | null {
    const cached = this.cache.get(documentId);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      // Cache expired
      this.cache.delete(documentId);
      return null;
    }

    return cached.result;
  }

  /**
   * Cache classification result
   */
  private cacheResult(documentId: string, result: ClassificationResult): void {
    this.cache.set(documentId, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache for a document
   */
  public invalidateCache(documentId: string): void {
    this.cache.delete(documentId);
    this.logger.info('Cache invalidated for document', { documentId });
  }
}
