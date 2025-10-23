/**
 * Vendor Library for Heliolus Platform
 * Mock implementation for development
 */

// Mock exports
export const vendorManager = {
  getProfile: async () => ({ success: true, data: null }),
  updateProfile: async () => ({ success: true, data: null }),
};

export const marketplaceService = {
  search: async () => ({ success: true, data: [] }),
  filter: async () => ({ success: true, data: [] }),
};

// Mock functions
export const analyzeVendorFit = (vendorData: any, gapData: any): any => {
  return {
    score: Math.floor(Math.random() * 100),
    reasoning: ['Mock vendor fit analysis'],
    compatibility: 'HIGH',
  };
};

export const calculateVendorScore = (vendorData: any): number => {
  return Math.floor(Math.random() * 100);
};

export const searchVendors = async (criteria: any): Promise<any[]> => {
  return [
    {
      id: 'vendor-1',
      name: 'Mock Vendor',
      score: 85,
      category: 'KYC_AML',
    },
  ];
};

export const generateVendorRecommendations = (gapData: any): any[] => {
  return [
    {
      vendorId: 'vendor-1',
      score: 85,
      reasoning: ['Perfect fit for your requirements'],
    },
  ];
};

export const matchVendorsToGap = (gapData: any, vendors: any[]): any[] => {
  return vendors.map(vendor => ({
    ...vendor,
    matchScore: Math.floor(Math.random() * 100),
    reasoning: ['Mock vendor match'],
  }));
};

export const calculateMatchScore = (vendorData: any, gapData: any): number => {
  return Math.floor(Math.random() * 100);
};

export const rankVendorMatches = (matches: any[]): any[] => {
  return matches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
};

// Mock types
export type VendorManager = typeof vendorManager;
export type MarketplaceService = typeof marketplaceService;

// Configuration
export const VENDOR_CONFIG = {
  matching: {
    minCompatibilityScore: 60,
    maxRecommendations: 15,
    weightsProfile: {
      functionalFit: 0.35,
      industryExperience: 0.25,
      companySize: 0.15,
      pricing: 0.15,
      reputation: 0.10
    },
    boostFactors: {
      verified: 1.2,
      featured: 1.1,
      highRating: 1.15
    }
  },
  search: {
    resultsPerPage: 20,
    maxSearchResults: 100,
    fuzzySearchThreshold: 0.6,
    cacheTimeMinutes: 15
  },
  scoring: {
    weights: {
      gapAlignment: 0.30,
      solutionMaturity: 0.25,
      vendorReputation: 0.20,
      costBenefit: 0.15,
      implementation: 0.10
    },
    penalties: {
      noIndustryExperience: 0.8,
      wrongCompanySize: 0.7,
      noReferences: 0.9
    },
    bonuses: {
      perfectMatch: 1.3,
      multiGapSolution: 1.2,
      quickImplementation: 1.1
    }
  },
  marketplace: {
    featuredVendorSlots: 6,
    newVendorBoostDays: 30,
    popularityDecayDays: 90,
    qualityScoreMinimum: 70
  }
} as const;