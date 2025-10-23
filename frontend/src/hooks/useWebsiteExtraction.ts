/**
 * Custom hook for AI-powered website extraction
 * Story 2.3: Frontend UI for Website Extraction
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi, queryKeys } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export interface ExtractedField {
  value: any;
  confidence: number; // 0-1
  sources: string[];
  needsReview: boolean; // True if confidence < 0.70
}

export interface WebsiteExtractionResult {
  extractedData: {
    name?: ExtractedField;
    industry?: ExtractedField;
    size?: ExtractedField;
    country?: ExtractedField;
    region?: ExtractedField;
    description?: ExtractedField;
    annualRevenue?: ExtractedField;
    complianceTeamSize?: ExtractedField;
    geography?: ExtractedField;
    riskProfile?: ExtractedField;
  };
  confidence: Record<string, number>;
  metadata: {
    extractionTime: number;
    sourceUrl: string;
    scrapedAt: string;
    sourcesUsed: string[];
    avgConfidence: number;
  };
}

export interface UseWebsiteExtractionOptions {
  onSuccess?: (result: WebsiteExtractionResult) => void;
  onError?: (error: Error) => void;
}

export function useWebsiteExtraction(options?: UseWebsiteExtractionOptions) {
  const [extractionResult, setExtractionResult] = useState<WebsiteExtractionResult | null>(null);
  const queryClient = useQueryClient();

  const extractMutation = useMutation({
    mutationFn: async ({ organizationId, websiteUrl }: { organizationId: string; websiteUrl: string }) => {
      const result = await organizationApi.parseWebsite(organizationId, websiteUrl);
      console.log('[useWebsiteExtraction] API response:', JSON.stringify(result, null, 2));
      console.log('[useWebsiteExtraction] extractedData keys:', result?.extractedData ? Object.keys(result.extractedData) : 'undefined');
      console.log('[useWebsiteExtraction] confidence keys:', result?.confidence ? Object.keys(result.confidence) : 'undefined');
      console.log('[useWebsiteExtraction] metadata:', result?.metadata);
      return result as WebsiteExtractionResult;
    },
    onSuccess: (result) => {
      console.log('[useWebsiteExtraction] onSuccess called with:', JSON.stringify(result, null, 2));
      setExtractionResult(result);

      // Invalidate organization queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.myOrganization });

      // Show success toast with safe access
      const extractedData = result?.extractedData || {};
      const extractedValues = Object.entries(extractedData).filter(([k, v]) => {
        if (v && typeof v === 'object' && 'value' in v) {
          return v.value !== null && v.value !== undefined;
        }
        return v !== null && v !== undefined;
      });
      const fieldCount = extractedValues.length;
      const avgConfidence = result?.metadata?.avgConfidence ?? 0;

      console.log('[useWebsiteExtraction] Field count:', fieldCount, 'Extracted values:', extractedValues.map(([k]) => k));

      toast({
        title: 'Website Analyzed Successfully',
        description: `Extracted ${fieldCount} fields with ${Math.round(avgConfidence * 100)}% average confidence`,
      });

      // Call custom success handler
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
    },
    onError: (error: Error) => {
      console.error('Website extraction failed:', error);

      toast({
        title: 'Website Analysis Failed',
        description: error.message || 'Failed to analyze website. Please try again.',
        variant: 'destructive',
      });

      // Call custom error handler
      if (options?.onError) {
        options.onError(error);
      }
    },
  });

  const extract = async (organizationId: string, websiteUrl: string) => {
    // Normalize URL
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    return extractMutation.mutateAsync({ organizationId, websiteUrl: normalizedUrl });
  };

  const reset = () => {
    setExtractionResult(null);
    extractMutation.reset();
  };

  return {
    extract,
    reset,
    isExtracting: extractMutation.isPending,
    extractionResult,
    error: extractMutation.error,
    isSuccess: extractMutation.isSuccess,
    isError: extractMutation.isError,
  };
}

/**
 * Helper function to get confidence color for UI indicators
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-400';
  if (confidence >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Helper function to get confidence label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High Confidence';
  if (confidence >= 0.6) return 'Medium Confidence';
  return 'Low Confidence - Please Review';
}

/**
 * Helper function to format confidence percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
