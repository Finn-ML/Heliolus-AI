/**
 * AI Library for Heliolus Platform
 * Comprehensive AI module with document parsing, analysis, and processing
 */

// Export website extraction (Story 2.1 Phase 1 - MVP)
export * from './website-extractor.js';
export * from './extraction-cache.js';

// NOTE: parseDocumentContent has been moved to DocumentParserService
// to avoid pdf-parse test file loading issues. Use DocumentParserService directly.

// Export mock functions that are still needed (until fully implemented)
export {
  analyzeDocument,
  extractDocumentData,
  generateReport,
  createExecutiveSummary,
  analyzeComplianceMatrix,
  analyzeWebsite,
  extractCompanyData,
} from './mock';

// Mock types
export type DocumentParser = any;
export type ParsedDocument = any;
export type AnalysisResult = any;

// Default configuration
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
  },
  parsing: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50000000'), // 50MB
    supportedFormats: ['pdf', 'docx', 'txt', 'md', 'html', 'rtf', 'odt'],
    extractImages: process.env.EXTRACT_IMAGES === 'true',
    preserveFormatting: process.env.PRESERVE_FORMATTING !== 'false',
    chunkSize: parseInt(process.env.CHUNK_SIZE || '1000'),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200')
  },
  embeddings: {
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536'),
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '100'),
    similarity_threshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.8')
  },
  analysis: {
    defaultPrompts: {
      summarize: 'Provide a comprehensive summary of the following document, highlighting key points and main themes.',
      extract_entities: 'Extract all named entities (people, organizations, locations, dates) from the following text.',
      classify: 'Classify the following document into appropriate categories based on its content and purpose.',
      sentiment: 'Analyze the sentiment and tone of the following document.',
      risk_assessment: 'Identify potential risks, compliance issues, and concerns mentioned in the following document.'
    },
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
    timeout: parseInt(process.env.AI_TIMEOUT || '30000')
  }
} as const;