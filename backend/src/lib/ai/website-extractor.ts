/**
 * Website Extractor - Phase 1 MVP
 * Story 2.1: AI-Powered Website Extraction for Business Profile
 *
 * Scrapes websites and extracts company information using GPT-4o-mini
 * Goal: 75-85% accuracy at $0.01 per extraction
 */

import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import type {
  CompanySize,
  AnnualRevenue,
  ComplianceTeamSize,
  Geography,
  RiskProfile
} from '../../generated/prisma/index.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===========================
// TYPES
// ===========================

export interface FieldResult<T = any> {
  value: T | null;
  confidence: number; // 0-1
  sources: string[];
  needsReview: boolean; // True if confidence < 0.70
}

export interface WebsiteExtractionResult {
  success: boolean;
  data: {
    name?: FieldResult<string>;
    industry?: FieldResult<string>;
    size?: FieldResult<CompanySize>;
    country?: FieldResult<string>;
    region?: FieldResult<string>;
    description?: FieldResult<string>;
    annualRevenue?: FieldResult<AnnualRevenue>;
    complianceTeamSize?: FieldResult<ComplianceTeamSize>;
    geography?: FieldResult<Geography>;
    riskProfile?: FieldResult<RiskProfile>;
  };
  metadata: {
    extractionTime: number; // milliseconds
    sourceUrl: string;
    scrapedAt: string; // ISO timestamp
    sourcesUsed: string[];
    avgConfidence: number;
  };
  errors?: string[];
}

interface ScrapedContent {
  html: string;
  text: string;
  structuredData: {
    jsonLd: any[];
    openGraph: Record<string, string>;
    metaTags: Record<string, string>;
  };
}

interface ExtractedCompanyData {
  name: { value: string | null; confidence: number };
  industry: { value: string | null; confidence: number };
  size: { value: CompanySize | null; confidence: number };
  country: { value: string | null; confidence: number };
  region: { value: string | null; confidence: number };
  description: { value: string | null; confidence: number };
  annualRevenue: { value: AnnualRevenue | null; confidence: number };
  complianceTeamSize: { value: ComplianceTeamSize | null; confidence: number };
  geography: { value: Geography | null; confidence: number };
  riskProfile: { value: RiskProfile | null; confidence: number };
}

// ===========================
// CONFIGURATION
// ===========================

const CONFIG = {
  maxRetries: 3,
  timeout: 10000, // 10 seconds
  confidenceThreshold: 0.70,
  // Use realistic browser User-Agent to avoid bot detection
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
};

// ===========================
// MAIN EXTRACTION FUNCTION
// ===========================

/**
 * Extract company information from website URL
 * Phase 1 MVP: Website scraping only with GPT-4o-mini
 */
export async function extractFromWebsite(url: string): Promise<WebsiteExtractionResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Step 1: Normalize URL
    const normalizedUrl = normalizeUrl(url);

    // Step 2: Scrape website with retry logic
    const scrapedContent = await scrapeWebsiteWithRetry(normalizedUrl);

    // Step 3: Extract company data using GPT-4o-mini
    const extractedData = await extractCompanyData(scrapedContent, normalizedUrl);

    // Step 4: Format results with confidence scores
    const result: WebsiteExtractionResult = {
      success: true,
      data: formatFieldResults(extractedData),
      metadata: {
        extractionTime: Date.now() - startTime,
        sourceUrl: normalizedUrl,
        scrapedAt: new Date().toISOString(),
        sourcesUsed: ['website'],
        avgConfidence: calculateAvgConfidence(extractedData)
      },
      errors: errors.length > 0 ? errors : undefined
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    return {
      success: false,
      data: {},
      metadata: {
        extractionTime: Date.now() - startTime,
        sourceUrl: url,
        scrapedAt: new Date().toISOString(),
        sourcesUsed: [],
        avgConfidence: 0
      },
      errors
    };
  }
}

// ===========================
// SCRAPING FUNCTIONS
// ===========================

/**
 * Normalize URL to standard format
 */
