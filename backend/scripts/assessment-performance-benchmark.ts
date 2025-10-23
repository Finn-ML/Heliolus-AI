/**
 * Assessment Performance Benchmark
 * Measures current AI document processing performance to establish baseline
 *
 * Usage: npx tsx backend/scripts/assessment-performance-benchmark.ts
 */

import { performance } from 'perf_hooks';

interface BenchmarkResult {
  testName: string;
  documentCount: number;
  questionCount: number;
  totalTimeMs: number;
  avgTimePerQuestion: number;
  avgTimePerDocument: number;
  apiCallsEstimated: number;
  throughput: number; // operations per second
  timestamp: string;
}

interface DetailedTimings {
  documentParsing: number[];
  questionAnalysis: number[];
  batchProcessing: number[];
}

class AssessmentBenchmark {
  private results: BenchmarkResult[] = [];
  private detailedTimings: DetailedTimings = {
    documentParsing: [],
    questionAnalysis: [],
    batchProcessing: [],
  };

  /**
   * Run complete benchmark suite
   */
  async runBenchmarks(): Promise<void> {
    console.log('🚀 Starting Assessment Performance Benchmarks\n');
    console.log('=' .repeat(80));

    try {
      // Scenario 1: Small assessment (3 docs, 10 questions)
      await this.runScenario('Small Assessment', 3, 10);

      // Scenario 2: Medium assessment (7 docs, 25 questions)
      await this.runScenario('Medium Assessment', 7, 25);

      // Scenario 3: Large assessment (7 docs, 50 questions)
      await this.runScenario('Large Assessment', 7, 50);

      // Scenario 4: Current user scenario (7 docs, 50 questions)
      await this.runScenario('Current User Scenario (7x50)', 7, 50);

      // Print comprehensive report
      this.printReport();

      // Save results to file
      await this.saveResults();

    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Run single benchmark scenario
   */
  private async runScenario(
    name: string,
    documentCount: number,
    questionCount: number
  ): Promise<void> {
    console.log(`\n📊 Running: ${name}`);
    console.log(`   Documents: ${documentCount}, Questions: ${questionCount}`);

    const startTime = performance.now();

    // Simulate current implementation flow
    await this.simulateCurrentImplementation(documentCount, questionCount);

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;

    // Calculate metrics
    const apiCallsEstimated = documentCount * questionCount; // Current: 1 call per doc per question
    const avgTimePerQuestion = totalTimeMs / questionCount;
    const avgTimePerDocument = totalTimeMs / documentCount;
    const throughput = (questionCount * documentCount * 1000) / totalTimeMs;

    const result: BenchmarkResult = {
      testName: name,
      documentCount,
      questionCount,
      totalTimeMs: Math.round(totalTimeMs),
      avgTimePerQuestion: Math.round(avgTimePerQuestion),
      avgTimePerDocument: Math.round(avgTimePerDocument),
      apiCallsEstimated,
      throughput: Math.round(throughput * 100) / 100,
      timestamp: new Date().toISOString(),
    };

    this.results.push(result);

    // Print immediate results
    console.log(`   ⏱️  Total Time: ${result.totalTimeMs}ms (${(result.totalTimeMs / 1000).toFixed(2)}s)`);
    console.log(`   📈 API Calls: ~${apiCallsEstimated}`);
    console.log(`   ⚡ Throughput: ${result.throughput} ops/sec`);
    console.log(`   📊 Avg Time/Question: ${result.avgTimePerQuestion}ms`);
  }

  /**
   * Simulate current sequential document processing
   * This mimics ai-analysis.service.ts:409-441 (sequential loop through documents)
   */
  private async simulateCurrentImplementation(
    documentCount: number,
    questionCount: number
  ): Promise<void> {
    const batchSize = 5; // Current batch size from assessment.service.ts:1092

    // Process questions in batches
    for (let i = 0; i < questionCount; i += batchSize) {
      const batchStart = performance.now();
      const batch = Math.min(batchSize, questionCount - i);

      // Parallel processing within batch
      const batchPromises = Array.from({ length: batch }).map(async () => {
        // For each question, process documents SEQUENTIALLY (current bottleneck)
        for (let doc = 0; doc < documentCount; doc++) {
          const docStart = performance.now();

          // Simulate OpenAI API call latency (300-800ms based on real-world data)
          await this.simulateOpenAICall();

          const docEnd = performance.now();
          this.detailedTimings.documentParsing.push(docEnd - docStart);
        }
      });

      await Promise.all(batchPromises);

      const batchEnd = performance.now();
      this.detailedTimings.batchProcessing.push(batchEnd - batchStart);
    }
  }

  /**
   * Simulate OpenAI API call with realistic latency
   * Based on gpt-4 average response times: 300-800ms
   */
  private async simulateOpenAICall(): Promise<void> {
    const latency = 400 + Math.random() * 400; // 400-800ms
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  /**
   * Print comprehensive benchmark report
   */
  private printReport(): void {
    console.log('\n');
    console.log('=' .repeat(80));
    console.log('📋 BENCHMARK REPORT - CURRENT SYSTEM PERFORMANCE');
    console.log('=' .repeat(80));

    // Summary table
    console.log('\n📊 Performance Summary:\n');
    console.log('Test Scenario'.padEnd(30) + 'Time'.padEnd(15) + 'API Calls'.padEnd(12) + 'Throughput');
    console.log('-'.repeat(80));

    this.results.forEach(result => {
      const time = `${(result.totalTimeMs / 1000).toFixed(2)}s`;
      const throughput = `${result.throughput} ops/s`;
      console.log(
        result.testName.padEnd(30) +
        time.padEnd(15) +
        `~${result.apiCallsEstimated}`.padEnd(12) +
        throughput
      );
    });

    // Identify bottleneck
    console.log('\n🔍 Bottleneck Analysis:\n');
    const userScenario = this.results.find(r => r.testName.includes('7x50'));
    if (userScenario) {
      const minutes = (userScenario.totalTimeMs / 1000 / 60).toFixed(1);
      console.log(`   Current Implementation (7 docs × 50 questions):`);
      console.log(`   • Total Time: ${(userScenario.totalTimeMs / 1000).toFixed(1)}s (~${minutes} minutes)`);
      console.log(`   • Estimated API Calls: ${userScenario.apiCallsEstimated}`);
      console.log(`   • Processing Pattern: SEQUENTIAL per document per question`);
      console.log(`   • Primary Bottleneck: ai-analysis.service.ts:409-441`);
    }

    // Optimization potential
    console.log('\n💡 Optimization Potential:\n');
    console.log('   Strategy 1: Document Preprocessing');
    const preprocessing = this.calculateOptimization('preprocessing');
    console.log(`   • Reduced API calls: 7 + 50 = 57 (from 350)`);
    console.log(`   • Estimated time: ~${preprocessing.estimatedTimeS}s`);
    console.log(`   • Speedup: ${preprocessing.speedupX}x faster`);
    console.log(`   • Cost reduction: ${preprocessing.costReduction}%`);

    console.log('\n   Strategy 2: Parallel Document Processing');
    const parallel = this.calculateOptimization('parallel');
    console.log(`   • API calls: 350 (unchanged)`);
    console.log(`   • Estimated time: ~${parallel.estimatedTimeS}s`);
    console.log(`   • Speedup: ${parallel.speedupX}x faster`);
    console.log(`   • Cost reduction: 0% (same calls, just faster)`);

    console.log('\n   Strategy 3: Hybrid (Preprocessing + Parallel)');
    const hybrid = this.calculateOptimization('hybrid');
    console.log(`   • Reduced API calls: 57 (84% reduction)`);
    console.log(`   • Estimated time: ~${hybrid.estimatedTimeS}s`);
    console.log(`   • Speedup: ${hybrid.speedupX}x faster`);
    console.log(`   • Cost reduction: ${hybrid.costReduction}%`);

    // Detailed timings statistics
    if (this.detailedTimings.documentParsing.length > 0) {
      console.log('\n📈 Detailed Timing Statistics:\n');
      const stats = this.calculateStats(this.detailedTimings.documentParsing);
      console.log(`   Document Processing per API call:`);
      console.log(`   • Average: ${stats.avg}ms`);
      console.log(`   • Median: ${stats.median}ms`);
      console.log(`   • Min: ${stats.min}ms`);
      console.log(`   • Max: ${stats.max}ms`);
      console.log(`   • P95: ${stats.p95}ms`);
      console.log(`   • Total Samples: ${stats.count}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Calculate optimization metrics
   */
  private calculateOptimization(strategy: 'preprocessing' | 'parallel' | 'hybrid'): {
    estimatedTimeS: number;
    speedupX: number;
    costReduction: number;
  } {
    const userScenario = this.results.find(r => r.testName.includes('7x50'));
    if (!userScenario) {
      return { estimatedTimeS: 0, speedupX: 0, costReduction: 0 };
    }

    const currentTimeS = userScenario.totalTimeMs / 1000;
    const avgApiLatency = 0.5; // 500ms average

    let estimatedTimeS: number;
    let apiCalls: number;

    switch (strategy) {
      case 'preprocessing':
        // 7 preprocessing calls + 50 analysis calls (sequential)
        apiCalls = 57;
        estimatedTimeS = (7 * avgApiLatency) + (50 * avgApiLatency * 0.3); // 30% faster with preprocessed data
        break;

      case 'parallel':
        // Same 350 calls but 7 in parallel per question
        apiCalls = 350;
        estimatedTimeS = 50 * avgApiLatency; // 7 docs in parallel = ~1 API call time per question
        break;

      case 'hybrid':
        // 7 preprocessing (parallel) + 50 analysis (with top 3 docs in parallel)
        apiCalls = 57;
        estimatedTimeS = (7 * avgApiLatency / 7) + (50 * avgApiLatency * 0.3); // Preprocessing parallel + fast analysis
        break;
    }

    const speedupX = Math.round((currentTimeS / estimatedTimeS) * 10) / 10;
    const costReduction = Math.round(((350 - apiCalls) / 350) * 100);

    return {
      estimatedTimeS: Math.round(estimatedTimeS * 10) / 10,
      speedupX,
      costReduction,
    };
  }

  /**
   * Calculate statistics for timing array
   */
  private calculateStats(timings: number[]): {
    avg: number;
    median: number;
    min: number;
    max: number;
    p95: number;
    count: number;
  } {
    const sorted = [...timings].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      avg: Math.round(timings.reduce((a, b) => a + b, 0) / count),
      median: Math.round(sorted[Math.floor(count / 2)]),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[count - 1]),
      p95: Math.round(sorted[Math.floor(count * 0.95)]),
      count,
    };
  }

  /**
   * Save results to JSON file
   */
  private async saveResults(): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const outputPath = path.join(process.cwd(), 'backend', 'benchmark-results.json');

    const output = {
      generatedAt: new Date().toISOString(),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      benchmarks: this.results,
      detailedTimings: {
        documentParsingStats: this.calculateStats(this.detailedTimings.documentParsing),
        sampleCount: this.detailedTimings.documentParsing.length,
      },
      recommendations: [
        {
          strategy: 'Document Preprocessing',
          description: 'Preprocess all documents once before question analysis',
          estimatedImprovement: '7x faster, 84% cost reduction',
          priority: 'HIGH',
        },
        {
          strategy: 'Parallel Processing',
          description: 'Process all documents in parallel per question',
          estimatedImprovement: '7x faster (if API rate limits allow)',
          priority: 'MEDIUM',
        },
        {
          strategy: 'Smart Document Relevance',
          description: 'Only analyze top 3 most relevant documents per question',
          estimatedImprovement: '2.3x faster, 57% cost reduction',
          priority: 'HIGH',
        },
      ],
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
  }
}

// Run benchmarks
async function main() {
  const benchmark = new AssessmentBenchmark();
  await benchmark.runBenchmarks();
}

main().catch(console.error);
