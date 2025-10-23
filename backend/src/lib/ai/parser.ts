/**
 * Real Document Parser Implementation
 * Uses pdf-parse and other libraries to extract actual content from documents
 */

// Use dynamic imports to avoid pdf-parse's test file loading issue
// import pdfParse from 'pdf-parse';  // <-- Don't do this, it loads test files!
// import mammoth from 'mammoth';
// import * as XLSX from 'xlsx';

export interface ParsedContent {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    language?: string;
    author?: string;
    createdAt?: string;
    modifiedAt?: string;
    [key: string]: any;
  };
  structure?: {
    sections?: string[];
    headers?: string[];
    tables?: any[];
  };
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

/**
 * Parse document content from buffer based on MIME type
 */
export async function parseDocumentContent(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedContent> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await parsePDF(buffer);

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return await parseDOCX(buffer);

      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return await parseXLSX(buffer);

      case 'text/plain':
      case 'text/csv':
        return await parsePlainText(buffer.toString('utf-8'));

      case 'text/html':
        return await parseHTML(buffer.toString('utf-8'));

      default:
        // Try to parse as plain text as fallback
        return await parsePlainText(buffer.toString('utf-8'));
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

/**
 * Parse PDF document
 */
async function parsePDF(buffer: Buffer): Promise<ParsedContent> {
  try {
    // Dynamic import to avoid test file loading issue with pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    const text = data.text || '';
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Extract sections based on headings (lines that are all caps or start with numbers)
    const lines = text.split('\n');
    const sections: string[] = [];
    const headers: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 3 && trimmed.length < 100) {
        // Potential header: all caps or starts with number
        if (trimmed === trimmed.toUpperCase() || /^\d+\.?\s+[A-Z]/.test(trimmed)) {
          headers.push(trimmed);
          sections.push(trimmed);
        }
      }
    }

    return {
      text,
      metadata: {
        pages: data.numpages,
        wordCount,
        language: 'en', // TODO: Add language detection
        author: data.info?.Author,
        createdAt: data.info?.CreationDate,
        modifiedAt: data.info?.ModDate,
        title: data.info?.Title,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
      },
      structure: {
        sections: sections.length > 0 ? sections : undefined,
        headers: headers.length > 0 ? headers : undefined,
      },
    };
  } catch (error) {
    console.error('Failed to parse PDF:', error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse DOCX document
 */
async function parseDOCX(buffer: Buffer): Promise<ParsedContent> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Extract headers (lines that are short and likely titles)
    const lines = text.split('\n');
    const headers: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 3 && trimmed.length < 100) {
        if (trimmed === trimmed.toUpperCase() || /^[A-Z][a-z]/.test(trimmed)) {
          headers.push(trimmed);
        }
      }
    }

    return {
      text,
      metadata: {
        wordCount,
        language: 'en', // TODO: Add language detection
      },
      structure: {
        headers: headers.length > 0 ? headers.slice(0, 20) : undefined,
      },
    };
  } catch (error) {
    console.error('Failed to parse DOCX:', error);
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
}

/**
 * Parse XLSX/Excel document
 */
async function parseXLSX(buffer: Buffer): Promise<ParsedContent> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    let allText = '';
    const tables: any[] = [];

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      // Convert to CSV for text extraction
      const csv = XLSX.utils.sheet_to_csv(sheet);
      allText += `\n\n=== ${sheetName} ===\n${csv}`;

      // Convert to JSON for structured data
      const json = XLSX.utils.sheet_to_json(sheet);
      if (json.length > 0) {
        tables.push({
          name: sheetName,
          rows: json.length,
          columns: Object.keys(json[0] || {}).length,
          data: json.slice(0, 100), // Limit to first 100 rows
        });
      }
    }

    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;

    return {
      text: allText,
      metadata: {
        wordCount,
        sheetCount: workbook.SheetNames.length,
        sheets: workbook.SheetNames,
      },
      structure: {
        tables: tables.length > 0 ? tables : undefined,
      },
    };
  } catch (error) {
    console.error('Failed to parse XLSX:', error);
    throw new Error(`XLSX parsing failed: ${error.message}`);
  }
}

/**
 * Parse plain text
 */
async function parsePlainText(text: string): Promise<ParsedContent> {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  return {
    text,
    metadata: {
      wordCount,
      language: 'en', // TODO: Add language detection
    },
  };
}

/**
 * Parse HTML
 */
async function parseHTML(html: string): Promise<ParsedContent> {
  // Simple HTML to text conversion (strip tags)
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  // Extract headers
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const headers = [...h1Matches, ...h2Matches]
    .map(h => h.replace(/<[^>]+>/g, '').trim())
    .filter(h => h.length > 0);

  return {
    text,
    metadata: {
      wordCount,
      language: 'en', // TODO: Add language detection
    },
    structure: {
      headers: headers.length > 0 ? headers : undefined,
    },
  };
}