function normalizeUrl(url: string): string {
  // Remove protocol if present
  let normalized = url.replace(/^https?:\/\//, '');

  // Remove www. if present
  normalized = normalized.replace(/^www\./, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // Add https:// protocol
  return `https://${normalized}`;
}

/**
 * Scrape website with retry logic and exponential backoff
 */
async function scrapeWebsiteWithRetry(url: string, attempt = 1): Promise<ScrapedContent> {
  try {
    return await scrapeWebsite(url);
  } catch (error) {
    if (attempt >= CONFIG.maxRetries) {
      throw new Error(`Failed to scrape website after ${CONFIG.maxRetries} attempts: ${error}`);
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, attempt - 1) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return scrapeWebsiteWithRetry(url, attempt + 1);
  }
}

/**
 * Scrape website using Cheerio (lightweight HTML parser)
 * Falls back to Puppeteer for JavaScript-heavy sites (not implemented in Phase 1)
 */
async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  try {
    // Fetch HTML with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract structured data
    const structuredData = extractStructuredData($);

    // Extract text content (focusing on main content areas)
    const text = extractTextContent($);

    return {
      html,
      text,
      structuredData
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Website request timed out after 10 seconds');
    }
    throw error;
  }
}

/**
 * Extract structured data from HTML (JSON-LD, Open Graph, meta tags)
 */
function extractStructuredData($: cheerio.CheerioAPI): ScrapedContent['structuredData'] {
  const jsonLd: any[] = [];
  const openGraph: Record<string, string> = {};
  const metaTags: Record<string, string> = {};

  // Extract JSON-LD
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const data = JSON.parse($(elem).html() || '{}');
      jsonLd.push(data);
    } catch (e) {
      // Skip invalid JSON-LD
    }
  });

  // Extract Open Graph tags
  $('meta[property^="og:"]').each((_, elem) => {
    const property = $(elem).attr('property');
    const content = $(elem).attr('content');
    if (property && content) {
      openGraph[property] = content;
    }
  });

  // Extract meta tags
  $('meta[name]').each((_, elem) => {
    const name = $(elem).attr('name');
    const content = $(elem).attr('content');
    if (name && content) {
      metaTags[name] = content;
    }
  });

  return { jsonLd, openGraph, metaTags };
}

/**
 * Extract relevant text content from HTML
 */
function extractTextContent($: cheerio.CheerioAPI): string {
  // Remove script, style, and nav elements
  $('script, style, nav, header, footer, aside').remove();

  // Extract title
  const title = $('title').text().trim();

  // Extract main content (prioritize main, article, or body)
  let mainContent = '';
  if ($('main').length > 0) {
    mainContent = $('main').text();
  } else if ($('article').length > 0) {
    mainContent = $('article').text();
  } else {
    mainContent = $('body').text();
  }

  // Extract meta description
  const description = $('meta[name="description"]').attr('content') || '';

  // Combine and clean text
  const combined = `${title}\n\n${description}\n\n${mainContent}`;

  // Clean whitespace and limit length
  return combined
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000); // Limit to ~2000 tokens
}

// ===========================
// AI EXTRACTION FUNCTIONS
// ===========================

/**
 * Extract company data using GPT-4o-mini with structured output
 */
async function extractCompanyData(
  content: ScrapedContent,
  url: string
): Promise<ExtractedCompanyData> {
  const prompt = buildExtractionPrompt(content, url);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: EXTRACTION_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more deterministic extraction
      max_tokens: 1500
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(result);
    return validateAndNormalizeExtraction(parsed);
  } catch (error) {
    throw new Error(`GPT-4o-mini extraction failed: ${error}`);
  }
}

/**
 * Build extraction prompt from scraped content
 */
function buildExtractionPrompt(content: ScrapedContent, url: string): string {
  const parts: string[] = [];

  parts.push(`Website URL: ${url}`);

  // Add structured data if available
  if (content.structuredData.jsonLd.length > 0) {
    parts.push(`\nJSON-LD Data:\n${JSON.stringify(content.structuredData.jsonLd, null, 2)}`);
  }

  if (Object.keys(content.structuredData.openGraph).length > 0) {
    parts.push(`\nOpen Graph Tags:\n${JSON.stringify(content.structuredData.openGraph, null, 2)}`);
  }

  // Add text content (truncated)
  parts.push(`\nWebsite Content:\n${content.text.substring(0, 6000)}`);

  return parts.join('\n');
}

/**
 * System prompt for GPT-4o-mini extraction
 */
const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting structured company information from website content.

Extract the following fields with confidence scores (0.0 to 1.0):

