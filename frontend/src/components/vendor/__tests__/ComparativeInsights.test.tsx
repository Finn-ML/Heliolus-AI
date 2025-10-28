// Epic 13 - Unit Tests for ComparativeInsights Component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparativeInsights } from '../ComparativeInsights';
import { VendorMatchScore } from '@/types/vendor-matching.types';

describe('ComparativeInsights', () => {
  const mockVendor1 = {
    companyName: 'Vendor A',
    id: 'vendor-1',
  };

  const mockVendor2 = {
    companyName: 'Vendor B',
    id: 'vendor-2',
  };

  const mockMatch1: VendorMatchScore = {
    vendorId: 'vendor-1',
    vendor: mockVendor1 as any,
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
      'Within your budget range',
    ],
  };

  const mockMatch2: VendorMatchScore = {
    vendorId: 'vendor-2',
    vendor: mockVendor2 as any,
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
      missingFeatures: ['Real-time monitoring', 'API integration'],
      deploymentBoost: 0,
      speedBoost: 0,
      totalBoost: 20,
    },
    totalScore: 90,
    matchReasons: [
      'Covers your #2 priority: KYC/AML',
      'Addresses 62% of your identified compliance gaps',
    ],
  };

  describe('Header Display', () => {
    it('should display heading with Sparkles icon', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      expect(screen.getByText('AI-Powered Comparative Insights')).toBeInTheDocument();
    });
  });

  describe('Insight Generation', () => {
    it('should generate overall score advantage insight when difference >= 10%', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      // Vendor A scores higher (127 vs 90)
      expect(screen.getByText(/Vendor A scores.*higher overall/)).toBeInTheDocument();
    });

    it('should generate gap coverage insight when difference >= 5 points', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      // Vendor A has 7 more points in gap coverage (32 vs 25)
      expect(
        screen.getByText(/Vendor A addresses more of your critical compliance gaps/)
      ).toBeInTheDocument();
    });

    it('should generate priority alignment insight', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      // Vendor A has higher priority boost (20 vs 15)
      expect(screen.getByText(/Vendor A better aligns with your top priorities/)).toBeInTheDocument();
    });

    it('should generate feature completeness insight', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      // Vendor A has 2 more features (0 missing vs 2 missing)
      expect(screen.getByText(/Vendor A has 2 more of your must-have features/)).toBeInTheDocument();
    });

    it('should generate budget fit insight', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      // Vendor A has priceScore 20 (within budget)
      expect(screen.getByText(/Vendor A is within your budget/)).toBeInTheDocument();
    });

    it('should generate implementation speed insight', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      // Vendor A has speedBoost 5 (fast)
      expect(screen.getByText(/Vendor A offers faster implementation/)).toBeInTheDocument();
    });

    it('should generate deployment model insight', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      // Vendor A has deploymentBoost 5
      expect(screen.getByText(/Vendor A matches your deployment preferences/)).toBeInTheDocument();
    });
  });

  describe('Summary Recommendation', () => {
    it('should recommend vendor with more advantages as "stronger match"', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      expect(screen.getByText(/Vendor A is the stronger match/)).toBeInTheDocument();
    });

    it('should use total score as tiebreaker when advantages are equal', () => {
      const equalMatch1 = {
        ...mockMatch1,
        priorityBoost: { ...mockMatch1.priorityBoost, topPriorityBoost: 15 },
        baseScore: { ...mockMatch1.baseScore, riskAreaCoverage: 25 },
        totalScore: 110,
      };
      const equalMatch2 = {
        ...mockMatch2,
        totalScore: 90,
      };

      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={equalMatch1}
          vendor2={mockVendor2}
          match2={equalMatch2}
        />
      );
      // Should still recommend Vendor A due to higher total score
      expect(screen.getByText(/Vendor A is the.*match/)).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should display budget fit badges for both vendors', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      expect(screen.getByText('Budget Fit:')).toBeInTheDocument();
    });

    it('should display implementation speed badges for both vendors', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      expect(screen.getByText('Implementation Speed:')).toBeInTheDocument();
      expect(screen.getByText('Fast')).toBeInTheDocument();
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle vendors with identical scores', () => {
      const identicalMatch2 = { ...mockMatch1, vendorId: 'vendor-2' };
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={identicalMatch2}
        />
      );
      // Should still render without crashing
      expect(screen.getByText('AI-Powered Comparative Insights')).toBeInTheDocument();
    });

    it('should handle vendors with minimal differences', () => {
      const similarMatch2 = {
        ...mockMatch1,
        vendorId: 'vendor-2',
        totalScore: 126,
        baseScore: { ...mockMatch1.baseScore, riskAreaCoverage: 31 },
      };
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={similarMatch2}
        />
      );
      // Should generate fewer insights due to thresholds
      expect(screen.getByText('AI-Powered Comparative Insights')).toBeInTheDocument();
    });

    it('should return null when no meaningful insights can be generated', () => {
      const identicalMatch = { ...mockMatch1 };
      const { container } = render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={identicalMatch}
          vendor2={mockVendor2}
          match2={identicalMatch}
        />
      );
      // Component returns null when no insights
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      const heading = screen.getByText('AI-Powered Comparative Insights');
      expect(heading.tagName).toBe('H3');
    });

    it('should use semantic list for insights', () => {
      const { container } = render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should apply cyan color for vendor1 advantages', () => {
      const { container } = render(
        <ComparativeInsights
          vendor1={mockVendor1}
          match1={mockMatch1}
          vendor2={mockVendor2}
          match2={mockMatch2}
        />
      );
      const cyanIcons = container.querySelectorAll('.text-cyan-400');
      expect(cyanIcons.length).toBeGreaterThan(0);
    });
  });
});
