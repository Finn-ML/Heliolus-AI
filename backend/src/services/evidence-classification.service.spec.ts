import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvidenceClassificationService } from './evidence-classification.service';
import { EvidenceTier } from '../generated/prisma';

// Mock Prisma
vi.mock('../generated/prisma', () => ({
  PrismaClient: vi.fn(() => ({
    document: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $on: vi.fn(),
  })),
  EvidenceTier: {
    TIER_0: 'TIER_0',
    TIER_1: 'TIER_1',
    TIER_2: 'TIER_2',
  },
}));

// Mock objectStorage
vi.mock('../objectStorage', () => ({
  objectStorageClient: {
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        download: vi.fn(),
      })),
    })),
  },
}));

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe('EvidenceClassificationService', () => {
  let service: EvidenceClassificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create service without OpenAI to test heuristics
    delete process.env.OPENAI_API_KEY;
    service = new EvidenceClassificationService();
  });

  describe('classifyDocument - Heuristic Classification', () => {
    it('should classify CSV files as TIER_2', async () => {
      const mockDocument = {
        id: 'doc1',
        s3Bucket: 'test-bucket',
        s3Key: 'test.csv',
        filename: 'transactions.csv',
      };

      const mockContent = '"Date","Amount","Status"\n"2024-01-01","100.00","Complete"';

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      (service as any).prisma.document.update = vi.fn().mockResolvedValue(mockDocument);

      const mockFile = {
        download: vi.fn().mockResolvedValue([Buffer.from(mockContent)]),
      };
      const mockBucket = {
        file: vi.fn().mockReturnValue(mockFile),
      };
      (service as any).objectStorageClient = {
        bucket: vi.fn().mockReturnValue(mockBucket),
      };

      // Need to replace the fetchDocumentContent to return our mock content
      vi.spyOn(service as any, 'fetchDocumentContent').mockResolvedValue(mockContent);

      const result = await service.classifyDocument('doc1');

      expect(result.tier).toBe(EvidenceTier.TIER_2);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.reason).toContain('System-generated');
    });

    it('should classify policy documents as TIER_1', async () => {
      const mockDocument = {
        id: 'doc2',
        s3Bucket: 'test-bucket',
        s3Key: 'policy.pdf',
        filename: 'compliance-policy.pdf',
      };

      const mockContent = `
        Company Policy Document
        Version 2.0
        Approved by: CEO
        Effective Date: 2024-01-01

        This policy outlines our compliance procedures...
      `;

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      (service as any).prisma.document.update = vi.fn().mockResolvedValue(mockDocument);
      vi.spyOn(service as any, 'fetchDocumentContent').mockResolvedValue(mockContent);

      const result = await service.classifyDocument('doc2');

      expect(result.tier).toBe(EvidenceTier.TIER_1);
      expect(result.reason).toContain('Policy document');
    });

    it('should classify informal documents as TIER_0', async () => {
      const mockDocument = {
        id: 'doc3',
        s3Bucket: 'test-bucket',
        s3Key: 'email.txt',
        filename: 'email.txt',
      };

      const mockContent = `
        Hi team,

        Just a quick update on our compliance status.
        Everything looks good!

        Thanks,
        John
      `;

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      (service as any).prisma.document.update = vi.fn().mockResolvedValue(mockDocument);
      vi.spyOn(service as any, 'fetchDocumentContent').mockResolvedValue(mockContent);

      const result = await service.classifyDocument('doc3');

      expect(result.tier).toBe(EvidenceTier.TIER_0);
      expect(result.reason).toContain('self-declared');
    });
  });

  describe('Error Handling', () => {
    it('should return TIER_0 fallback when document not found', async () => {
      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(null);

      const result = await service.classifyDocument('nonexistent');

      expect(result.tier).toBe(EvidenceTier.TIER_0);
      expect(result.confidence).toBe(0.0);
      expect(result.reason).toContain('Classification failed');
    });

    it('should return TIER_0 fallback when content fetch fails', async () => {
      const mockDocument = {
        id: 'doc4',
        s3Bucket: 'test-bucket',
        s3Key: 'test.pdf',
        filename: 'test.pdf',
      };

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      vi.spyOn(service as any, 'fetchDocumentContent').mockRejectedValue(
        new Error('Storage error')
      );

      const result = await service.classifyDocument('doc4');

      expect(result.tier).toBe(EvidenceTier.TIER_0);
      expect(result.confidence).toBe(0.0);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after 5 consecutive failures', async () => {
      const mockDocument = {
        id: 'doc5',
        s3Bucket: 'test-bucket',
        s3Key: 'test.pdf',
        filename: 'test.pdf',
      };

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      vi.spyOn(service as any, 'fetchDocumentContent').mockRejectedValue(
        new Error('Persistent error')
      );

      // Trigger 5 failures
      for (let i = 0; i < 5; i++) {
        await service.classifyDocument('doc5');
      }

      // Check circuit breaker state
      expect((service as any).circuitBreaker.state).toBe('OPEN');
      expect((service as any).circuitBreaker.failureCount).toBe(5);
    });

    it('should return fallback immediately when circuit is open', async () => {
      // Force circuit to be open
      (service as any).circuitBreaker = {
        failureCount: 5,
        lastFailureTime: Date.now(),
        state: 'OPEN',
      };

      const mockDocument = {
        id: 'doc6',
        s3Bucket: 'test-bucket',
        s3Key: 'test.pdf',
        filename: 'test.pdf',
      };

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);

      const result = await service.classifyDocument('doc6');

      expect(result.tier).toBe(EvidenceTier.TIER_0);
      expect(result.reason).toContain('Circuit breaker open');
    });

    it('should reset circuit breaker after successful classification', async () => {
      // Set some failures
      (service as any).circuitBreaker.failureCount = 3;

      const mockDocument = {
        id: 'doc7',
        s3Bucket: 'test-bucket',
        s3Key: 'test.csv',
        filename: 'test.csv',
      };

      const mockContent = '"col1","col2"\n"val1","val2"';

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      (service as any).prisma.document.update = vi.fn().mockResolvedValue(mockDocument);
      vi.spyOn(service as any, 'fetchDocumentContent').mockResolvedValue(mockContent);

      await service.classifyDocument('doc7');

      expect((service as any).circuitBreaker.failureCount).toBe(0);
      expect((service as any).circuitBreaker.state).toBe('CLOSED');
    });
  });

  describe('Caching', () => {
    it('should return cached result on second call', async () => {
      const mockDocument = {
        id: 'doc8',
        s3Bucket: 'test-bucket',
        s3Key: 'test.csv',
        filename: 'test.csv',
      };

      const mockContent = '"col1","col2"';

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      (service as any).prisma.document.update = vi.fn().mockResolvedValue(mockDocument);
      const fetchSpy = vi.spyOn(service as any, 'fetchDocumentContent').mockResolvedValue(mockContent);

      // First call
      const result1 = await service.classifyDocument('doc8');

      // Second call should use cache
      const result2 = await service.classifyDocument('doc8');

      expect(result1.tier).toBe(result2.tier);
      expect(result1.reason).toBe(result2.reason);
      // fetchDocumentContent should only be called once (first call)
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should allow cache invalidation', async () => {
      const mockDocument = {
        id: 'doc9',
        s3Bucket: 'test-bucket',
        s3Key: 'test.csv',
        filename: 'test.csv',
      };

      const mockContent = '"col1","col2"';

      (service as any).prisma.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      (service as any).prisma.document.update = vi.fn().mockResolvedValue(mockDocument);
      const fetchSpy = vi.spyOn(service as any, 'fetchDocumentContent').mockResolvedValue(mockContent);

      // First call
      await service.classifyDocument('doc9');

      // Invalidate cache
      service.invalidateCache('doc9');

      // Second call should fetch again
      await service.classifyDocument('doc9');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