1. **name** (string): Company legal name
2. **industry** (string): Primary industry/sector (e.g., "Financial Services", "Healthcare", "Technology")
3. **size** (enum): Company size - must be one of: "STARTUP" (1-50), "SMB" (51-500), "MIDMARKET" (501-5000), "ENTERPRISE" (5000+)
4. **country** (string): ISO 2-letter country code (e.g., "US", "GB", "DE")
5. **region** (string): State/region/city (e.g., "California", "London")
6. **description** (string): Company description/mission statement (max 500 chars)
7. **annualRevenue** (enum): One of: "UNDER_1M", "FROM_1M_10M", "FROM_10M_100M", "OVER_100M"
8. **complianceTeamSize** (enum): One of: "NONE", "ONE_TWO", "THREE_TEN", "OVER_TEN"
9. **geography** (enum): One of: "US", "EU", "UK", "APAC", "GLOBAL"
10. **riskProfile** (enum): One of: "LOW", "MEDIUM", "HIGH", "CRITICAL"

Return JSON format:
{
  "name": { "value": "...", "confidence": 0.95 },
  "industry": { "value": "...", "confidence": 0.80 },
  "size": { "value": "SMB", "confidence": 0.75 },
  "country": { "value": "US", "confidence": 0.90 },
  "region": { "value": "...", "confidence": 0.70 },
  "description": { "value": "...", "confidence": 0.85 },
  "annualRevenue": { "value": null, "confidence": 0.0 },
  "complianceTeamSize": { "value": null, "confidence": 0.0 },
  "geography": { "value": "US", "confidence": 0.65 },
  "riskProfile": { "value": null, "confidence": 0.0 }
}

Confidence scoring guidelines:
- 0.9-1.0: Explicitly stated in structured data or prominent text
- 0.7-0.9: Strongly implied by context and content
- 0.5-0.7: Reasonable inference from available information
- 0.0-0.5: Weak inference or no information (set value to null)

Set value to null and confidence to 0.0 if information is not found or cannot be reliably inferred.`;

/**
 * Validate and normalize extracted data
 */
function validateAndNormalizeExtraction(parsed: any): ExtractedCompanyData {
  const result: ExtractedCompanyData = {
    name: normalizeField(parsed.name, 'string'),
    industry: normalizeField(parsed.industry, 'string'),
    size: normalizeField(parsed.size, 'CompanySize'),
    country: normalizeField(parsed.country, 'string'),
    region: normalizeField(parsed.region, 'string'),
    description: normalizeField(parsed.description, 'string'),
    annualRevenue: normalizeField(parsed.annualRevenue, 'AnnualRevenue'),
    complianceTeamSize: normalizeField(parsed.complianceTeamSize, 'ComplianceTeamSize'),
    geography: normalizeField(parsed.geography, 'Geography'),
    riskProfile: normalizeField(parsed.riskProfile, 'RiskProfile')
  };

  return result;
}

/**
 * Normalize individual field with confidence score
 */
function normalizeField(
  field: any,
  type: 'string' | 'CompanySize' | 'AnnualRevenue' | 'ComplianceTeamSize' | 'Geography' | 'RiskProfile'
): { value: any; confidence: number } {
  if (!field || typeof field !== 'object') {
    return { value: null, confidence: 0 };
  }

  const confidence = Math.max(0, Math.min(1, field.confidence || 0));
  let value = field.value;

  // Type-specific validation
  if (type !== 'string' && value !== null) {
    value = validateEnum(value, type);
  }

  return { value, confidence };
}

/**
 * Validate enum values (must match Prisma schema enums)
 */
function validateEnum(value: string, enumType: string): string | null {
  const VALID_ENUMS = {
    CompanySize: ['STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE'],
    AnnualRevenue: ['UNDER_1M', 'FROM_1M_10M', 'FROM_10M_100M', 'OVER_100M'],
    ComplianceTeamSize: ['NONE', 'ONE_TWO', 'THREE_TEN', 'OVER_TEN'],
    Geography: ['US', 'EU', 'UK', 'APAC', 'GLOBAL'],
    RiskProfile: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  };

  const validValues = VALID_ENUMS[enumType as keyof typeof VALID_ENUMS];
  return validValues.includes(value) ? value : null;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Format extracted data into FieldResult format
 */
function formatFieldResults(data: ExtractedCompanyData): WebsiteExtractionResult['data'] {
  const result: any = {};

  for (const [field, extracted] of Object.entries(data)) {
    result[field] = {
      value: extracted.value,
      confidence: extracted.confidence,
      sources: ['website'],
      needsReview: extracted.confidence < CONFIG.confidenceThreshold
    };
  }

  return result as WebsiteExtractionResult['data'];
}

/**
 * Calculate average confidence across all fields
 */
function calculateAvgConfidence(data: ExtractedCompanyData): number {
  const confidences = Object.values(data).map(field => field.confidence);
  const sum = confidences.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / confidences.length) * 100) / 100;
}
