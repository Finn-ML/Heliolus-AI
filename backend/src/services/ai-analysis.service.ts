/**
 * AI Analysis Service
 * Handles AI-powered analysis of documents and questions for assessments
 * Generates prompts, searches content, scores findings, and creates answers
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  DatabaseQuestion,
  DatabaseDocument,
  AnswerStatus,
  UserRole,
} from '../types/database';
import { DocumentParserService, ParsedContent } from './document-parser.service';
import { PreprocessingResult } from './document-preprocessing.service';
import { DocumentRelevanceRanker } from '../lib/document-relevance';
import { answerService } from './answer.service';
import OpenAI from 'openai';

// AI Analysis schemas
const AnalyzeQuestionSchema = z.object({
  question: z.object({
    id: z.string(),
    text: z.string(),
    aiPromptHint: z.string().optional(),
    scoringRules: z.any().optional(),
    type: z.string(),
    required: z.boolean(),
  }),
  documents: z.array(z.object({
    id: z.string(),
    parsedContent: z.any().optional(),
    filename: z.string(),
  })),
  websiteContent: z.string().optional(),
});

const BatchAnalysisSchema = z.object({
  assessmentId: z.string().cuid(),
  questions: z.array(z.any()),
  documents: z.array(z.any()),
  websiteContent: z.string().optional(),
});

// AI Analysis result structures
export interface AnalysisResult {
  questionId: string;
  score: number;
  explanation: string;
  sourceReference: string | null;
  confidence: number;
  evidence: Array<{
    source: string;
    content: string;
    relevance: number;
  }>;
  status: AnswerStatus;
}

export interface BatchAnalysisResult {
  assessmentId: string;
  totalQuestions: number;
  analyzedQuestions: number;
  results: AnalysisResult[];
  errors: Array<{
    questionId: string;
    error: string;
  }>;
}

interface ScoringRule {
  condition: string;
  score: number;
  description?: string;
}

/**
 * Structured response from OpenAI for evidence analysis
 * Using JSON mode for reliable parsing
 */
interface EvidenceAnalysisResponse {
  hasEvidence: boolean;
  evidenceStrength: 'none' | 'weak' | 'moderate' | 'strong' | 'comprehensive';
  score: number; // 0-5
  confidence: number; // 0-1
  explanation: string;
  keyFindings: string[];
  recommendedAction?: string;
}

export class AIAnalysisService extends BaseService {
  private openai: OpenAI | null = null;
  private documentParser: DocumentParserService;
  private useOpenAI: boolean = false;
  private openaiInitialized: boolean = false;

  constructor() {
    super();
    this.documentParser = new DocumentParserService();
    // Lazy initialization - will be called on first use
  }

