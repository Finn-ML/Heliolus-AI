import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import VendorMarketplace from '../VendorMarketplace';
import type { VendorMatchesResponse } from '@/types/vendor-matching.types';
import { assessmentApi } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  assessmentApi: {
    getVendorMatches: vi.fn(),
  },
  queryKeys: {
    vendorMatches: (id: string, threshold?: number) => [
      'assessments',
      id,
      'vendor-matches',
      threshold,
    ],
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const mockVendorMatchesResponse: VendorMatchesResponse = {
  success: true,
  data: {
    matches: [
      {
        vendorId: 'vendor-1',
        vendor: {
          id: 'vendor-1',
          companyName: 'Top Match Vendor',
          categories: ['KYC_AML'],
          targetSegments: [],
          geographicCoverage: [],
          features: [],
          featured: true,
          verified: true,
          reviewCount: 15,
          status: 'ACTIVE',
        },
        baseScore: 85,
        priorityBoost: 35,
        totalScore: 120,
        gapsCovered: 5,
        matchReasons: ['Strong risk coverage', 'Size fit', 'Geographic match'],
      },
      {
        vendorId: 'vendor-2',
        vendor: {
          id: 'vendor-2',
          companyName: 'Good Match Vendor',
          categories: ['TRANSACTION_MONITORING'],
          targetSegments: [],
          geographicCoverage: [],
          features: [],
          featured: false,
          verified: true,
          reviewCount: 8,
          status: 'ACTIVE',
        },
        baseScore: 75,
        priorityBoost: 30,
        totalScore: 105,
        gapsCovered: 3,
        matchReasons: ['Good category alignment'],
      },
      {
        vendorId: 'vendor-3',
        vendor: {
          id: 'vendor-3',
          companyName: 'Fair Match Vendor',
          categories: ['COMPLIANCE_TRAINING'],
          targetSegments: [],
          geographicCoverage: [],
          features: [],
          featured: false,
          verified: false,
          reviewCount: 5,
          status: 'ACTIVE',
        },
        baseScore: 65,
        priorityBoost: 20,
        totalScore: 85,
        gapsCovered: 2,
        matchReasons: ['Meets minimum threshold'],
      },
    ],
    count: 3,
    threshold: 80,
    generatedAt: new Date('2025-10-14'),
  },
};

const mockVendorsResponse = {
  data: [
    {
      id: 'vendor-1',
      companyName: 'Top Match Vendor',
      categories: ['KYC_AML'],
      benefitsSnapshot: 'Leading KYC solution',
      featured: true,
      verified: true,
      status: 'ACTIVE',
      reviewCount: 15,
    },
    {
      id: 'vendor-2',
      companyName: 'Good Match Vendor',
      categories: ['TRANSACTION_MONITORING'],
      benefitsSnapshot: 'Transaction monitoring platform',
      featured: false,
      verified: true,
      status: 'ACTIVE',
      reviewCount: 8,
    },
    {
      id: 'vendor-3',
      companyName: 'Fair Match Vendor',
      categories: ['COMPLIANCE_TRAINING'],
      benefitsSnapshot: 'Training solutions',
      featured: false,
      verified: false,
      status: 'ACTIVE',
      reviewCount: 5,
    },
  ],
};

// Mock fetch for vendors API
global.fetch = vi.fn(url => {
  if (url.includes('/v1/vendors')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVendorsResponse),
    } as Response);
  }
  return Promise.reject(new Error('Unknown URL'));
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('VendorMarketplace - Vendor Matching Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches vendor matches when assessmentId is provided', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(assessmentApi.getVendorMatches).toHaveBeenCalledWith('test-assessment-123', 80, 50);
    });
  });

  it('displays match banner when viewing from assessment', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Viewing Matched Vendors for Your Assessment')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Found 3 vendors matched to your compliance gaps/i)
    ).toBeInTheDocument();
  });

  it('displays match score badges on vendor cards', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Match: 120%/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Match: 105%/i)).toBeInTheDocument();
    expect(screen.getByText(/Match: 85%/i)).toBeInTheDocument();
  });

  it('displays match quality labels', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Highly Relevant')).toBeInTheDocument(); // Score 120
    });

    expect(screen.getByText('Good Match')).toBeInTheDocument(); // Score 105
    expect(screen.getByText('Fair Match')).toBeInTheDocument(); // Score 85
  });

  it('highlights top 3 matches with special badges', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Top 1 Match')).toBeInTheDocument();
    });

    expect(screen.getByText('Top 2 Match')).toBeInTheDocument();
    expect(screen.getByText('Top 3 Match')).toBeInTheDocument();
  });

  it('sorts vendors by match score in descending order', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      const vendorCards = screen.getAllByText(/Match:/);
      expect(vendorCards).toHaveLength(3);
    });

    // Verify order: 120, 105, 85
    const matchScores = screen.getAllByText(/Match: \d+%/);
    expect(matchScores[0]).toHaveTextContent('120%');
    expect(matchScores[1]).toHaveTextContent('105%');
    expect(matchScores[2]).toHaveTextContent('85%');
  });

  it('displays "Show only matched vendors" filter toggle', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Show only matched vendors/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/3 matches/i)).toBeInTheDocument();
  });

  it('filters vendors when "Show only matched" toggle is enabled', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Show only matched vendors/i)).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox', { name: /show only matched/i });
    fireEvent.click(checkbox);

    // All 3 vendors should still be visible (all have score >= 80)
    await waitFor(() => {
      expect(screen.getByText('Top Match Vendor')).toBeInTheDocument();
      expect(screen.getByText('Good Match Vendor')).toBeInTheDocument();
      expect(screen.getByText('Fair Match Vendor')).toBeInTheDocument();
    });
  });

  it('displays match score breakdown section', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getAllByText('Match Score Breakdown')).toHaveLength(3);
    });

    // Check for base score and priority boost (appears multiple times, once per vendor)
    expect(screen.getAllByText(/Base Score/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Priority Boost/i).length).toBeGreaterThan(0);
  });

  it('displays gaps covered count', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockResolvedValue(mockVendorMatchesResponse);

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Covers 5 compliance gaps')).toBeInTheDocument();
    });

    expect(screen.getByText('Covers 3 compliance gaps')).toBeInTheDocument();
    expect(screen.getByText('Covers 2 compliance gaps')).toBeInTheDocument();
  });

  it('shows error banner when priorities questionnaire is missing', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockRejectedValue({
      response: { status: 400 },
      message: 'Priorities questionnaire not completed',
    });

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Make sure you've completed the priorities questionnaire/i)
      ).toBeInTheDocument();
    });
  });

  it('works without assessmentId (shows all vendors without match scores)', async () => {
    render(
      <VendorMarketplace
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Top Match Vendor')).toBeInTheDocument();
    });

    // Should NOT show match scores
    expect(screen.queryByText(/Match:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Highly Relevant')).not.toBeInTheDocument();
  });

  it('does not retry when vendor matches API returns 400 error', async () => {
    vi.mocked(assessmentApi.getVendorMatches).mockRejectedValue({
      response: { status: 400 },
      message: 'Priorities incomplete',
    });

    render(
      <VendorMarketplace
        assessmentId="test-assessment-123"
        selectedVendors={[]}
        onVendorSelect={vi.fn()}
        businessProfile={null}
        riskData={null}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(assessmentApi.getVendorMatches).toHaveBeenCalledTimes(1);
    });

    // Should not retry
    expect(assessmentApi.getVendorMatches).toHaveBeenCalledTimes(1);
  });
});
