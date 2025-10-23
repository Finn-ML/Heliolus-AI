/**
 * Document Relevance Ranking
 * Ranks documents by relevance to questions using hybrid scoring
 * Story 1.26: AI Document Processing Optimization
 */

import { DatabaseQuestion } from '../types/database';
import { PreprocessingResult } from '../services/document-preprocessing.service';

export interface RelevanceScore {
  documentId: string;
  filename: string;
  score: number; // 0-1 (1 = most relevant)
  keywordScore: number;
  embeddingScore: number;
  reasoning: string;
}

export interface RankingOptions {
  topK?: number;
  keywordWeight?: number;
  embeddingWeight?: number;
  minScore?: number;
}

export class DocumentRelevanceRanker {
  /**
   * Rank documents by relevance to a question
   * Uses hybrid scoring: keyword matching + semantic similarity
   *
   * @param question - The question to analyze
   * @param preprocessedDocs - Map of preprocessed documents
   * @param options - Ranking options
   * @returns Sorted array of relevance scores (highest first)
   */
  rankDocuments(
    question: DatabaseQuestion,
    preprocessedDocs: Map<string, PreprocessingResult>,
    options: RankingOptions = {}
  ): RelevanceScore[] {
    const topK = options.topK || parseInt(process.env.AI_TOP_K_DOCUMENTS || '3');
    const keywordWeight = options.keywordWeight || 0.3;
    const embeddingWeight = options.embeddingWeight || 0.7;
    const minScore = options.minScore || 0.1;

    // Extract keywords from question
    const questionKeywords = this.extractKeywords(question.text);

    // Generate question embedding (mock for now, would use OpenAI in production)
    const questionEmbedding = this.generateQuestionEmbedding(question);

    const scores: RelevanceScore[] = [];

    // Score each document
    for (const [docId, docData] of preprocessedDocs.entries()) {
      // Calculate keyword relevance
      const keywordScore = this.calculateKeywordRelevance(
        questionKeywords,
        docData.summary,
        docData.keyTopics
      );

      // Calculate semantic similarity using embeddings
      const embeddingScore = this.cosineSimilarity(
        questionEmbedding,
        docData.embedding
      );

      // Hybrid scoring: weighted combination
      const score = (keywordScore * keywordWeight) + (embeddingScore * embeddingWeight);

      // Only include documents above minimum threshold
      if (score >= minScore) {
        scores.push({
          documentId: docId,
          filename: docData.filename,
          score,
          keywordScore,
          embeddingScore,
          reasoning: this.generateReasoning(keywordScore, embeddingScore, questionKeywords, docData),
        });
      }
    }

    // Sort by score descending and return top K
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length === 0 || vecB.length === 0) {
      return 0;
    }

    if (vecA.length !== vecB.length) {
      throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    }

    // Dot product
    const dotProduct = vecA.reduce((sum, a, i) => sum + (a * vecB[i]), 0);

