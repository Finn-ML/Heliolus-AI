// Epic 13 - Integration Tests for VendorComparison Component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import VendorComparison from '../VendorComparison';

// Mock getCurrentUserId
vi.mock('@/lib/api', () => ({
  getCurrentUserId: vi.fn(() => 'test-user-id'),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('VendorComparison Integration Tests', () => {
  let queryClient: QueryClient;

  const mockVendorWithoutMatch = {
    id: 'vendor-1',
    companyName: 'Test Vendor A',
    logo: 'https://example.com/logo-a.png',
    rating: 4.5,
    reviewCount: 100,
    categories: ['KYC_AML', 'TRANSACTION_MONITORING'],
  };

  const mockVendorWithMatch = {
    ...mockVendorWithoutMatch,
    matchDetails: {
      vendorId: 'vendor-1',
      vendor: mockVendorWithoutMatch,
      baseScore: {
        riskAreaCoverage: 32,
        sizeFit: 20,
        geoCoverage: 15,
        priceScore: 20,
        totalBase: 87,
      },
      priorityBoost: {
        vendorId: 'vendor-1',
        topPriorityBoost: 20,
        matchedPriority: 'Transaction Monitoring',
        featureBoost: 10,
        missingFeatures: [],
        deploymentBoost: 5,
        speedBoost: 5,
        totalBoost: 40,
      },
      totalScore: 127,
      matchReasons: [
        'Covers your #1 priority: Transaction Monitoring',
        'Addresses 80% of your identified compliance gaps',
      ],
    },
  };

  const mockVendor2WithMatch = {
    id: 'vendor-2',
    companyName: 'Test Vendor B',
    logo: 'https://example.com/logo-b.png',
    rating: 4.2,
    reviewCount: 85,
    categories: ['SANCTIONS_SCREENING'],
    matchDetails: {
      vendorId: 'vendor-2',
      vendor: { id: 'vendor-2', companyName: 'Test Vendor B' },
      baseScore: {
        riskAreaCoverage: 25,
        sizeFit: 15,
        geoCoverage: 20,
        priceScore: 10,
        totalBase: 70,
      },
      priorityBoost: {
        vendorId: 'vendor-2',
        topPriorityBoost: 15,
        matchedPriority: 'KYC/AML',
        featureBoost: 5,
        missingFeatures: ['Real-time monitoring'],
        deploymentBoost: 0,
        speedBoost: 0,
        totalBoost: 20,
      },
      totalScore: 90,
      matchReasons: ['Covers your #2 priority: KYC/AML'],
    },
  };

  const mockOnBack = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  describe('Free User Experience', () => {
    beforeEach(() => {
      // Mock free user (no token or free plan)
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { plan: 'FREE', status: 'ACTIVE' } }),
        } as Response)
      );
      localStorage.setItem('token', 'test-token');
    });

    it('should render static comparison for free users', async () => {
      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithoutMatch, { ...mockVendorWithoutMatch, id: 'vendor-2' }]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Vendor Intelligence Matrix')).toBeInTheDocument();
      });
    });

    it('should show upgrade banner for free users', async () => {
      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithoutMatch, { ...mockVendorWithoutMatch, id: 'vendor-2' }]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Unlock Premium Comparison')).toBeInTheDocument();
      });
    });

    it('should allow dismissing upgrade banner', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithoutMatch, { ...mockVendorWithoutMatch, id: 'vendor-2' }]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Unlock Premium Comparison')).toBeInTheDocument();
      });

      const dismissButton = screen.getByText('Maybe Later');
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('Unlock Premium Comparison')).not.toBeInTheDocument();
      });

      // Check localStorage was set
      expect(localStorage.getItem('dismissedPremiumComparisonBanner')).toBe('true');
    });

    it('should not show banner if previously dismissed', async () => {
      localStorage.setItem('dismissedPremiumComparisonBanner', 'true');

      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithoutMatch, { ...mockVendorWithoutMatch, id: 'vendor-2' }]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Unlock Premium Comparison')).not.toBeInTheDocument();
      });
    });
  });

  describe('Premium User Experience', () => {
    beforeEach(() => {
      // Mock premium user
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { plan: 'PREMIUM', status: 'ACTIVE' } }),
        } as Response)
      );
      localStorage.setItem('token', 'test-token');
    });

    it('should render premium comparison when user is premium and has match data', async () => {
      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AI-Powered Vendor Comparison')).toBeInTheDocument();
        expect(screen.getByText('Premium Intelligence')).toBeInTheDocument();
      });
    });

    it('should display match scores for both vendors', async () => {
      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('127')).toBeInTheDocument();
        expect(screen.getByText('90')).toBeInTheDocument();
      });
    });

    it('should display match quality badges', async () => {
      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Highly Relevant').length).toBeGreaterThan(0);
      });
    });

    it('should highlight higher-scoring vendor', async () => {
      const { container } = renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        const bestMatchBadges = screen.getAllByText('Best Match');
        expect(bestMatchBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display comparative insights', async () => {
      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AI-Powered Comparative Insights')).toBeInTheDocument();
      });
    });

    it('should not show upgrade banner for premium users', async () => {
      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Unlock Premium Comparison')).not.toBeInTheDocument();
      });
    });
  });

  describe('Enterprise User Experience', () => {
    beforeEach(() => {
      // Mock enterprise user
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { plan: 'ENTERPRISE', status: 'ACTIVE' } }),
        } as Response)
      );
      localStorage.setItem('token', 'test-token');
    });

    it('should treat enterprise users same as premium users', async () => {
      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AI-Powered Vendor Comparison')).toBeInTheDocument();
        expect(screen.getByText('Premium Intelligence')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should fallback to static view when premium user has no match data', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { plan: 'PREMIUM', status: 'ACTIVE' } }),
        } as Response)
      );
      localStorage.setItem('token', 'test-token');

      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithoutMatch, { ...mockVendorWithoutMatch, id: 'vendor-2' }]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Vendor Intelligence Matrix')).toBeInTheDocument();
      });
    });

    it('should handle billing API failure gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      );
      localStorage.setItem('token', 'test-token');

      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithoutMatch, { ...mockVendorWithoutMatch, id: 'vendor-2' }]}
          onBack={mockOnBack}
        />
      );

      // Should default to free tier
      await waitFor(() => {
        expect(screen.getByText('Vendor Intelligence Matrix')).toBeInTheDocument();
      });
    });

    it('should handle missing authentication gracefully', async () => {
      localStorage.removeItem('token');

      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithoutMatch, { ...mockVendorWithoutMatch, id: 'vendor-2' }]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Vendor Intelligence Matrix')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should call onBack when Back button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithoutMatch, { ...mockVendorWithoutMatch, id: 'vendor-2' }]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        const backButton = screen.getByText('Back to Marketplace');
        expect(backButton).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Marketplace');
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render without errors on mobile viewport', async () => {
      global.innerWidth = 375;

      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Vendor/)).toBeInTheDocument();
      });
    });

    it('should render without errors on desktop viewport', async () => {
      global.innerWidth = 1920;

      renderWithProviders(
        <VendorComparison
          vendors={[mockVendorWithMatch, mockVendor2WithMatch]}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Vendor/)).toBeInTheDocument();
      });
    });
  });
});
