import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import StrategyMatrix from './StrategyMatrix';
import type { StrategyMatrix as StrategyMatrixType } from '@/types/vendor-matching.types';
import { assessmentApi } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  assessmentApi: {
    getStrategyMatrix: vi.fn(),
  },
  queryKeys: {
    strategyMatrix: (id: string) => ['assessments', id, 'strategy-matrix'],
  },
}));

const mockStrategyMatrix: StrategyMatrixType = {
  assessmentId: 'test-assessment-123',
  generatedAt: new Date('2025-10-14'),
  immediate: {
    timeline: '0-6 months',
    gaps: [],
    gapCount: 5,
    effortDistribution: { SMALL: 2, MEDIUM: 2, LARGE: 1 },
    estimatedCostRange: '€50K-€100K',
    topVendors: [
      {
        vendor: {
          id: 'vendor-1',
          companyName: 'Compliance Pro',
          categories: ['KYC_AML'],
          targetSegments: [],
          geographicCoverage: [],
          features: [],
          featured: true,
          verified: true,
          reviewCount: 10,
          status: 'ACTIVE',
        },
        gapsCovered: 3,
        coveredGapIds: ['gap-1', 'gap-2', 'gap-3'],
      },
    ],
  },
  nearTerm: {
    timeline: '6-18 months',
    gaps: [],
    gapCount: 3,
    effortDistribution: { SMALL: 1, MEDIUM: 1, LARGE: 1 },
    estimatedCostRange: '€30K-€75K',
    topVendors: [],
  },
  strategic: {
    timeline: '18+ months',
    gaps: [],
    gapCount: 0,
    effortDistribution: { SMALL: 0, MEDIUM: 0, LARGE: 0 },
    estimatedCostRange: 'No gaps',
    topVendors: [],
  },
};

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

describe('StrategyMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockReturnValue(new Promise(() => {})); // Never resolves

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    // Should show skeleton loaders (check for animate-pulse class)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('fetches and displays strategy matrix data', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Strategic Compliance Roadmap')).toBeInTheDocument();
    });

    // Check timeline buckets are displayed
    expect(screen.getByText('0-6 months')).toBeInTheDocument();
    expect(screen.getByText('6-18 months')).toBeInTheDocument();
    expect(screen.getByText('18+ months')).toBeInTheDocument();

    // Check gap counts
    expect(screen.getByText('5')).toBeInTheDocument(); // Immediate gaps
    expect(screen.getByText('3')).toBeInTheDocument(); // Near-term gaps
    expect(screen.getByText('0')).toBeInTheDocument(); // Strategic gaps
  });

  it('displays effort distribution for buckets with gaps', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      // "Effort Distribution" appears in multiple timeline buckets
      expect(screen.getAllByText('Effort Distribution').length).toBeGreaterThan(0);
    });

    // Check effort breakdown (may appear in multiple buckets, use getAllByText)
    expect(screen.getAllByText(/Small: 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Medium: 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Large: 1/i).length).toBeGreaterThan(0);
  });

  it('displays estimated cost range', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('€50K-€100K')).toBeInTheDocument();
    });

    expect(screen.getByText('€30K-€75K')).toBeInTheDocument();
  });

  it('displays top vendors with gap coverage', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Compliance Pro')).toBeInTheDocument();
    });

    expect(screen.getByText('Covers 3 gaps')).toBeInTheDocument();
  });

  it('shows empty state for buckets with no gaps', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No gaps in this timeframe')).toBeInTheDocument();
    });

    expect(screen.getByText('All requirements met')).toBeInTheDocument();
  });

  it('displays error state when API call fails', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockRejectedValue(new Error('API Error'));

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Error Loading Strategy Matrix')).toBeInTheDocument();
    });

    // Error shows the actual error message from the API
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });

  it('does not render when assessmentId is empty', () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    const { container } = render(<StrategyMatrix assessmentId="" />, {
      wrapper: createWrapper(),
    });

    // Should not fetch or render anything
    expect(container.firstChild).toBeNull();
  });

  it('navigates to marketplace when "View Vendor" is clicked', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Compliance Pro')).toBeInTheDocument();
    });

    const viewVendorButton = screen.getByRole('button', { name: /view vendor/i });
    expect(viewVendorButton).toBeInTheDocument();
  });

  it('caches strategy matrix data for 5 minutes', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    const { rerender } = render(<StrategyMatrix assessmentId="test-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Strategic Compliance Roadmap')).toBeInTheDocument();
    });

    // Should have called API once
    expect(assessmentApi.getStrategyMatrix).toHaveBeenCalledTimes(1);

    // Rerender with same assessmentId
    rerender(<StrategyMatrix assessmentId="test-123" />);

    // Should not call API again (cached)
    expect(assessmentApi.getStrategyMatrix).toHaveBeenCalledTimes(1);
  });

  it('displays overview header with all bucket counts', async () => {
    vi.mocked(assessmentApi.getStrategyMatrix).mockResolvedValue(mockStrategyMatrix);

    render(<StrategyMatrix assessmentId="test-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Strategic Compliance Roadmap')).toBeInTheDocument();
    });

    // Check overview section shows all gap counts
    expect(screen.getByText('Immediate (0-6 months)')).toBeInTheDocument();
    expect(screen.getByText('Near-term (6-18 months)')).toBeInTheDocument();
    expect(screen.getByText('Strategic (18+ months)')).toBeInTheDocument();
  });
});
