#!/usr/bin/env node

/**
 * Test AI Document Analysis Service
 *
 * This test verifies that the AI service can correctly extract
 * compliance evidence from document text and score it appropriately.
 *
 * Expected Behavior:
 * - Question about sanctions screening
 * - Clear evidence of automated OFAC/EU/UN screening
 * - Should score 4-5/5 (not 0/5!)
 */

import { AIAnalysisService } from './src/services/ai-analysis.service.ts';

console.log('=== AI Document Analysis Test ===\n');

// Test question (from Financial Crime assessment)
const question = {
  id: 'test-question-001',
  text: "Does your organization have automated sanctions screening across multiple jurisdictions (OFAC, EU, UN, etc.)?",
  aiPromptHint: "Evaluate the organization's sanctions screening capabilities, coverage, and automation level.",
  type: 'BOOLEAN',
  required: true
};

// Sample document content (based on NovaPay Document 6)
const documentText = `
NovaPay Sanctions Screening Program

Overview:
Our sanctions screening program provides comprehensive coverage across multiple jurisdictions
to ensure compliance with international sanctions requirements.

Screening Coverage:
- Office of Foreign Assets Control (OFAC) - US Treasury
- European Union Sanctions List
- United Nations Security Council Consolidated List
- UK HM Treasury Sanctions List
- Additional country-specific lists (Canada, Australia, etc.)

Automation & Technology:
- Real-time automated screening for all new customer onboarding
- Batch screening of existing customer base performed weekly
- Daily automated updates from authoritative sanctions list sources
- Integration with core banking system for transaction screening

Alert Management:
- Defined SLAs for alert review and resolution
- Tiered alert workflow (Level 1, Level 2, Level 3 review)
- False positive management and tuning
- Escalation procedures for confirmed matches

Known Issues:
- Some alert fatigue noted due to common name matches
- Average resolution time: 2.3 hours (target: 2 hours)
- Backlog of 47 alerts pending Level 2 review

Last Audit: March 2024
Audit Result: Satisfactory with minor recommendations
`.trim();

// Sample documents (matching DatabaseDocument structure)
const documents = [
  {
    id: 'test-doc-001',
    filename: 'NovaPay - Sanctions Screening Program.pdf',
    parsedContent: {
      text: documentText,
      metadata: {
        pageCount: 3,
        extractedAt: new Date().toISOString()
      }
    }
  }
];

// Organization profile context
const organizationProfile = {
  name: "NovaPay",
  companySize: "MEDIUM",
  industry: "Financial Services",
  geography: "EMEA"
};

console.log('📋 Test Question:');
console.log(`   ${question.text}\n`);

console.log('📄 Document Evidence:');
console.log(`   Length: ${documentText.length} characters`);
console.log(`   Preview: ${documentText.substring(0, 150)}...\n`);

console.log('📦 Documents being passed:');
console.log(`   Count: ${documents.length}`);
documents.forEach((doc, i) => {
  console.log(`   [${i+1}] ${doc.filename}`);
  console.log(`       Has parsedContent: ${!!doc.parsedContent}`);
  if (doc.parsedContent) {
    console.log(`       Has .text field: ${!!(doc.parsedContent as any).text}`);
    console.log(`       Text length: ${(doc.parsedContent as any).text?.length || 0} chars`);
  }
});
console.log();

console.log('🤖 Calling AI Analysis Service...\n');

try {
  const aiService = new AIAnalysisService();

  const response = await aiService.analyzeQuestion(
    question,
    documents,
    undefined, // websiteContent
    organizationProfile
  );

  const result = response.data;

  console.log('✅ AI Analysis Complete\n');
  console.log('🔍 Evidence Details:');
  console.log(`   Evidence Count: ${result.evidence.length}`);
  result.evidence.forEach((ev, i) => {
    console.log(`   [${i+1}] Source: ${ev.source}`);
    console.log(`       Relevance: ${(ev.relevance * 100).toFixed(1)}%`);
    console.log(`       Content Preview: ${ev.content.substring(0, 100)}...`);
  });
  console.log();
  console.log('=== RESULTS ===\n');
  console.log(`Score: ${result.score}/5`);
  console.log(`\nExplanation:\n${result.explanation}\n`);

  if (result.sourceReference) {
    console.log(`Source Reference: ${result.sourceReference}`);
  }

  if (result.evidenceTier) {
    console.log(`Evidence Tier: ${result.evidenceTier}`);
  }

  if (result.confidence) {
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  }

  console.log('\n=== EVALUATION ===\n');

  // Evaluate the result
  if (result.score === 0) {
    console.log('❌ FAILURE: Score is 0/5');
    console.log('   Problem: AI did not find evidence despite clear documentation');
    console.log('   This is the bug we need to fix!\n');
    process.exit(1);
  } else if (result.score >= 4) {
    console.log('✅ SUCCESS: Score is 4-5/5');
    console.log('   AI correctly identified strong sanctions screening program');
    console.log('   Evidence extraction working as expected\n');
    process.exit(0);
  } else if (result.score >= 2) {
    console.log('⚠️  PARTIAL: Score is 2-3/5');
    console.log('   AI found some evidence but may be missing details');
    console.log('   Needs investigation\n');
    process.exit(0);
  } else {
    console.log('❌ FAILURE: Score is 1/5');
    console.log('   AI barely detected evidence despite clear documentation');
    console.log('   This indicates a problem\n');
    process.exit(1);
  }

} catch (error) {
  console.log('❌ ERROR: AI Analysis Failed\n');
  console.log(`Error Type: ${error.name}`);
  console.log(`Error Message: ${error.message}`);

  if (error.stack) {
    console.log('\nStack Trace:');
    console.log(error.stack);
  }

  console.log('\n=== DIAGNOSTIC INFO ===\n');
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);

  if (process.env.OPENAI_API_KEY) {
    const key = process.env.OPENAI_API_KEY;
    console.log(`Key Prefix: ${key.substring(0, 10)}...`);
    console.log(`Key Length: ${key.length} characters`);
  }

  console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);

  process.exit(1);
}
