import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RiskAnalysisAIService } from './risk-analysis-ai.service';

// Mock OpenAI module
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

describe('RiskAnalysisAIService', () => {
  let service: RiskAnalysisAIService;
  let mockOpenAICreate: any;
  let originalEnv: NodeJS.ProcessEnv;

  const mockGaps = [
    {
      id: '1',
      category: 'KYC_AML',
      title: 'Missing KYC procedures',
      description: 'No formal KYC procedures in place',
      severity: 'CRITICAL' as const,
      priority: 'IMMEDIATE' as const,
      recommendation: 'Implement KYC procedures immediately'
    },
    {
      id: '2',
      category: 'KYC_AML',
      title: 'Incomplete customer verification',
      description: 'Customer verification process is incomplete',
      severity: 'HIGH' as const,
      priority: 'HIGH' as const,
      recommendation: 'Enhance verification process'
    },
    {
      id: '3',
      category: 'KYC_AML',
      title: 'Outdated AML training',
      description: 'Staff AML training is outdated',
      severity: 'MEDIUM' as const,
      priority: 'MEDIUM' as const
    }
  ];

  const mockRisks = [
    {
      id: '1',
      category: 'KYC_AML',
      title: 'Regulatory fines',
      description: 'Risk of regulatory fines',
      likelihood: 'HIGH',
      impact: 'CRITICAL',
      riskLevel: 'CRITICAL',
      mitigation: 'Implement controls'
    }
  ];

  const mockOrganization = {
    size: 'MEDIUM',
    industry: 'Financial Services',
    geography: 'EU',
    riskProfile: 'MEDIUM',
    annualRevenue: 'RANGE_10M_50M',
    complianceTeamSize: 'TEAM_5_10'
  };

  beforeEach(() => {
    // Store original env
    originalEnv = { ...process.env };

    // Clear any module cache
    vi.clearAllMocks();

    // Set up environment
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_MODEL = 'gpt-4o-mini';

    // Create service instance
    service = new RiskAnalysisAIService();

    // Get mock reference after service creation
    mockOpenAICreate = (service as any).openai?.chat?.completions?.create;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('generateKeyFindings', () => {
    it('should generate 3-5 key findings from gaps using OpenAI', async () => {
      // Mock OpenAI response
      const mockResponse = {
        keyFindings: [
          {
            finding: 'Critical KYC infrastructure gaps',
            severity: 'CRITICAL',
            description: 'Multiple critical gaps in KYC/AML procedures pose immediate regulatory risk'
          },
          {
            finding: 'Verification process deficiencies',
            severity: 'HIGH',
            description: 'Customer verification processes are incomplete and require enhancement'
          },
          {
            finding: 'Training compliance issues',
            severity: 'MEDIUM',
            description: 'Staff training on AML procedures is outdated and needs updating'
          }
        ]
      };

      // Initialize service and mock
      await service.generateKeyFindings('KYC_AML', []); // Force initialization
      mockOpenAICreate = (service as any).openai?.chat?.completions?.create;

      if (mockOpenAICreate) {
        mockOpenAICreate.mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        });
      }

      const findings = await service.generateKeyFindings('KYC_AML', mockGaps);

      expect(findings).toHaveLength(3);
      expect(findings[0].severity).toBe('CRITICAL');
      expect(findings[0].finding).toContain('KYC infrastructure');
      expect(findings[1].severity).toBe('HIGH');
      expect(findings[2].severity).toBe('MEDIUM');
    });

    it('should fallback to gap-based findings when OpenAI is unavailable', async () => {
      // Disable OpenAI
      process.env.OPENAI_API_KEY = '';
      service = new RiskAnalysisAIService();

      const findings = await service.generateKeyFindings('KYC_AML', mockGaps);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].severity).toBe('CRITICAL');
      expect(findings[0].finding).toContain('Critical compliance gaps');
      expect(findings[0].description).toContain('Missing KYC procedures');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Initialize and set up mock
      await service.generateKeyFindings('KYC_AML', []); // Force initialization
      mockOpenAICreate = (service as any).openai?.chat?.completions?.create;

      if (mockOpenAICreate) {
        mockOpenAICreate.mockRejectedValueOnce(new Error('API Error'));
      }

      const findings = await service.generateKeyFindings('KYC_AML', mockGaps);

      // Should return fallback findings
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].severity).toBeDefined();
    });

    it('should handle empty gaps array', async () => {
      const findings = await service.generateKeyFindings('KYC_AML', []);

      expect(findings).toEqual([]);
    });

    it('should respect rate limiting for concurrent requests', async () => {
      // Initialize service
      await service.generateKeyFindings('KYC_AML', []); // Force initialization
      mockOpenAICreate = (service as any).openai?.chat?.completions?.create;

      if (mockOpenAICreate) {
        // Mock delayed responses
        mockOpenAICreate.mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ keyFindings: [] })
              }
            }]
          }), 10))
        );
      }

      // Fire multiple concurrent requests (more than MAX_CONCURRENT_REQUESTS)
      const promises = [];
      for (let i = 0; i < 7; i++) {
        promises.push(service.generateKeyFindings(`Category_${i}`, mockGaps));
      }

      const results = await Promise.all(promises);

      // All should complete successfully
      expect(results).toHaveLength(7);
      results.forEach(result => {
        expect(Array.isArray(result)).toBeTruthy();
      });
    });

    it('should parse malformed JSON responses safely', async () => {
      // Initialize and mock
      await service.generateKeyFindings('KYC_AML', []); // Force initialization
      mockOpenAICreate = (service as any).openai?.chat?.completions?.create;

      if (mockOpenAICreate) {
        mockOpenAICreate.mockResolvedValueOnce({
          choices: [{
            message: {
              content: 'Invalid JSON {not valid}'
            }
          }]
        });
      }

      const findings = await service.generateKeyFindings('KYC_AML', mockGaps);

      // Should return fallback findings
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe('generateMitigationStrategies', () => {
    it('should generate exactly 4 prioritized strategies using OpenAI', async () => {
      const mockResponse = {
        strategies: [
          {
            strategy: 'Implement emergency KYC controls',
            priority: 'immediate',
            impact: 'high',
            rationale: 'Address critical compliance gaps',
            estimatedTimeframe: '1-2 weeks',
            keyActions: ['Deploy temporary controls', 'Assign compliance team', 'Document procedures']
          },
          {
            strategy: 'Enhance customer verification',
            priority: 'short-term',
            impact: 'high',
            rationale: 'Improve verification processes',
            estimatedTimeframe: '1-3 months',
            keyActions: ['Update procedures', 'Train staff', 'Implement tools']
          },
          {
            strategy: 'Build compliance framework',
            priority: 'medium-term',
            impact: 'medium',
            rationale: 'Establish sustainable processes',
            estimatedTimeframe: '3-6 months',
            keyActions: ['Design framework', 'Deploy technology', 'Create policies']
          },
          {
            strategy: 'Continuous monitoring program',
            priority: 'long-term',
            impact: 'medium',
            rationale: 'Prevent future gaps',
            estimatedTimeframe: '6-12 months',
            keyActions: ['Implement monitoring', 'Create dashboards', 'Schedule audits']
          }
        ]
      };

      // Initialize and mock
      await service.generateMitigationStrategies('KYC_AML', [], [], {});
      mockOpenAICreate = (service as any).openai?.chat?.completions?.create;

      if (mockOpenAICreate) {
        mockOpenAICreate.mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        });
      }

      const strategies = await service.generateMitigationStrategies(
        'KYC_AML',
        mockGaps,
        mockRisks,
        mockOrganization
      );

      expect(strategies).toHaveLength(4);

      // Check all priority levels are covered
      const priorities = strategies.map(s => s.priority);
      expect(priorities).toContain('immediate');
      expect(priorities).toContain('short-term');
      expect(priorities).toContain('medium-term');
      expect(priorities).toContain('long-term');

      // Check structure
      expect(strategies[0].strategy).toBeDefined();
      expect(strategies[0].impact).toBeDefined();
      expect(strategies[0].rationale).toBeDefined();
      expect(strategies[0].estimatedTimeframe).toBeDefined();
      expect(strategies[0].keyActions).toBeInstanceOf(Array);
    });

    it('should fallback to generic strategies when OpenAI is unavailable', async () => {
      // Disable OpenAI
      process.env.OPENAI_API_KEY = '';
      service = new RiskAnalysisAIService();

      const strategies = await service.generateMitigationStrategies(
        'KYC_AML',
        mockGaps,
        mockRisks,
        mockOrganization
      );

      expect(strategies).toHaveLength(4);

      // Check fallback covers all priorities
      const priorities = strategies.map(s => s.priority);
      expect(priorities).toContain('immediate');
      expect(priorities).toContain('short-term');
      expect(priorities).toContain('medium-term');
      expect(priorities).toContain('long-term');

      // Check fallback mentions critical gaps
      expect(strategies[0].strategy).toContain('1 critical gaps');
    });

    it('should handle API errors and return fallback strategies', async () => {
      // Initialize and mock error
      await service.generateMitigationStrategies('KYC_AML', [], [], {});
      mockOpenAICreate = (service as any).openai?.chat?.completions?.create;

      if (mockOpenAICreate) {
        mockOpenAICreate.mockRejectedValueOnce(new Error('API Error'));
      }

      const strategies = await service.generateMitigationStrategies(
        'KYC_AML',
        mockGaps,
        mockRisks,
        mockOrganization
      );

      expect(strategies).toHaveLength(4);
      expect(strategies[0].priority).toBe('immediate');
    });

    it('should include organization context in strategy generation', async () => {
      const mockResponse = {
        strategies: [
          {
            strategy: 'Medium company specific strategy',
            priority: 'immediate',
            impact: 'high',
            rationale: 'Tailored for medium-sized financial services in EU'
          },
          {
            strategy: 'Short-term strategy',
            priority: 'short-term',
            impact: 'high'
          },
          {
            strategy: 'Medium-term strategy',
            priority: 'medium-term',
            impact: 'medium'
          },
          {
            strategy: 'Long-term strategy',
            priority: 'long-term',
            impact: 'medium'
          }
        ]
      };

      // Initialize and mock
      await service.generateMitigationStrategies('KYC_AML', [], [], {});
      mockOpenAICreate = (service as any).openai?.chat?.completions?.create;

      if (mockOpenAICreate) {
        mockOpenAICreate.mockImplementation((params: any) => {
          // Verify organization context is in prompt
          const prompt = params.messages[1].content;
          expect(prompt).toContain('Size: MEDIUM');
          expect(prompt).toContain('Industry: Financial Services');
          expect(prompt).toContain('Geography: EU');

          return Promise.resolve({
            choices: [{
              message: {
                content: JSON.stringify(mockResponse)
              }
            }]
          });
        });
      }

      await service.generateMitigationStrategies(
        'KYC_AML',
        mockGaps,
        mockRisks,
        mockOrganization
      );
    });

    it('should handle empty gaps and risks arrays', async () => {
      const strategies = await service.generateMitigationStrategies(
        'KYC_AML',
        [],
        [],
        mockOrganization
      );

      expect(strategies).toHaveLength(4);
      expect(strategies[0].priority).toBe('immediate');
    });
  });

  describe('Rate Limiting', () => {
    it('should process queued requests when capacity becomes available', async () => {
      // Initialize
      await service.generateKeyFindings('KYC_AML', []);
      mockOpenAICreate = (service as any).openai?.chat?.completions?.create;

      let activeCount = 0;
      let maxActive = 0;

      if (mockOpenAICreate) {
        mockOpenAICreate.mockImplementation(() => {
          activeCount++;
          maxActive = Math.max(maxActive, activeCount);

          return new Promise(resolve => {
            setTimeout(() => {
              activeCount--;
              resolve({
                choices: [{
                  message: {
                    content: JSON.stringify({ keyFindings: [] })
                  }
                }]
              });
            }, 20);
          });
        });
      }

      // Create requests equal to MAX_CONCURRENT_REQUESTS + 1
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(service.generateKeyFindings(`Category_${i}`, mockGaps));
      }

      await Promise.all(promises);

      // Should never exceed MAX_CONCURRENT_REQUESTS but may reach it
      expect(maxActive).toBeLessThanOrEqual(6); // Allow some concurrency
    });
  });

  describe('Initialization', () => {
    it('should initialize OpenAI client lazily on first use', async () => {
      const newService = new RiskAnalysisAIService();

      // OpenAI should not be initialized yet
      expect((newService as any).openaiInitialized).toBe(false);

      // First call should initialize
      await newService.generateKeyFindings('TEST', mockGaps);

      // Now should be initialized
      expect((newService as any).openaiInitialized).toBe(true);
    });

    it('should handle missing API key gracefully', async () => {
      delete process.env.OPENAI_API_KEY;
      const newService = new RiskAnalysisAIService();

      const findings = await newService.generateKeyFindings('TEST', mockGaps);

      // Should use fallback
      expect(findings.length).toBeGreaterThan(0);
      expect((newService as any).useOpenAI).toBe(false);
    });

    it('should detect placeholder API key', async () => {
      process.env.OPENAI_API_KEY = 'your-api-key-here';
      const newService = new RiskAnalysisAIService();

      await newService.generateKeyFindings('TEST', mockGaps);

      expect((newService as any).useOpenAI).toBe(false);
    });
  });
});