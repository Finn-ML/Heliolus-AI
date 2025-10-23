/**
 * Document Flow Happy Path Test
 * Tests the complete end-to-end document workflow:
 * 1. Get upload URL
 * 2. Confirm upload (triggers analysis)
 * 3. Perform AI analysis
 * 4. Retrieve document with results
 */

import { test, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import documentRoutes from '../../src/routes/document.routes';
// Mock AWS services\nconst mockS3Service = {\n  mockResolvedValueOnce: (value: any) => Promise.resolve(value)\n};\n\nconst mockAIService = {\n  mockResolvedValueOnce: (value: any) => Promise.resolve(value)\n};

let server: FastifyInstance;

beforeEach(async () => {
  server = Fastify();
  
  // Register document routes
  await server.register(documentRoutes, { prefix: '/v1/documents' });
  
  await server.ready();
});

afterEach(async () => {
  await server.close();
});

test('Happy Path: Complete document upload and analysis flow', async () => {
  const testDocument = {
    filename: 'test-policy.pdf',
    contentType: 'application/pdf',
    organizationId: 'org-123',
    documentType: 'COMPLIANCE_POLICY',
  };

  // Step 1: Get upload URL
  console.log('Step 1: Getting upload URL...');
  const uploadUrlResponse = await server.inject({
    method: 'POST',
    url: '/v1/documents/upload-url',
    payload: testDocument,
  });

  expect(uploadUrlResponse.statusCode).toBe(200);
  const uploadData = JSON.parse(uploadUrlResponse.payload);
  expect(uploadData).toHaveProperty('uploadUrl');
  expect(uploadData).toHaveProperty('documentId');
  expect(uploadData).toHaveProperty('fields');

  const documentId = uploadData.documentId;

  // Step 2: Simulate S3 upload completion and confirm upload
  console.log('Step 2: Confirming upload...');
  mockS3Service.mockResolvedValueOnce({
    success: true,
    data: { size: 1024, contentType: 'application/pdf' }
  });

  const confirmResponse = await server.inject({
    method: 'POST',
    url: `/v1/documents/${documentId}/confirm-upload`,
    payload: {
      key: `documents/${documentId}/test-policy.pdf`,
      bucket: 'test-bucket',
    },
  });

  expect(confirmResponse.statusCode).toBe(200);
  const confirmData = JSON.parse(confirmResponse.payload);
  expect(confirmData).toHaveProperty('status', 'UPLOADED');

  // Step 3: Perform AI analysis
  console.log('Step 3: Performing AI analysis...');
  mockAIService.mockResolvedValueOnce({
    success: true,
    data: {
      analysisResults: {
        complianceScore: 85,
        riskLevel: 'MEDIUM',
        findings: ['Missing data retention policy', 'Good encryption standards'],
        recommendations: ['Add data retention clause', 'Update access controls'],
      },
      confidence: 0.92,
    }
  });

  const analyzeResponse = await server.inject({
    method: 'POST',
    url: `/v1/documents/${documentId}/analyze`,
    payload: {
      analysisType: 'COMPLIANCE_REVIEW',
      extractText: true,
      detectEntities: true,
    },
  });

  expect(analyzeResponse.statusCode).toBe(200);
  const analyzeData = JSON.parse(analyzeResponse.payload);
  expect(analyzeData).toHaveProperty('analysisResults');
  expect(analyzeData.analysisResults).toHaveProperty('complianceScore', 85);
  expect(analyzeData.analysisResults).toHaveProperty('riskLevel', 'MEDIUM');

  // Step 4: Retrieve document with complete analysis results
  console.log('Step 4: Retrieving document with results...');
  const getResponse = await server.inject({
    method: 'GET',
    url: `/v1/documents/${documentId}`,
  });

  expect(getResponse.statusCode).toBe(200);
  const documentData = JSON.parse(getResponse.payload);
  expect(documentData).toHaveProperty('id', documentId);
  expect(documentData).toHaveProperty('filename', testDocument.filename);
  expect(documentData).toHaveProperty('documentType', testDocument.documentType);
  expect(documentData).toHaveProperty('status', 'ANALYZED');
  expect(documentData).toHaveProperty('analysisResults');
  expect(documentData.analysisResults).toHaveProperty('complianceScore', 85);

  // Step 5: Verify download URL works
  console.log('Step 5: Testing download URL...');
  const downloadResponse = await server.inject({
    method: 'GET',
    url: `/v1/documents/${documentId}/download-url`,
  });

  expect(downloadResponse.statusCode).toBe(200);
  const downloadData = JSON.parse(downloadResponse.payload);
  expect(downloadData).toHaveProperty('downloadUrl');
  expect(downloadData.downloadUrl).toMatch(/^https:\/\//);
  expect(downloadData).toHaveProperty('expiresAt');

  console.log('✅ Happy path test completed successfully!');
});

test('Happy Path: Document stats workflow', async () => {
  const orgId = 'org-123';

  // Get document statistics
  const statsResponse = await server.inject({
    method: 'GET',
    url: `/v1/documents/organizations/${orgId}/documents/stats`,
  });

  expect(statsResponse.statusCode).toBe(200);
  const statsData = JSON.parse(statsResponse.payload);
  expect(statsData).toHaveProperty('totalDocuments');
  expect(statsData).toHaveProperty('totalSize');
  expect(statsData).toHaveProperty('documentsByType');
  expect(typeof statsData.totalDocuments).toBe('number');
  expect(typeof statsData.totalSize).toBe('number');
  expect(typeof statsData.documentsByType).toBe('object');
});