  /**
   * Ensure OpenAI client is initialized (lazy initialization)
   */
  private ensureOpenAIInitialized(): void {
    if (this.openaiInitialized) return;

    this.openaiInitialized = true;

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.useOpenAI = true;
      this.logger.info('AI Analysis Service initialized with OpenAI', {
        keyPrefix: apiKey.substring(0, 10),
        hasKey: true
      });
    } else {
      this.logger.warn('AI Analysis Service using mock implementation (no OpenAI API key)', {
        hasKey: !!apiKey,
        keyPrefix: apiKey ? apiKey.substring(0, 10) : 'none'
      });
    }
  }

  /**
   * Analyze a single question against available documents
   */
  async analyzeQuestion(
    question: DatabaseQuestion,
    documents: DatabaseDocument[],
    websiteContent?: string,
    organizationData?: any,
    context?: ServiceContext
  ): Promise<ApiResponse<AnalysisResult>> {
    try {
      // Ensure OpenAI is initialized (lazy initialization)
      this.ensureOpenAIInitialized();

      const validatedData = await this.validateInput(AnalyzeQuestionSchema, {
        question,
        documents,
        websiteContent,
      });

      this.logger.info('Analyzing question', {
        questionId: question.id,
        documentCount: documents.length,
        hasWebsite: !!websiteContent,
        hasOrganizationData: !!organizationData,
      });

      // Step 1: Generate AI prompt with organization context
      const prompt = this.generatePrompt(question, organizationData);

      // Step 2: Gather all searchable content including organization data
      const searchableContent = await this.gatherSearchableContent(
        documents,
        websiteContent,
        organizationData
      );

      // Step 3: Search for relevant evidence
      const evidence = await this.findRelevantEvidence(
        prompt,
        searchableContent,
        question
      );

      // Step 4: Score the findings
      const scoring = await this.scoreFindings(
        question,
        evidence
      );

      // Step 5: Generate explanation
      const explanation = await this.generateExplanation(
        question,
        evidence,
        scoring.score
      );

      // Step 6: Determine answer status
      const status = this.determineAnswerStatus(scoring.score, evidence);

      const result: AnalysisResult = {
        questionId: question.id,
        score: scoring.score,
        explanation,
        sourceReference: evidence.length > 0 ? evidence[0].source : null,
        confidence: scoring.confidence,
        evidence,
        status,
      };

      this.logger.info('Question analysis completed', {
        questionId: question.id,
        score: result.score,
        evidenceCount: evidence.length,
        status: result.status,
      });

      return this.createResponse(true, result, 'Question analyzed successfully');
    } catch (error) {
      this.logger.error('Failed to analyze question', {
        questionId: question.id,
        error: error.message,
      });
      
      if (error.statusCode) throw error;
      throw this.createError('Failed to analyze question', 500, 'ANALYSIS_ERROR');
    }
  }

  /**
   * NEW: Analyze question with preprocessed documents (OPTIMIZED)
   * Story 1.26: AI Document Processing Optimization
   *
   * This method uses preprocessed document summaries and embeddings
   * to dramatically reduce API calls and improve performance.
   */
  async analyzeQuestionWithPreprocessedDocs(
    question: DatabaseQuestion,
    preprocessedDocs: Map<string, PreprocessingResult>,
    websiteContent?: string,
    organizationData?: any,
    context?: ServiceContext
  ): Promise<ApiResponse<AnalysisResult>> {
    try {
      this.ensureOpenAIInitialized();

      this.logger.info('Analyzing question with preprocessed documents', {
        questionId: question.id,
        preprocessedDocCount: preprocessedDocs.size,
        hasWebsite: !!websiteContent,
        hasOrganizationData: !!organizationData,
      });

      // Step 1: Rank documents by relevance to question
      const ranker = new DocumentRelevanceRanker();
      const topK = parseInt(process.env.AI_TOP_K_DOCUMENTS || '3');

      const topDocs = ranker.rankDocuments(question, preprocessedDocs, { topK });

      this.logger.debug('Ranked documents by relevance', {
        questionId: question.id,
        topDocuments: topDocs.map(d => ({
          filename: d.filename,
          score: Math.round(d.score * 100) / 100,
        })),
      });

      // Step 2: Combine top documents into single context
      const combinedContext = this.buildCombinedContext(topDocs, preprocessedDocs);

      // Step 3: Generate prompt with organization context
      const prompt = this.generatePrompt(question, organizationData);

      // Step 4: Single API call with combined context
      let analysis: string;
      let confidence: number;

      if (this.useOpenAI && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `You are analyzing compliance questions against provided evidence from multiple documents.

Return a JSON object with the following structure:
{
  "hasEvidence": boolean,
  "evidenceStrength": "none" | "weak" | "moderate" | "strong" | "comprehensive",
  "score": number (0-5, where 5=comprehensive evidence, 4=strong, 3=adequate, 2=weak, 1=minimal, 0=none),
  "confidence": number (0-1 scale),
  "explanation": string (detailed analysis),
  "keyFindings": string[] (bullet points of key evidence found),
  "recommendedAction": string (optional)
}`
          }, {
            role: 'user',
            content: `${prompt}\n\nEvidence from ${topDocs.length} relevant documents:\n\n${combinedContext}`
          }],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 800,
        });

        const analysisText = response.choices[0]?.message?.content || '{}';

        try {
          const structuredAnalysis: EvidenceAnalysisResponse = JSON.parse(analysisText);

          analysis = structuredAnalysis.explanation;
          confidence = structuredAnalysis.confidence;

          // Use AI-provided score directly
          const score = structuredAnalysis.score;

          // Step 6: Build evidence array from top documents with AI-provided relevance
          const relevanceMap: Record<string, number> = {
            'comprehensive': 0.95,
            'strong': 0.85,
            'moderate': 0.70,
            'weak': 0.50,
            'none': 0.10
          };

          const evidence = topDocs.map(doc => {
            const docData = preprocessedDocs.get(doc.documentId)!;
            return {
              source: doc.filename,
              content: docData.summary.substring(0, 300),
              relevance: relevanceMap[structuredAnalysis.evidenceStrength] || doc.score,
            };
          });

          const status = this.determineAnswerStatus(score, evidence);

          const result: AnalysisResult = {
            questionId: question.id,
            score,
            explanation: analysis,
            sourceReference: topDocs.length > 0 ? topDocs[0].filename : null,
            confidence,
            evidence,
            status,
          };

          this.logger.info('Question analysis with preprocessing completed (structured)', {
            questionId: question.id,
            score: result.score,
            strength: structuredAnalysis.evidenceStrength,
            documentsUsed: topDocs.length,
            status: result.status,
          });

          return { success: true, data: result };

        } catch (parseError) {
          this.logger.warn('Failed to parse structured response, falling back to string analysis', {
            error: parseError.message,
            responsePreview: analysisText.substring(0, 200)
          });

          // Fallback to old method if JSON parsing fails
          analysis = analysisText;
          confidence = 0.85;
        }
      } else {
        // Mock analysis for testing
        analysis = `Based on analysis of ${topDocs.length} documents, evidence found addressing the question.`;
        confidence = 0.6;
      }

      // Fallback: Step 5: Score and interpret results (only if structured parsing failed)
      const score = this.calculateScoreFromAnalysis(analysis, topDocs);
      const explanation = this.generateExplanationFromAnalysis(
        analysis,
        score,
        topDocs,
        preprocessedDocs
      );

      // Step 6: Build evidence array from top documents
      const evidence = topDocs.map(doc => {
        const docData = preprocessedDocs.get(doc.documentId)!;
        return {
          source: doc.filename,
          content: docData.summary.substring(0, 300),
          relevance: doc.score,
        };
      });

      const status = this.determineAnswerStatus(score, evidence);

      const result: AnalysisResult = {
        questionId: question.id,
        score,
        explanation,
        sourceReference: topDocs.length > 0 ? topDocs[0].filename : null,
        confidence,
        evidence,
        status,
      };

      this.logger.info('Question analysis with preprocessing completed', {
        questionId: question.id,
        score: result.score,
        documentsUsed: topDocs.length,
        status: result.status,
      });

      return this.createResponse(true, result, 'Question analyzed successfully');

    } catch (error) {
      this.logger.error('Failed to analyze question with preprocessed docs', {
        questionId: question.id,
        error: error.message,
      });

      if (error.statusCode) throw error;
      throw this.createError('Failed to analyze question', 500, 'ANALYSIS_ERROR');
    }
  }

  /**
   * Build combined context from top relevant documents
   */
  private buildCombinedContext(
    topDocs: Array<{ documentId: string; filename: string; score: number }>,
    preprocessedDocs: Map<string, PreprocessingResult>
  ): string {
    return topDocs
      .map((doc, idx) => {
        const docData = preprocessedDocs.get(doc.documentId);
        if (!docData) return '';

        const relevancePercent = Math.round(doc.score * 100);
        return `[Document ${idx + 1}: ${doc.filename} - Relevance: ${relevancePercent}%]\n${docData.summary}`;
      })
      .filter(text => text.length > 0)
      .join('\n\n---\n\n');
  }

  /**
   * Calculate score from AI analysis text
   */
  private calculateScoreFromAnalysis(
    analysis: string,
    topDocs: Array<{ score: number }>
  ): number {
    const lowerAnalysis = analysis.toLowerCase();

    // CRITICAL FIX Bug #4 & #8: Check for negative evidence phrases FIRST, even before explicit scores
    // AI sometimes writes "Overall Score: 5/5" despite saying "no evidence" throughout
    // We must validate the explicit score against the content
    const hasNegativeEvidence =
      lowerAnalysis.includes('cannot access') ||
      lowerAnalysis.includes('cannot directly assess') ||
      lowerAnalysis.includes('cannot assess') ||
      lowerAnalysis.includes('cannot confirm') ||
      lowerAnalysis.includes('cannot ascertain') ||
      lowerAnalysis.includes('cannot definitively') ||
      lowerAnalysis.includes('i do not have access') ||
      lowerAnalysis.includes('i cannot') ||
      lowerAnalysis.includes('we cannot confirm') ||
      lowerAnalysis.includes('document has not been provided') ||
      lowerAnalysis.includes('documents have not been provided') ||
      lowerAnalysis.includes('not been shared') ||
      lowerAnalysis.includes('not available') ||
      lowerAnalysis.includes('no direct evidence') ||
      lowerAnalysis.includes('no specific evidence') ||
      lowerAnalysis.includes('no evidence') ||
      lowerAnalysis.includes('no mention') ||
      lowerAnalysis.includes('lack of specific evidence') ||
      lowerAnalysis.includes('lack of evidence') ||
      lowerAnalysis.includes('insufficient evidence') ||
      lowerAnalysis.includes('does not provide') ||
      lowerAnalysis.includes('does not mention') ||
      lowerAnalysis.includes('does not indicate') ||
      lowerAnalysis.includes('does not explicitly') ||
      lowerAnalysis.includes('need to analyze') ||
      lowerAnalysis.includes('would need to') ||
      lowerAnalysis.includes('i would need') ||
      lowerAnalysis.includes('would need specific') ||
      lowerAnalysis.includes('would need the actual') ||
      lowerAnalysis.includes('remains unverified') ||
      lowerAnalysis.includes('is not detailed') ||
      lowerAnalysis.includes('not supported by evidence') ||
      lowerAnalysis.includes('do not contain any content') ||
      lowerAnalysis.includes('does not contain any content') ||
      lowerAnalysis.includes('once you provide') ||
      lowerAnalysis.includes('once i have access') ||
      lowerAnalysis.includes('please provide') ||
      lowerAnalysis.includes('need the specific content') ||
      lowerAnalysis.includes('need specific excerpts') ||
      lowerAnalysis.includes('cannot analyze directly') ||
      lowerAnalysis.includes('unfortunately, the documents');

    if (hasNegativeEvidence) {
      return 0; // AI explicitly states lack of evidence = score 0 (ignore any explicit score it wrote)
    }

    // Check for explicit scoring in analysis (only if no negative evidence detected)
    const scoreMatch = analysis.match(/score[:\s]+(\d+)\/5/i);
    if (scoreMatch) {
      return parseInt(scoreMatch[1]);
    }

    // Heuristic scoring based on analysis content (only if no "cannot" detected)
    if (lowerAnalysis.includes('comprehensive') ||
        lowerAnalysis.includes('fully addresses') ||
        lowerAnalysis.includes('strong evidence')) {
      return 5;
    }

    if (lowerAnalysis.includes('adequate') ||
        lowerAnalysis.includes('sufficient') ||
        lowerAnalysis.includes('good evidence')) {
      return 4;
    }

    if (lowerAnalysis.includes('partial') ||
        lowerAnalysis.includes('some evidence')) {
      return 3;
    }

    if (lowerAnalysis.includes('minimal') ||
        lowerAnalysis.includes('insufficient') ||
        lowerAnalysis.includes('weak') ||
        lowerAnalysis.includes('limited')) {
      return 2;
    }

    if (lowerAnalysis.includes('no evidence') ||
        lowerAnalysis.includes('not found') ||
        lowerAnalysis.includes('absent')) {
      return 1;
    }

    // Default: use average relevance of top documents BUT with stricter thresholds
    // FIX: Document relevance ≠ evidence quality. A "relevant" document may have zero actual evidence.
    // Only use document relevance as fallback if reasonably high, otherwise assume no evidence.
    const avgRelevance = topDocs.reduce((sum, d) => sum + d.score, 0) / topDocs.length;

    if (avgRelevance >= 0.9) {
      return 3; // Very relevant doc + no negative keywords = assume moderate evidence
    } else if (avgRelevance >= 0.7) {
      return 2; // Relevant doc + no negative keywords = assume limited evidence
    } else if (avgRelevance >= 0.5) {
      return 1; // Somewhat relevant + no negative keywords = assume minimal evidence
    } else {
      return 0; // Low relevance + no clear evidence statement = no evidence
    }
  }

  /**
   * Generate explanation from AI analysis
   */
  private generateExplanationFromAnalysis(
    analysis: string,
    score: number,
    topDocs: Array<{ filename: string; score: number }>,
    preprocessedDocs: Map<string, PreprocessingResult>
  ): string {
    let explanation = `AI Analysis: ${analysis}\n\n`;

    explanation += `Documents analyzed (${topDocs.length}):\n`;
    topDocs.forEach((doc, idx) => {
      explanation += `${idx + 1}. ${doc.filename} (${Math.round(doc.score * 100)}% relevant)\n`;
    });

    explanation += `\nOverall Score: ${score}/5\n`;

    return explanation;
  }

  /**
   * Perform batch analysis of multiple questions
   */
  async batchAnalyzeQuestions(
    assessmentId: string,
    questions: DatabaseQuestion[],
    documents: DatabaseDocument[],
    websiteContent?: string,
    organizationData?: any,
    context?: ServiceContext
  ): Promise<ApiResponse<BatchAnalysisResult>> {
    try {
      // Ensure OpenAI is initialized (lazy initialization)
      this.ensureOpenAIInitialized();

      const validatedData = await this.validateInput(BatchAnalysisSchema, {
        assessmentId,
        questions,
        documents,
        websiteContent,
      });

      this.logger.info('Starting batch analysis', {
        assessmentId,
        questionCount: questions.length,
        documentCount: documents.length,
      });

      const results: AnalysisResult[] = [];
      const errors: Array<{ questionId: string; error: string }> = [];

      // Process questions in parallel batches to optimize performance
      const batchSize = 5; // Process 5 questions at a time
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (question) => {
          try {
            const result = await this.analyzeQuestion(
              question,
              documents,
              websiteContent,
              organizationData,
              context
            );
            return { success: true, data: result.data };
          } catch (error) {
            return { 
              success: false, 
              error: { 
                questionId: question.id, 
                error: error.message 
              } 
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(result => {
          if (result.success) {
            results.push(result.data);
          } else {
            errors.push(result.error);
          }
        });

        // Update progress
        this.logger.info('Batch progress', {
          assessmentId,
          processed: i + batch.length,
          total: questions.length,
        });
      }

      const batchResult: BatchAnalysisResult = {
        assessmentId,
        totalQuestions: questions.length,
        analyzedQuestions: results.length,
        results,
        errors,
      };

      this.logger.info('Batch analysis completed', {
        assessmentId,
        total: batchResult.totalQuestions,
        analyzed: batchResult.analyzedQuestions,
        errors: errors.length,
      });

      return this.createResponse(
        true,
        batchResult,
        `Analyzed ${batchResult.analyzedQuestions}/${batchResult.totalQuestions} questions`
      );
    } catch (error) {
      if (error.statusCode) throw error;
      throw this.createError('Failed to perform batch analysis', 500, 'BATCH_ANALYSIS_ERROR');
    }
  }

  /**
   * Generate AI prompt combining question text with AI hint and organization context
   */
  private generatePrompt(question: DatabaseQuestion, organizationData?: any): string {
    let prompt = `Question: ${question.text}\n\n`;

    // Add organization context first if available
    if (organizationData) {
      prompt += `Organization Profile:\n`;
      if (organizationData.name) prompt += `- Name: ${organizationData.name}\n`;
      if (organizationData.country) prompt += `- Country: ${organizationData.country}\n`;
      if (organizationData.geography) prompt += `- Operating Regions: ${organizationData.geography}\n`;
      if (organizationData.size) prompt += `- Company Size: ${organizationData.size}\n`;
      if (organizationData.industry) prompt += `- Industry: ${organizationData.industry}\n`;
      if (organizationData.riskProfile) prompt += `- Risk Profile: ${organizationData.riskProfile}\n`;
      if (organizationData.complianceTeamSize) prompt += `- Compliance Team Size: ${organizationData.complianceTeamSize}\n`;
      prompt += `\n`;
    }

    if (question.aiPromptHint) {
      prompt += `Context: ${question.aiPromptHint}\n\n`;
    }

    // CRITICAL: Instruct AI to treat all documents as belonging to the organization being assessed
    if (organizationData?.name) {
      prompt += `IMPORTANT: All documents provided belong to the organization "${organizationData.name}". `;
      prompt += `Any company names, references, or examples mentioned within the documents should be interpreted as referring to ${organizationData.name}. `;
      prompt += `Documents may contain template text, legacy company names, or example scenarios - treat all policies, procedures, and controls described as ${organizationData.name}'s actual practices.\n\n`;
    }

    prompt += `Task: Search for evidence in the provided documents and organization profile that answers this question. `;
    prompt += `Focus on finding specific information, policies, procedures, or statements that directly address the question. `;
    prompt += `If the answer can be derived from the organization profile (e.g., region, country, size), use that information. `;
    prompt += `If found, assess the completeness and quality of the evidence.\n\n`;

    if (question.type === 'BOOLEAN') {
      prompt += `This is a yes/no question. Look for clear evidence supporting either answer.\n`;
    } else if (question.type === 'SELECT' || question.type === 'MULTISELECT') {
      prompt += `This is a multiple-choice question. Identify which options are supported by evidence.\n`;
    }

    return prompt;
  }

  /**
   * Gather all searchable content from documents, website, and organization profile
   */
  private async gatherSearchableContent(
    documents: DatabaseDocument[],
    websiteContent?: string,
    organizationData?: any
  ): Promise<Array<{ source: string; content: string }>> {
    const searchableContent: Array<{ source: string; content: string }> = [];

    // Add organization profile as searchable content (first priority)
    if (organizationData) {
      let orgContent = `Organization Information:\n`;
      orgContent += `Name: ${organizationData.name || 'Not specified'}\n`;
      orgContent += `Country: ${organizationData.country || 'Not specified'}\n`;
      orgContent += `Operating Regions: ${organizationData.geography || 'Not specified'}\n`;
      orgContent += `Company Size: ${organizationData.size || 'Not specified'}\n`;
      orgContent += `Industry: ${organizationData.industry || 'Not specified'}\n`;
      orgContent += `Risk Profile: ${organizationData.riskProfile || 'Not specified'}\n`;
      orgContent += `Compliance Team Size: ${organizationData.complianceTeamSize || 'Not specified'}\n`;

      if (organizationData.description) {
        orgContent += `Description: ${organizationData.description}\n`;
      }

      searchableContent.push({
        source: 'Organization Profile',
        content: orgContent,
      });
    }

    // Add parsed document content
    for (const doc of documents) {
      if (doc.parsedContent) {
        const parsed = doc.parsedContent as unknown as ParsedContent;
        searchableContent.push({
          source: doc.filename,
          content: parsed.text,
        });
      }
    }

    // Add website content if available
    if (websiteContent) {
      searchableContent.push({
        source: 'Website',
        content: websiteContent,
      });
    }

    return searchableContent;
  }

  /**
   * Find relevant evidence for the question using structured JSON output
   * Modern approach: Let OpenAI return structured data instead of parsing text
   */
  private async findRelevantEvidence(
    prompt: string,
    searchableContent: Array<{ source: string; content: string }>,
    question: DatabaseQuestion
  ): Promise<Array<{ source: string; content: string; relevance: number }>> {
    const evidence: Array<{ source: string; content: string; relevance: number }> = [];

    if (this.useOpenAI && this.openai) {
      // Use OpenAI with structured JSON output
      for (const content of searchableContent) {
        try {
          const response = await this.openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an AI compliance analyst evaluating evidence from documents.
Analyze the document and return a JSON object with the following structure:
{
  "hasEvidence": boolean,
  "evidenceStrength": "none" | "weak" | "moderate" | "strong" | "comprehensive",
  "score": number (0-5),
  "confidence": number (0-1),
  "explanation": string,
  "keyFindings": string[],
  "recommendedAction": string (optional)
}

Scoring Guide:
- 5 = Comprehensive evidence with best practices
- 4 = Strong evidence with minor gaps
- 3 = Adequate evidence with some gaps
- 2 = Weak evidence with significant gaps
- 1 = Very minimal evidence
- 0 = No evidence found

Be honest and accurate. If there's no evidence, say so.`,
              },
              {
                role: 'user',
                content: `${prompt}\n\nDocument Source: ${content.source}\n\nDocument Content:\n${content.content.substring(0, 8000)}`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 800,
          });

          const analysisText = response.choices[0]?.message?.content;
          if (!analysisText) continue;

          // Parse structured JSON response
          let analysis: EvidenceAnalysisResponse;
          try {
            analysis = JSON.parse(analysisText);
          } catch (parseError) {
            this.logger.warn('Failed to parse OpenAI JSON response', {
              source: content.source,
              error: parseError.message,
              responsePreview: analysisText.substring(0, 200)
            });
            continue;
          }

          // Validate response structure
          if (typeof analysis.hasEvidence !== 'boolean' || typeof analysis.score !== 'number') {
            this.logger.warn('Invalid JSON structure from OpenAI', {
              source: content.source,
              analysis
            });
            continue;
          }

          // Only add evidence if AI confirms it exists
          if (analysis.hasEvidence && analysis.score > 0) {
            // Map evidence strength to relevance score
            const relevanceMap = {
              'comprehensive': 0.95,
              'strong': 0.85,
              'moderate': 0.70,
              'weak': 0.50,
              'none': 0.10
            };

            const relevance = relevanceMap[analysis.evidenceStrength] || analysis.confidence;

            evidence.push({
              source: content.source,
              content: analysis.explanation,
              relevance: relevance,
            });

            this.logger.info('Evidence found with structured analysis', {
              source: content.source,
              score: analysis.score,
              strength: analysis.evidenceStrength,
              confidence: analysis.confidence,
              findingsCount: analysis.keyFindings?.length || 0
            });
          } else {
            this.logger.debug('No evidence found in source', {
              source: content.source,
              reason: analysis.explanation.substring(0, 100)
            });
          }

        } catch (error) {
          this.logger.warn('OpenAI analysis failed for document', {
            source: content.source,
            error: error.message,
          });
        }
      }
    } else {
      // Fallback to keyword-based search
      const keywords = this.extractKeywords(question.text);
      
      for (const content of searchableContent) {
        const relevance = this.calculateRelevance(content.content, keywords);
        
        if (relevance > 0.3) {
          // Extract relevant snippet
          const snippet = this.extractRelevantSnippet(content.content, keywords);
          evidence.push({
            source: content.source,
            content: snippet,
            relevance,
          });
        }
      }
    }

    // Sort by relevance and take top 3
    return evidence
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
  }

  /**
   * Score findings based on evidence quality and scoring rules
   */
  private async scoreFindings(
    question: DatabaseQuestion,
    evidence: Array<{ source: string; content: string; relevance: number }>
  ): Promise<{ score: number; confidence: number }> {
    let score = 0;
    let confidence = 0;

    if (evidence.length === 0) {
      // No evidence found
      return { score: 0, confidence: 0.1 };
    }

    // Check scoring rules if defined
    if (question.scoringRules) {
      try {
        const rules = question.scoringRules as unknown as ScoringRule[];
        
        // Apply scoring rules based on evidence
        for (const rule of rules) {
          if (this.evaluateScoringRule(rule, evidence)) {
            score = Math.max(score, rule.score);
          }
        }
        
        confidence = evidence[0].relevance;
      } catch (error) {
        this.logger.warn('Failed to apply scoring rules', {
          questionId: question.id,
          error: error.message,
        });
      }
    }

    // Default scoring based on evidence quality
    if (score === 0) {
      const avgRelevance = evidence.reduce((sum, e) => sum + e.relevance, 0) / evidence.length;

      // FIX: Tightened thresholds to prevent inflated scores from weak evidence
      // Previously: 0.2-0.4 relevance scored 2/5 (40%), causing false "moderate" scores
      // Now: Requires 0.5+ relevance for score >= 2
      if (avgRelevance >= 0.8) {
        score = 5; // Excellent evidence (very strong match)
        confidence = 0.9;
      } else if (avgRelevance >= 0.7) {
        score = 4; // Good evidence (strong match)
        confidence = 0.7;
      } else if (avgRelevance >= 0.6) {
        score = 3; // Adequate evidence (moderate match)
        confidence = 0.5;
      } else if (avgRelevance >= 0.5) {
        score = 2; // Limited evidence (weak but relevant match)
        confidence = 0.3;
      } else if (avgRelevance >= 0.3) {
        score = 1; // Very limited evidence (barely relevant)
        confidence = 0.2;
      } else {
        score = 0; // No relevant evidence found (was 1, now 0)
        confidence = 0.1;
      }
    }

    return { score, confidence };
  }

  /**
   * Generate explanation for the answer
   */
  private async generateExplanation(
    question: DatabaseQuestion,
    evidence: Array<{ source: string; content: string; relevance: number }>,
    score: number
  ): Promise<string> {
    if (evidence.length === 0) {
      return `No evidence found in the provided documents to answer this question. Score: ${score}/5`;
    }

    let explanation = `Based on analysis of available documents:\n\n`;
    
    evidence.forEach((e, index) => {
      explanation += `${index + 1}. From ${e.source} (relevance: ${Math.round(e.relevance * 100)}%):\n`;
      explanation += `   ${e.content.substring(0, 200)}${e.content.length > 200 ? '...' : ''}\n\n`;
    });

    explanation += `\nOverall Score: ${score}/5\n`;
    
    if (score >= 4) {
      explanation += `Strong evidence found that comprehensively addresses the question.`;
    } else if (score >= 3) {
      explanation += `Adequate evidence found, though some aspects may need further clarification.`;
    } else if (score >= 2) {
      explanation += `Limited evidence found. Additional documentation may be needed.`;
    } else {
      explanation += `Minimal evidence found. Significant gaps identified in documentation.`;
    }

    return explanation;
  }

  /**
   * Determine answer status based on score and evidence
   */
  private determineAnswerStatus(
    score: number,
    evidence: Array<{ source: string; content: string; relevance: number }>
  ): AnswerStatus {
    if (evidence.length === 0) {
      return AnswerStatus.INCOMPLETE;
    }
    
    if (score >= 3) {
      return AnswerStatus.COMPLETE;
    } else if (score >= 1) {
      return AnswerStatus.IN_PROGRESS;
    } else {
      return AnswerStatus.INCOMPLETE;
    }
  }

  /**
   * Extract keywords from question text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are',
      'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
      'can', 'shall', 'to', 'of', 'in', 'for', 'with', 'by', 'from',
      'about', 'into', 'through', 'during', 'before', 'after'
    ]);

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Calculate relevance of content to keywords
   */
  private calculateRelevance(content: string, keywords: string[]): number {
    const lowerContent = content.toLowerCase();
    let matchCount = 0;
    let totalWeight = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (lowerContent.match(regex) || []).length;
      
      if (matches > 0) {
        matchCount++;
        // Weight by frequency but cap at 5 to avoid over-weighting
        totalWeight += Math.min(matches, 5);
      }
    }

    if (keywords.length === 0) return 0;
    
    // Calculate relevance as combination of keyword coverage and frequency
    const coverage = matchCount / keywords.length;
    const frequency = totalWeight / (keywords.length * 5);
    
    return (coverage * 0.7) + (frequency * 0.3);
  }

  /**
   * Extract relevant snippet from content
   */
  private extractRelevantSnippet(content: string, keywords: string[]): string {
    const sentences = content.split(/[.!?]+/);
    let bestSentence = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      const score = this.calculateRelevance(sentence, keywords);
      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence.trim();
      }
    }

    // Return the best sentence plus some context
    const index = content.indexOf(bestSentence);
    if (index === -1) return bestSentence;

    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + bestSentence.length + 100);
    
    return content.substring(start, end).trim();
  }

  /**
   * Evaluate a scoring rule against evidence
   */
  private evaluateScoringRule(
    rule: ScoringRule,
    evidence: Array<{ source: string; content: string; relevance: number }>
  ): boolean {
    // Simple keyword-based rule evaluation
    const condition = rule.condition.toLowerCase();
    const evidenceText = evidence.map(e => e.content.toLowerCase()).join(' ');

    // Check if condition keywords are present in evidence
    const keywords = condition.split(/\s+/);
    const matches = keywords.filter(keyword => evidenceText.includes(keyword));

    return matches.length >= keywords.length * 0.6; // 60% match threshold
  }

  /**
   * Format assessment gaps into professional RFP technical requirements
   * Transforms raw gap descriptions into client-facing, solution-focused requirements
   *
   * @param gaps - Array of gap objects from assessment
   * @param templateName - Name of the assessment template
   * @returns Formatted professional requirements text
   */
  async formatGapsForRFP(gaps: any[], templateName: string): Promise<string> {
    await this.ensureOpenAIInitialized();

    if (!this.useOpenAI || !this.openai) {
      // Fallback: Basic formatting without AI
      return this.formatGapsBasic(gaps);
    }

    try {
      // Prepare gaps data for AI - use correct Gap model fields
      const gapsData = gaps.slice(0, 10).map((gap, index) => {
        // Extract question from title (remove "Gap in " prefix)
        const question = gap.title?.replace(/^Gap in /i, '') || 'Compliance requirement';

        // Get first 2-3 sentences of description for context
        const descSentences = (gap.description || '').split(/[.!?]+/).filter(s => s.trim().length > 20);
        const briefDesc = descSentences.slice(0, 2).join('. ') + (descSentences.length > 0 ? '.' : '');

        return {
          number: index + 1,
          severity: gap.severity || 'MEDIUM',
          category: gap.category || 'COMPLIANCE',
          question: question,
          context: briefDesc || question,
          priority: gap.priority || 'MEDIUM',
          estimatedCost: gap.estimatedCost || 'Not specified',
          estimatedEffort: gap.estimatedEffort || 'Not specified',
        };
      });

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional RFP writer specializing in compliance technology solutions. Transform compliance gap questions and analysis into clear, solution-focused technical requirements.

CRITICAL RULES:
1. Write as requirements for VENDORS TO FULFILL, not questions or assessments
2. Start with action words: "Solution must...", "Required:", "System should...", "Must provide..."
3. Focus on CAPABILITIES NEEDED, not problems identified
4. Be specific and measurable
5. Keep each requirement to 2-3 sentences maximum
6. Remove ALL assessment language ("evidence indicates", "gap in", "does not currently", etc.)

FORMAT:
[SEVERITY] Requirement Title
Clear description of what the vendor solution must provide or do.

EXAMPLE TRANSFORMATIONS:
❌ BAD: "Gap in Are fraud detection and AML monitoring systems integrated?"
✅ GOOD: "[HIGH] Integrated Fraud Detection and AML Monitoring Platform
Required: Unified system that consolidates fraud detection and AML monitoring into a single platform with real-time data sharing, eliminating batch file transfers and providing complete cross-functional visibility."

❌ BAD: "The evidence indicates there is a lack of integration"
✅ GOOD: "Solution must provide seamless integration between fraud and AML systems"`,
          },
          {
            role: 'user',
            content: `Transform these ${templateName} assessment gaps into professional RFP technical requirements. For each gap, create a clear requirement that vendors can respond to:

${JSON.stringify(gapsData, null, 2)}

Output format: Numbered list with [SEVERITY] tags, requirement titles, and 2-3 sentence descriptions of capabilities needed.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const formattedRequirements = response.choices[0]?.message?.content?.trim();

      if (!formattedRequirements) {
        this.logger.warn('OpenAI returned empty response for RFP formatting, using fallback');
        return this.formatGapsBasic(gaps);
      }

      return formattedRequirements;
    } catch (error) {
      this.logger.error('Error formatting gaps for RFP with AI', { error: error.message });
      // Fallback to basic formatting
      return this.formatGapsBasic(gaps);
    }
  }

  /**
   * Basic gap formatting (fallback when AI is unavailable)
   */
  private formatGapsBasic(gaps: any[]): string {
    return gaps
      .slice(0, 10)
      .map((gap, index) => {
        const severity = gap.severity || 'MEDIUM';
        const description = gap.description || gap.title || 'Compliance gap identified';

        // Extract key points (first 2 sentences)
        const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const brief = sentences.slice(0, 2).join('. ') + '.';

        return `${index + 1}. [${severity}] ${this.extractRequirementTitle(brief)}
   ${this.transformToRequirement(brief)}`;
      })
      .join('\n\n');
  }

  /**
   * Extract a concise title from gap description
   */
  private extractRequirementTitle(description: string): string {
    // Remove analysis phrases
    let title = description
      .replace(/The evidence (indicates|suggests) that/gi, '')
      .replace(/The documents (provide|contain|show)/gi, '')
      .replace(/there is (no|limited|insufficient)/gi, 'Requires')
      .trim();

    // Get first sentence, limit to 80 chars
    const firstSentence = title.split(/[.!?]/)[0];
    if (firstSentence.length > 80) {
      return firstSentence.substring(0, 77) + '...';
    }
    return firstSentence;
  }

  /**
   * Transform gap description into solution requirement
   */
  private transformToRequirement(description: string): string {
    // Remove analysis language and convert to requirement format
    return description
      .replace(/The evidence (indicates|suggests) that /gi, 'Solution must address: ')
      .replace(/The documents (provide|contain|show)/gi, 'Required: ')
      .replace(/there is (no|limited|insufficient)/gi, 'Must implement')
      .replace(/does not currently have/gi, 'requires')
      .replace(/is not performed regularly/gi, 'must be performed regularly')
      .replace(/lacks/gi, 'requires')
      .trim();
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();