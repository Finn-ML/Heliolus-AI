/**
 * Unit Tests: Document Relevance Ranking
 * Tests for backend/src/lib/document-relevance.ts
 * Story 1.26: AI Document Processing Optimization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DocumentRelevanceRanker,
  RelevanceScore,
  RankingOptions
} from '../../src/lib/document-relevance';
import { DatabaseQuestion } from '../../src/types/database';
import { PreprocessingResult } from '../../src/services/document-preprocessing.service';

describe('DocumentRelevanceRanker', () => {
  let ranker: DocumentRelevanceRanker;
  let mockPreprocessedDocs: Map<string, PreprocessingResult>;
  let mockQuestion: DatabaseQuestion;

  beforeEach(() => {
    ranker = new DocumentRelevanceRanker();

    // Setup mock preprocessed documents
    mockPreprocessedDocs = new Map<string, PreprocessingResult>([
      ['doc1', {
        documentId: 'doc1',
        filename: 'security-policy.pdf',
        summary: 'This document contains security policies including access controls, authentication procedures, and encryption standards for data protection.',
        embedding: createMockEmbedding('security authentication encryption'),
        keyTopics: ['security', 'authentication', 'encryption', 'access', 'controls'],
        confidence: 0.9,
        processingTimeMs: 450
      }],
      ['doc2', {
        documentId: 'doc2',
        filename: 'network-diagram.pdf',
        summary: 'Network architecture diagram showing firewall configurations, VPN setup, and network segmentation for compliance.',
        embedding: createMockEmbedding('network firewall vpn'),
        keyTopics: ['network', 'firewall', 'vpn', 'architecture', 'segmentation'],
        confidence: 0.85,
        processingTimeMs: 380
      }],
      ['doc3', {
        documentId: 'doc3',
        filename: 'financial-report.pdf',
        summary: 'Annual financial statements including revenue, expenses, and audit results for fiscal year 2024.',
        embedding: createMockEmbedding('financial revenue expenses audit'),
        keyTopics: ['financial', 'revenue', 'expenses', 'audit', 'statements'],
        confidence: 0.92,
        processingTimeMs: 420
      }],
      ['doc4', {
        documentId: 'doc4',
        filename: 'access-control-matrix.xlsx',
        summary: 'Comprehensive access control matrix defining user roles, permissions, and authentication requirements for all systems.',
        embedding: createMockEmbedding('access control authentication permissions roles'),
        keyTopics: ['access', 'control', 'authentication', 'permissions', 'roles'],
        confidence: 0.88,
        processingTimeMs: 390
      }],
      ['doc5', {
        documentId: 'doc5',
        filename: 'compliance-procedures.docx',
        summary: 'Standard operating procedures for maintaining compliance with industry regulations and standards.',
        embedding: createMockEmbedding('compliance procedures regulations standards'),
        keyTopics: ['compliance', 'procedures', 'regulations', 'standards', 'operating'],
        confidence: 0.91,
        processingTimeMs: 410
      }]
    ]);

    // Setup mock question
    mockQuestion = {
      id: 'q1',
      sectionId: 'section1',
      text: 'Does your organization have documented authentication and access control policies?',
      type: 'BOOLEAN',
      required: true,
      order: 1,
      weight: 5,
      scoringRules: {},
      aiPromptHint: 'Look for authentication methods, password policies, and access control procedures',
      createdAt: new Date(),
      updatedAt: new Date()
    } as DatabaseQuestion;
  });

  describe('rankDocuments()', () => {
    it('should return relevance scores for all documents', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs, {
        topK: 5 // Get all documents
      });

      expect(results).toHaveLength(5);
      expect(results.every(r => r.score >= 0 && r.score <= 1)).toBe(true);
    });

    it('should return top K documents by default (K=3)', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs);

      expect(results).toHaveLength(3);
    });

    it('should rank documents by relevance to question', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs);

      // The question asks about authentication and access control
      // So doc1 (security-policy) and doc4 (access-control-matrix) should rank highest
      const topDocIds = results.map(r => r.documentId);

      expect(topDocIds).toContain('doc1'); // security-policy.pdf
      expect(topDocIds).toContain('doc4'); // access-control-matrix.xlsx

      // Financial report should NOT be in top 3
      expect(topDocIds).not.toContain('doc3');
    });

    it('should sort results by score descending', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs);

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should include both keyword and embedding scores', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs);

      results.forEach(result => {
        expect(result.keywordScore).toBeDefined();
        expect(result.embeddingScore).toBeDefined();
        expect(result.keywordScore).toBeGreaterThanOrEqual(0);
        expect(result.keywordScore).toBeLessThanOrEqual(1);
        expect(result.embeddingScore).toBeGreaterThanOrEqual(0);
        expect(result.embeddingScore).toBeLessThanOrEqual(1);
      });
    });

    it('should include reasoning for each document', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs);

      results.forEach(result => {
        expect(result.reasoning).toBeDefined();
        expect(typeof result.reasoning).toBe('string');
        expect(result.reasoning.length).toBeGreaterThan(0);
      });
    });

    it('should respect custom topK parameter', () => {
      const results1 = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs, { topK: 2 });
      const results2 = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs, { topK: 4 });

      expect(results1).toHaveLength(2);
      expect(results2).toHaveLength(4);
    });

    it('should respect custom weight parameters', () => {
      // Test with 100% keyword weight (no embedding)
      const keywordResults = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs, {
        keywordWeight: 1.0,
        embeddingWeight: 0.0
      });

      // Test with 100% embedding weight (no keyword)
      const embeddingResults = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs, {
        keywordWeight: 0.0,
        embeddingWeight: 1.0
      });

      // Results should be different based on weights
      expect(keywordResults[0].documentId).not.toBe(embeddingResults[0].documentId);
    });

    it('should filter documents below minimum score threshold', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs, {
        minScore: 0.5, // Only return documents with score >= 0.5
        topK: 10
      });

      results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0.5);
      });
    });

    it('should handle empty document map', () => {
      const emptyDocs = new Map<string, PreprocessingResult>();
      const results = ranker.rankDocuments(mockQuestion, emptyDocs);

      expect(results).toHaveLength(0);
    });

    it('should handle question with no keywords', () => {
      const questionNoKeywords: DatabaseQuestion = {
        ...mockQuestion,
        text: 'Yes or no?'
      };

      const results = ranker.rankDocuments(questionNoKeywords, mockPreprocessedDocs);

      // Should still return results based on embeddings
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Cosine Similarity', () => {
    it('should calculate identical vectors as similarity = 1', () => {
      const vec = [1, 0, 0, 1];

      // Access private method via test utility
      const similarity = calculateCosineSimilarityTest(ranker, vec, vec);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should calculate orthogonal vectors as similarity = 0.5 (normalized)', () => {
      const vecA = [1, 0, 0, 0];
      const vecB = [0, 1, 0, 0];

      const similarity = calculateCosineSimilarityTest(ranker, vecA, vecB);

      // Normalized to 0-1 range, so orthogonal = 0.5
      expect(similarity).toBeCloseTo(0.5, 5);
    });

    it('should handle zero vectors', () => {
      const zeroVec = [0, 0, 0, 0];
      const normalVec = [1, 1, 1, 1];

      const similarity = calculateCosineSimilarityTest(ranker, zeroVec, normalVec);

      expect(similarity).toBe(0);
    });

    it('should throw error on dimension mismatch', () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2];

      expect(() => {
        calculateCosineSimilarityTest(ranker, vecA, vecB);
      }).toThrow('Vector dimension mismatch');
    });

    it('should handle empty vectors', () => {
      const emptyA: number[] = [];
      const emptyB: number[] = [];

      const similarity = calculateCosineSimilarityTest(ranker, emptyA, emptyB);

      expect(similarity).toBe(0);
    });
  });

  describe('Keyword Extraction', () => {
    it('should extract meaningful keywords from question', () => {
      const question: DatabaseQuestion = {
        ...mockQuestion,
        text: 'Does your organization implement multi-factor authentication for remote access?'
      };

      const results = ranker.rankDocuments(question, mockPreprocessedDocs);

      // Should find documents mentioning authentication and access
      const topDoc = mockPreprocessedDocs.get(results[0].documentId);
      expect(
        topDoc.summary.toLowerCase().includes('authentication') ||
        topDoc.keyTopics.includes('authentication')
      ).toBe(true);
    });

    it('should exclude common stop words', () => {
      const question: DatabaseQuestion = {
        ...mockQuestion,
        text: 'What are the procedures for managing access to systems?'
      };

      const results = ranker.rankDocuments(question, mockPreprocessedDocs);

      // Should successfully rank despite stop words (what, are, the, for, to)
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].keywordScore).toBeGreaterThan(0);
    });

    it('should match keywords case-insensitively', () => {
      const question1: DatabaseQuestion = {
        ...mockQuestion,
        text: 'AUTHENTICATION policies'
      };

      const question2: DatabaseQuestion = {
        ...mockQuestion,
        text: 'authentication policies'
      };

      const results1 = ranker.rankDocuments(question1, mockPreprocessedDocs);
      const results2 = ranker.rankDocuments(question2, mockPreprocessedDocs);

      // Same documents should rank highest regardless of case
      expect(results1[0].documentId).toBe(results2[0].documentId);
    });
  });

  describe('Hybrid Scoring', () => {
    it('should combine keyword and embedding scores with correct weights', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs, {
        keywordWeight: 0.3,
        embeddingWeight: 0.7
      });

      results.forEach(result => {
        const expectedScore = (result.keywordScore * 0.3) + (result.embeddingScore * 0.7);
        expect(result.score).toBeCloseTo(expectedScore, 5);
      });
    });

    it('should favor keyword matches when keyword weight is high', () => {
      const keywordHeavy = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs, {
        keywordWeight: 0.9,
        embeddingWeight: 0.1
      });

      // Documents with exact keyword matches should rank higher
      const topDoc = mockPreprocessedDocs.get(keywordHeavy[0].documentId);
      const questionLower = mockQuestion.text.toLowerCase();

      expect(
        topDoc.summary.toLowerCase().includes('authentication') ||
        topDoc.keyTopics.some(topic => questionLower.includes(topic))
      ).toBe(true);
    });
  });

  describe('Reasoning Generation', () => {
    it('should generate readable reasoning for high relevance', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs);
      const topResult = results[0];

      expect(topResult.reasoning).toMatch(/keyword match/i);
      expect(topResult.reasoning).toMatch(/\d+%/); // Should include percentage
    });

    it('should mention semantic similarity in reasoning', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs);

      const highSimilarityResult = results.find(r => r.embeddingScore > 0.6);

      if (highSimilarityResult) {
        expect(highSimilarityResult.reasoning).toMatch(/semantic similarity/i);
      }
    });

    it('should mention matching topics in reasoning', () => {
      const results = ranker.rankDocuments(mockQuestion, mockPreprocessedDocs);
      const topResult = results[0];

      if (topResult.keywordScore > 0.5) {
        expect(topResult.reasoning).toMatch(/topics:/i);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle document with empty summary', () => {
      const docsWithEmpty = new Map(mockPreprocessedDocs);
      docsWithEmpty.set('docEmpty', {
        documentId: 'docEmpty',
        filename: 'empty.pdf',
        summary: '',
        embedding: new Array(1536).fill(0),
        keyTopics: [],
        confidence: 0.5,
        processingTimeMs: 100
      });

      const results = ranker.rankDocuments(mockQuestion, docsWithEmpty, {
        minScore: 0, // Disable minimum score filter to see all documents
        topK: 10
      });

      expect(results.length).toBeGreaterThan(0);
      // Empty document should rank lowest (or be filtered out if score too low)
      const emptyDocRank = results.findIndex(r => r.documentId === 'docEmpty');

      if (emptyDocRank !== -1) {
        // If empty doc is included, it should rank last
        expect(emptyDocRank).toBe(results.length - 1);
      } else {
        // If empty doc is filtered out, that's also acceptable behavior
        expect(results.length).toBeLessThan(6); // Less than total docs
      }
    });

    it('should handle document with no key topics', () => {
      const docsWithNoTopics = new Map(mockPreprocessedDocs);
      docsWithNoTopics.set('docNoTopics', {
        documentId: 'docNoTopics',
        filename: 'no-topics.pdf',
        summary: 'Some content without clear topics',
        embedding: createMockEmbedding('content'),
        keyTopics: [],
        confidence: 0.6,
        processingTimeMs: 150
      });

      const results = ranker.rankDocuments(mockQuestion, docsWithNoTopics);

      expect(results.length).toBeGreaterThan(0);
      // Should still calculate relevance based on summary and embedding
    });

    it('should handle very long question text', () => {
      const longQuestion: DatabaseQuestion = {
        ...mockQuestion,
        text: 'A'.repeat(10000) + ' authentication access control policies'
      };

      const results = ranker.rankDocuments(longQuestion, mockPreprocessedDocs);

      expect(results.length).toBeGreaterThan(0);
      // Should still extract relevant keywords despite length
    });

    it('should handle special characters in question', () => {
      const specialCharsQuestion: DatabaseQuestion = {
        ...mockQuestion,
        text: 'Does your organization use MFA (multi-factor authentication) & SSO?'
      };

      const results = ranker.rankDocuments(specialCharsQuestion, mockPreprocessedDocs);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].keywordScore).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should rank 100 documents in reasonable time (<1 second)', () => {
      // Create 100 mock documents
      const largeDocs = new Map<string, PreprocessingResult>();
      for (let i = 0; i < 100; i++) {
        largeDocs.set(`doc${i}`, {
          documentId: `doc${i}`,
          filename: `document${i}.pdf`,
          summary: `Document ${i} content about ${i % 10 === 0 ? 'authentication' : 'other topics'}`,
          embedding: createMockEmbedding(`content${i}`),
          keyTopics: [`topic${i}`, 'general'],
          confidence: 0.8,
          processingTimeMs: 400
        });
      }

      const startTime = performance.now();
      const results = ranker.rankDocuments(mockQuestion, largeDocs, { topK: 10 });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s
      expect(results).toHaveLength(10);
    });
  });
});

// Helper Functions

/**
 * Create a mock 1536-dimensional embedding vector
 * Seeds the vector based on input text for deterministic testing
 */
function createMockEmbedding(text: string): number[] {
  const embedding = new Array(1536).fill(0);

  // Seed embedding with text characteristics
  const words = text.toLowerCase().split(/\s+/);
  words.forEach((word, idx) => {
    const hash = simpleHash(word);
    const index = Math.abs(hash) % 1536;
    embedding[index] = 1.0;

    // Spread to nearby dimensions
    embedding[(index + 1) % 1536] += 0.5;
    embedding[(index - 1 + 1536) % 1536] += 0.5;
  });

  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Test utility to access private cosineSimilarity method
 */
function calculateCosineSimilarityTest(
  ranker: DocumentRelevanceRanker,
  vecA: number[],
  vecB: number[]
): number {
  // Access private method via type casting
  return (ranker as any).cosineSimilarity(vecA, vecB);
}