    // Magnitude of A
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + (a * a), 0));

    // Magnitude of B
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + (b * b), 0));

    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    // Cosine similarity
    const similarity = dotProduct / (magnitudeA * magnitudeB);

    // Normalize to 0-1 range (cosine returns -1 to 1)
    return (similarity + 1) / 2;
  }

  /**
   * Calculate keyword-based relevance
   * Checks how many question keywords appear in document
   */
  private calculateKeywordRelevance(
    questionKeywords: string[],
    documentSummary: string,
    documentKeyTopics: string[]
  ): number {
    if (questionKeywords.length === 0) {
      return 0.5; // Neutral score if no keywords
    }

    const docLower = documentSummary.toLowerCase();
    const topicsSet = new Set(documentKeyTopics.map(t => t.toLowerCase()));

    let matchCount = 0;
    let topicMatchCount = 0;

    for (const keyword of questionKeywords) {
      const keywordLower = keyword.toLowerCase();

      // Check if keyword appears in summary
      if (docLower.includes(keywordLower)) {
        matchCount++;
      }

      // Bonus for keyword appearing in key topics
      if (topicsSet.has(keywordLower)) {
        topicMatchCount++;
      }
    }

    // Calculate base relevance
    const baseRelevance = matchCount / questionKeywords.length;

    // Add bonus for topic matches (max 20% boost)
    const topicBonus = (topicMatchCount / questionKeywords.length) * 0.2;

    return Math.min(1.0, baseRelevance + topicBonus);
  }

  /**
   * Extract keywords from question text
   * Removes stop words and extracts meaningful terms
   */
  private extractKeywords(text: string): string[] {
    // Common stop words to exclude
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'that', 'this',
      'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
      'shall', 'about', 'into', 'through', 'during', 'before', 'after',
      'your', 'our', 'their', 'what', 'when', 'where', 'why', 'how', 'who'
    ]);

    // Extract words (alphanumeric sequences)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => {
        return word.length > 2 && // Minimum length
          !stopWords.has(word) && // Not a stop word
          !/^\d+$/.test(word); // Not purely numeric
      });

    // Remove duplicates and return
    return Array.from(new Set(words));
  }

  /**
   * Generate question embedding
   * In production, this would call OpenAI embeddings API
   * For now, uses a simple heuristic-based approach
   */
  private generateQuestionEmbedding(question: DatabaseQuestion): number[] {
    // Extract features from question
    const keywords = this.extractKeywords(question.text);
    const hasAIHint = !!question.aiPromptHint;
    const questionLength = question.text.length;

    // Create a simple 1536-dimensional embedding based on question characteristics
    // In production, this would be replaced with OpenAI's text-embedding-ada-002
    const embedding = new Array(1536).fill(0);

    // Seed embedding with question characteristics
    for (let i = 0; i < keywords.length && i < 100; i++) {
      const keyword = keywords[i];
      const hash = this.simpleHash(keyword);
      const index = Math.abs(hash) % 1536;
      embedding[index] = 1.0;

      // Spread to nearby dimensions for semantic clustering
      embedding[(index + 1) % 1536] += 0.5;
      embedding[(index - 1 + 1536) % 1536] += 0.5;
    }

    // Add question type information
    if (question.type === 'BOOLEAN') {
      embedding[0] = 1.0;
    } else if (question.type === 'SELECT' || question.type === 'MULTISELECT') {
      embedding[1] = 1.0;
    } else if (question.type === 'TEXT' || question.type === 'TEXTAREA') {
      embedding[2] = 1.0;
    }

    // Normalize the embedding vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Generate human-readable reasoning for relevance score
   */
  private generateReasoning(
    keywordScore: number,
    embeddingScore: number,
    questionKeywords: string[],
    docData: PreprocessingResult
  ): string {
    const parts: string[] = [];

    // Keyword match reasoning
    if (keywordScore > 0.7) {
      parts.push(`Strong keyword match (${Math.round(keywordScore * 100)}%)`);
    } else if (keywordScore > 0.4) {
      parts.push(`Moderate keyword match (${Math.round(keywordScore * 100)}%)`);
    } else if (keywordScore > 0.1) {
      parts.push(`Weak keyword match (${Math.round(keywordScore * 100)}%)`);
    }

    // Semantic similarity reasoning
    if (embeddingScore > 0.7) {
      parts.push(`High semantic similarity (${Math.round(embeddingScore * 100)}%)`);
    } else if (embeddingScore > 0.5) {
      parts.push(`Moderate semantic similarity (${Math.round(embeddingScore * 100)}%)`);
    }

    // Matching topics
    const matchingTopics = docData.keyTopics.filter(topic =>
      questionKeywords.some(kw => topic.includes(kw.toLowerCase()) || kw.toLowerCase().includes(topic))
    );

    if (matchingTopics.length > 0) {
      parts.push(`Matches topics: ${matchingTopics.slice(0, 3).join(', ')}`);
    }

    return parts.length > 0
      ? parts.join('. ')
      : 'General relevance based on document content';
  }
}

// Export singleton instance
export const documentRelevanceRanker = new DocumentRelevanceRanker();
