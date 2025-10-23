/**
 * Document Preprocessing Service
 * Preprocesses documents once per assessment to enable fast question analysis
 * Story 1.26: AI Document Processing Optimization
 */

import OpenAI from 'openai';
import { performance } from 'perf_hooks';
import { BaseService, ServiceContext } from './base.service';
import { ApiResponse, DatabaseDocument } from '../types/database';

export interface PreprocessingResult {
  documentId: string;
  filename: string;
  summary: string;
  embedding: number[]; // 1536 dimensions for text-embedding-ada-002
  keyTopics: string[];
  confidence: number;
  processingTimeMs: number;
  error?: string;
}

export interface PreprocessingOptions {
  maxConcurrent?: number;
  model?: string;
  embeddingModel?: string;
  maxTokensPerDocument?: number;
}

export class DocumentPreprocessingService extends BaseService {
  private openai: OpenAI | null = null;
  private useOpenAI: boolean = false;
  private openaiInitialized: boolean = false;

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

    if (apiKey && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
      this.useOpenAI = true;
      this.logger.info('Document Preprocessing Service initialized with OpenAI');
    } else {
      this.logger.warn('Document Preprocessing Service using mock implementation (no OpenAI API key)');
    }
  }

  /**
   * Preprocess multiple documents in parallel
   * Extracts summaries and embeddings for fast question analysis
   */
  async preprocessDocumentsForAssessment(
    documents: DatabaseDocument[],
    options: PreprocessingOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<Map<string, PreprocessingResult>>> {
    try {
      this.ensureOpenAIInitialized();

      const maxConcurrent = options.maxConcurrent ||
        parseInt(process.env.AI_MAX_CONCURRENT_CALLS || '10');

      this.logger.info('Starting document preprocessing', {
        documentCount: documents.length,
        maxConcurrent,
        useOpenAI: this.useOpenAI,
      });

      const results = new Map<string, PreprocessingResult>();
      const overallStart = performance.now();

      // Process documents in parallel with concurrency limit
      const chunks = this.chunkArray(documents, maxConcurrent);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(doc =>
          this.preprocessSingleDocument(doc, options).catch(error => {
            this.logger.warn('Document preprocessing failed', {
              documentId: doc.id,
              filename: doc.filename,
              error: error.message,
            });
            // Return error result instead of failing entire batch
            return {
              documentId: doc.id,
              filename: doc.filename,
              summary: '',
              embedding: [],
              keyTopics: [],
              confidence: 0,
              processingTimeMs: 0,
              error: error.message,
            } as PreprocessingResult;
          })
        );

        const chunkResults = await Promise.all(chunkPromises);
        chunkResults.forEach(result => {
          if (result && !result.error) {
            results.set(result.documentId, result);
          } else if (result) {
            this.logger.error('Failed to preprocess document', {
              documentId: result.documentId,
              error: result.error,
            });
          }
        });

        this.logger.info('Chunk processing completed', {
          processedInChunk: chunkResults.filter(r => r && !r.error).length,
          totalProcessed: results.size,
          remaining: documents.length - results.size,
        });
      }

      const overallEnd = performance.now();
      const totalTimeMs = Math.round(overallEnd - overallStart);

      this.logger.info('Document preprocessing completed', {
        totalDocuments: documents.length,
        successfullyProcessed: results.size,
        failed: documents.length - results.size,
        totalTimeMs,
        avgTimePerDoc: Math.round(totalTimeMs / documents.length),
      });

      return this.createResponse(
        true,
        results,
        `Preprocessed ${results.size}/${documents.length} documents successfully`
      );

    } catch (error) {
      this.logger.error('Document preprocessing failed', {
        error: error.message,
        documentCount: documents.length,
      });
      if (error.statusCode) throw error;
      throw this.createError('Failed to preprocess documents', 500, 'PREPROCESSING_ERROR');
    }
  }

  /**
   * Preprocess a single document
   * Extracts comprehensive summary and generates embedding
   */
  private async preprocessSingleDocument(
    doc: DatabaseDocument,
    options: PreprocessingOptions = {}
  ): Promise<PreprocessingResult> {
    const startTime = performance.now();

    try {
      // Get document content
      const content = this.getDocumentContent(doc);

      if (!content || content.trim().length === 0) {
        throw this.createError('Document has no parsable content', 400, 'NO_CONTENT');
      }

      // Use OpenAI or fallback to mock
      if (this.useOpenAI && this.openai) {
        return await this.preprocessWithOpenAI(doc, content, options);
      } else {
        return await this.preprocessWithMock(doc, content);
      }

    } catch (error) {
      const endTime = performance.now();

      this.logger.error('Single document preprocessing failed', {
        documentId: doc.id,
        error: error.message,
        timeMs: Math.round(endTime - startTime),
      });

      throw error;
    }
  }

  /**
   * Preprocess document using OpenAI
   */
  private async preprocessWithOpenAI(
    doc: DatabaseDocument,
    content: string,
    options: PreprocessingOptions
  ): Promise<PreprocessingResult> {
    const startTime = performance.now();

    const model = options.model || process.env.AI_PREPROCESSING_MODEL || 'gpt-4';
    const embeddingModel = options.embeddingModel || 'text-embedding-ada-002';
    const maxTokens = options.maxTokensPerDocument || 1000;

    // Truncate content to avoid token limits (8000 chars ≈ 2000 tokens)
    const truncatedContent = this.truncateContent(content, 8000);

    // Extract comprehensive summary
    this.logger.debug('Generating document summary', {
      documentId: doc.id,
      model,
      contentLength: truncatedContent.length,
    });

    const summaryResponse = await this.openai!.chat.completions.create({
      model,
      messages: [{
        role: 'system',
        content: 'You are a compliance document analyzer. Extract key compliance information, policies, procedures, controls, and evidence from documents. Provide a comprehensive but concise summary that captures all relevant compliance details.'
      }, {
        role: 'user',
        content: `Analyze this compliance document and extract key information:\n\n${truncatedContent}`
      }],
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    const summary = summaryResponse.choices[0]?.message?.content || '';

    if (!summary) {
      throw this.createError('Failed to generate summary', 500, 'SUMMARY_GENERATION_FAILED');
    }

    // Generate embedding for semantic search
    this.logger.debug('Generating document embedding', {
      documentId: doc.id,
      embeddingModel,
      summaryLength: summary.length,
    });

    const embeddingResponse = await this.openai!.embeddings.create({
      model: embeddingModel,
      input: summary.substring(0, 8000), // Embedding API has 8191 token limit
    });

    const embedding = embeddingResponse.data[0]?.embedding || [];

    if (embedding.length === 0) {
      throw this.createError('Failed to generate embedding', 500, 'EMBEDDING_GENERATION_FAILED');
    }

    // Extract key topics from summary
    const keyTopics = this.extractKeyTopics(summary);

    const endTime = performance.now();

    return {
      documentId: doc.id,
      filename: doc.filename,
      summary,
      embedding,
      keyTopics,
      confidence: 0.9,
      processingTimeMs: Math.round(endTime - startTime),
    };
  }

  /**
   * Preprocess document with mock implementation (no OpenAI)
   */
  private async preprocessWithMock(
    doc: DatabaseDocument,
    content: string
  ): Promise<PreprocessingResult> {
    const startTime = performance.now();

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));

    // Extract simple summary (first 500 chars)
    const summary = content.substring(0, 500) + '...';

    // Generate mock embedding (1536 dimensions of random values)
    const embedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);

    // Extract simple keywords as topics
    const keyTopics = this.extractKeyTopics(content);

    const endTime = performance.now();

    return {
      documentId: doc.id,
      filename: doc.filename,
      summary,
      embedding,
      keyTopics,
      confidence: 0.5, // Lower confidence for mock
      processingTimeMs: Math.round(endTime - startTime),
    };
  }

  /**
   * Get document content from various sources
   */
  private getDocumentContent(doc: DatabaseDocument): string {
    // Try parsedContent first
    if (doc.parsedContent) {
      const parsed = doc.parsedContent as any;
      if (typeof parsed === 'string') {
        return parsed;
      }
      if (parsed.text) {
        return parsed.text;
      }
      if (parsed.content) {
        return parsed.content;
      }
    }

    // Try extractedData
    if (doc.extractedData) {
      const extracted = doc.extractedData as any;
      if (typeof extracted === 'string') {
        return extracted;
      }
      if (extracted.text) {
        return extracted.text;
      }
    }

    this.logger.warn('No parsable content found in document', {
      documentId: doc.id,
      hasParsedContent: !!doc.parsedContent,
      hasExtractedData: !!doc.extractedData,
    });

    return '';
  }

  /**
   * Truncate content to maximum length
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '\n\n[Content truncated...]';
  }

  /**
   * Extract key topics/keywords from text
   */
  private extractKeyTopics(text: string): string[] {
    // Convert to lowercase and split into words
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Count word frequency
    const frequency = new Map<string, number>();
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    // Filter out common stop words
    const stopWords = new Set([
      'that', 'this', 'with', 'from', 'have', 'been', 'were', 'their',
      'there', 'would', 'could', 'should', 'will', 'shall', 'must',
      'also', 'other', 'which', 'where', 'when', 'what', 'about'
    ]);

    // Get top 10 most frequent non-stop words
    return Array.from(frequency.entries())
      .filter(([word]) => !stopWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Split array into chunks for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export singleton instance
export const documentPreprocessingService = new DocumentPreprocessingService();
