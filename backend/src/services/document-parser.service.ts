/**
 * Document Parser Service
 * Handles extraction and parsing of content from various document types
 * Supports PDF, DOCX, XLSX, TXT, CSV, and HTML formats
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import { 
  ApiResponse, 
  DatabaseDocument,
  DocumentType,
  UserRole
} from '../types/database';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import { ObjectStorageService } from '../objectStorage';

// Document parsing schemas
const ParseDocumentSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
  forceReparse: z.boolean().default(false),
});

const ParseBatchSchema = z.object({
  documentIds: z.array(z.string().cuid()),
  forceReparse: z.boolean().default(false),
});

// Parsed content structure
export interface ParsedContent {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    language?: string;
    author?: string;
    createdDate?: string;
    modifiedDate?: string;
  };
  structure: {
    sections: Array<{
      title: string;
      content: string;
      level: number;
    }>;
    tables?: Array<{
      headers: string[];
      rows: string[][];
    }>;
    lists?: Array<{
      type: 'ordered' | 'unordered';
      items: string[];
    }>;
  };
  entities?: Array<{
    type: 'person' | 'organization' | 'location' | 'date' | 'policy' | 'regulation';
    value: string;
    context?: string;
  }>;
}

export interface ParseResult {
  success: boolean;
  documentId: string;
  parsedContent?: ParsedContent;
  error?: string;
}

export class DocumentParserService extends BaseService {
  private objectStorageService: ObjectStorageService;

  constructor() {
    super();
    this.objectStorageService = new ObjectStorageService();
  }

  /**
   * Parse a single document and extract its content
   */
  async parseDocument(
    documentId: string,
    forceReparse: boolean = false,
    context?: ServiceContext
  ): Promise<ApiResponse<ParseResult>> {
    try {
      const validatedData = await this.validateInput(ParseDocumentSchema, {
        documentId,
        forceReparse,
      });

      // Fetch document from database
      const document = await this.prisma.document.findUnique({
        where: { id: validatedData.documentId },
        include: {
          organization: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      if (!document) {
        throw this.createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(
        context,
        [UserRole.USER, UserRole.ADMIN],
        document.organization.userId
      );

      // Check if already parsed and not forcing reparse
      if (document.parsedContent && !validatedData.forceReparse) {
        this.logger.info('Document already parsed, returning cached content', {
          documentId: document.id,
        });

        return this.createResponse(
          true,
          {
            success: true,
            documentId: document.id,
            parsedContent: document.parsedContent as unknown as ParsedContent,
          },
          'Document content already parsed'
        );
      }

      // Download document from object storage
      const fileBuffer = await this.downloadDocumentFromStorage(document);

      // Parse based on MIME type
      let parsedContent: ParsedContent;
      
      switch (document.mimeType) {
        case 'application/pdf':
          parsedContent = await this.parsePDF(fileBuffer);
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          parsedContent = await this.parseDOCX(fileBuffer);
          break;
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          parsedContent = await this.parseXLSX(fileBuffer);
          break;
        case 'text/html':
          parsedContent = await this.parseHTML(fileBuffer.toString('utf-8'));
          break;
        case 'text/plain':
        case 'text/csv':
        case 'application/csv':
          parsedContent = await this.parsePlainText(fileBuffer.toString('utf-8'));
          break;
        default:
          throw this.createError(
            `Unsupported file type: ${document.mimeType}`,
            400,
            'UNSUPPORTED_FILE_TYPE'
          );
      }

      // Extract entities from parsed content
      parsedContent.entities = this.extractEntities(parsedContent.text);

      // Update document with parsed content
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          parsedContent: parsedContent as any,
          extractedData: {
            documentType: this.inferDocumentType(parsedContent),
            keyPhrases: this.extractKeyPhrases(parsedContent.text),
            summary: this.generateSummary(parsedContent.text),
          },
        },
      });

      await this.logAudit(
        {
          action: 'DOCUMENT_PARSED',
          entity: 'Document',
          entityId: document.id,
          newValues: {
            mimeType: document.mimeType,
            wordCount: parsedContent.metadata.wordCount,
          },
        },
        context
      );

      this.logger.info('Document parsed successfully', {
        documentId: document.id,
        wordCount: parsedContent.metadata.wordCount,
      });

      return this.createResponse(
        true,
        {
          success: true,
          documentId: document.id,
          parsedContent,
        },
        'Document parsed successfully'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'parseDocument');
    }
  }

  /**
   * Parse multiple documents in batch
   */
  async parseBatch(
    documentIds: string[],
    forceReparse: boolean = false,
    context?: ServiceContext
  ): Promise<ApiResponse<ParseResult[]>> {
    try {
      const validatedData = await this.validateInput(ParseBatchSchema, {
        documentIds,
        forceReparse,
      });

      const results: ParseResult[] = [];

      for (const documentId of validatedData.documentIds) {
        try {
          const result = await this.parseDocument(documentId, forceReparse, context);
          results.push(result.data);
        } catch (error) {
          this.logger.error('Failed to parse document in batch', {
            documentId,
            error: error.message,
          });
          results.push({
            success: false,
            documentId,
            error: error.message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      this.logger.info('Batch parsing completed', {
        total: results.length,
        success: successCount,
        failures: failureCount,
      });

      return this.createResponse(
        true,
        results,
        `Parsed ${successCount} documents successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'parseBatch');
    }
  }

  /**
   * Parse PDF documents
   */
  private async parsePDF(buffer: Buffer): Promise<ParsedContent> {
    try {
      // Dynamic import to avoid initialization issues
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);

      const sections = this.extractSectionsFromText(data.text);
      
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          wordCount: data.text.split(/\s+/).length,
          author: data.info?.Author,
          createdDate: data.info?.CreationDate,
          modifiedDate: data.info?.ModDate,
        },
        structure: {
          sections,
        },
      };
    } catch (error) {
      this.logger.error('Failed to parse PDF', { error: error.message });
      throw this.createError('Failed to parse PDF document', 500, 'PDF_PARSE_ERROR');
    }
  }

  /**
   * Parse DOCX documents
   */
  private async parseDOCX(buffer: Buffer): Promise<ParsedContent> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      const sections = this.extractSectionsFromText(text);

      return {
        text,
        metadata: {
          wordCount: text.split(/\s+/).length,
        },
        structure: {
          sections,
        },
      };
    } catch (error) {
      this.logger.error('Failed to parse DOCX', { error: error.message });
      throw this.createError('Failed to parse DOCX document', 500, 'DOCX_PARSE_ERROR');
    }
  }

  /**
   * Parse XLSX documents
   */
  private async parseXLSX(buffer: Buffer): Promise<ParsedContent> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      const tables: any[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (sheetData.length > 0) {
          const headers = sheetData[0] as string[];
          const rows = sheetData.slice(1) as string[][];
          
          tables.push({
            headers,
            rows,
          });

          // Add to text content
          text += `Sheet: ${sheetName}\n`;
          text += headers.join(', ') + '\n';
          rows.forEach(row => {
            text += row.join(', ') + '\n';
          });
          text += '\n';
        }
      }

      return {
        text,
        metadata: {
          wordCount: text.split(/\s+/).length,
        },
        structure: {
          sections: [],
          tables,
        },
      };
    } catch (error) {
      this.logger.error('Failed to parse XLSX', { error: error.message });
      throw this.createError('Failed to parse XLSX document', 500, 'XLSX_PARSE_ERROR');
    }
  }

  /**
   * Parse HTML documents
   */
  private async parseHTML(html: string): Promise<ParsedContent> {
    try {
      const $ = cheerio.load(html);
      
      // Remove script and style elements
      $('script, style').remove();
      
      // Extract text
      const text = $('body').text().trim().replace(/\s+/g, ' ');
      
      // Extract sections from headers
      const sections: any[] = [];
      $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
        const level = parseInt(elem.tagName.substring(1));
        const title = $(elem).text().trim();
        const content = $(elem).nextUntil(elem.tagName).text().trim();
        
        sections.push({
          title,
          content,
          level,
        });
      });

      return {
        text,
        metadata: {
          wordCount: text.split(/\s+/).length,
        },
        structure: {
          sections,
        },
      };
    } catch (error) {
      this.logger.error('Failed to parse HTML', { error: error.message });
      throw this.createError('Failed to parse HTML document', 500, 'HTML_PARSE_ERROR');
    }
  }

  /**
   * Parse plain text documents
   */
  private async parsePlainText(text: string): Promise<ParsedContent> {
    const sections = this.extractSectionsFromText(text);

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
      },
      structure: {
        sections,
      },
    };
  }

  /**
   * Extract sections from plain text
   */
  private extractSectionsFromText(text: string): Array<{ title: string; content: string; level: number }> {
    const lines = text.split('\n');
    const sections: Array<{ title: string; content: string; level: number }> = [];
    let currentSection: { title: string; content: string; level: number } | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line looks like a header
      if (trimmedLine && trimmedLine.length < 100 && /^[A-Z]/.test(trimmedLine)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine,
          content: '',
          level: 1,
        };
      } else if (currentSection && trimmedLine) {
        currentSection.content += trimmedLine + ' ';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): Array<{ type: 'person' | 'organization' | 'location' | 'date' | 'policy' | 'regulation'; value: string; context?: string }> {
    const entities: Array<{ type: 'person' | 'organization' | 'location' | 'date' | 'policy' | 'regulation'; value: string; context?: string }> = [];

    // Extract dates
    const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi;
    const dates = text.match(dateRegex) || [];
    dates.forEach(date => {
      entities.push({ type: 'date' as const, value: date });
    });

    // Extract common policy/regulation references
    const policyRegex = /\b(GDPR|AML|KYC|CFT|MiFID|Basel|Solvency|FATF|PSD2|CCPA|SOX)\b/gi;
    const policies = text.match(policyRegex) || [];
    policies.forEach((policy: string) => {
      entities.push({ type: 'regulation' as const, value: policy.toUpperCase() });
    });

    // Extract organizations (simplified - looks for capitalized multi-word phrases)
    const orgRegex = /\b([A-Z][a-z]+ (?:[A-Z][a-z]+ )*(?:Inc|LLC|Ltd|Corporation|Company|Bank|Group))\b/g;
    const orgs = text.match(orgRegex) || [];
    orgs.forEach(org => {
      entities.push({ type: 'organization' as const, value: org });
    });

    return entities;
  }

  /**
   * Extract key phrases from text
   */
  private extractKeyPhrases(text: string): string[] {
    // Simple keyword extraction based on frequency
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'shall', 'to', 'of', 'in', 'for', 'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once']);
    
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // Sort by frequency and return top 10
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Generate a brief summary of the text
   */
  private generateSummary(text: string): string {
    // Simple summary: first 200 characters
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length <= 200) {
      return cleanText;
    }
    return cleanText.substring(0, 197) + '...';
  }

  /**
   * Infer document type from content
   */
  private inferDocumentType(parsedContent: ParsedContent): DocumentType {
    const text = parsedContent.text.toLowerCase();
    
    if (text.includes('policy') || text.includes('procedure')) {
      return DocumentType.POLICY;
    }
    if (text.includes('annual report') || text.includes('financial statement')) {
      return DocumentType.ANNUAL_REPORT;
    }
    if (text.includes('compliance') && text.includes('certificate')) {
      return DocumentType.COMPLIANCE_CERT;
    }
    if (text.includes('audit') && text.includes('report')) {
      return DocumentType.AUDIT_REPORT;
    }
    
    return DocumentType.OTHER;
  }

  /**
   * Download document from object storage
   */
  private async downloadDocumentFromStorage(document: DatabaseDocument): Promise<Buffer> {
    try {
      const downloadUrl = await this.objectStorageService.getDocumentDownloadURL(document.s3Key);
      
      // Fetch the document content
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error('Failed to download document from storage', {
        documentId: document.id,
        error: error.message,
      });
      throw this.createError('Failed to download document', 500, 'DOWNLOAD_ERROR');
    }
  }
}

// Export singleton instance
export const documentParserService = new DocumentParserService();