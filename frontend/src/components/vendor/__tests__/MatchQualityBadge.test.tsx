// Epic 13 - Unit Tests for MatchQualityBadge Component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchQualityBadge } from '../MatchQualityBadge';

describe('MatchQualityBadge', () => {
  describe('Quality Tier Display', () => {
    it('should display "Highly Relevant" badge for scores >= 120', () => {
      render(<MatchQualityBadge score={125} />);
      expect(screen.getByText('Highly Relevant')).toBeInTheDocument();
    });

    it('should display "Good Match" badge for scores >= 100 and < 120', () => {
      render(<MatchQualityBadge score={105} />);
      expect(screen.getByText('Good Match')).toBeInTheDocument();
    });

    it('should display "Fair Match" badge for scores < 100', () => {
      render(<MatchQualityBadge score={85} />);
      expect(screen.getByText('Fair Match')).toBeInTheDocument();
    });

    it('should handle boundary score of exactly 120', () => {
      render(<MatchQualityBadge score={120} />);
      expect(screen.getByText('Highly Relevant')).toBeInTheDocument();
    });

    it('should handle boundary score of exactly 100', () => {
      render(<MatchQualityBadge score={100} />);
      expect(screen.getByText('Good Match')).toBeInTheDocument();
    });

    it('should handle very low scores', () => {
      render(<MatchQualityBadge score={10} />);
      expect(screen.getByText('Fair Match')).toBeInTheDocument();
    });

    it('should handle score of 0', () => {
      render(<MatchQualityBadge score={0} />);
      expect(screen.getByText('Fair Match')).toBeInTheDocument();
    });
  });

  describe('Color Classes', () => {
    it('should apply green color classes for Highly Relevant', () => {
      const { container } = render(<MatchQualityBadge score={125} />);
      const badge = container.querySelector('.bg-green-500\\/20');
      expect(badge).toBeInTheDocument();
    });

    it('should apply blue color classes for Good Match', () => {
      const { container } = render(<MatchQualityBadge score={105} />);
      const badge = container.querySelector('.bg-blue-500\\/20');
      expect(badge).toBeInTheDocument();
    });

    it('should apply yellow color classes for Fair Match', () => {
      const { container } = render(<MatchQualityBadge score={85} />);
      const badge = container.querySelector('.bg-yellow-500\\/20');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Tooltip Content', () => {
    it('should have tooltip explaining Highly Relevant threshold', () => {
      const { container } = render(<MatchQualityBadge score={125} />);
      const badge = container.querySelector('[title*="Highly Relevant"]');
      expect(badge).toBeInTheDocument();
      expect(badge?.getAttribute('title')).toContain('≥120 points');
      expect(badge?.getAttribute('title')).toContain('Excellent match');
    });

    it('should have tooltip explaining Good Match threshold', () => {
      const { container } = render(<MatchQualityBadge score={105} />);
      const badge = container.querySelector('[title*="Good Match"]');
      expect(badge).toBeInTheDocument();
      expect(badge?.getAttribute('title')).toContain('≥100 points');
      expect(badge?.getAttribute('title')).toContain('Strong alignment');
    });

    it('should have tooltip explaining Fair Match threshold', () => {
      const { container } = render(<MatchQualityBadge score={85} />);
      const badge = container.querySelector('[title*="Fair Match"]');
      expect(badge).toBeInTheDocument();
      expect(badge?.getAttribute('title')).toContain('<100 points');
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className prop', () => {
      const { container } = render(<MatchQualityBadge score={120} className="custom-class" />);
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render badge with proper semantic HTML', () => {
      const { container } = render(<MatchQualityBadge score={120} />);
      // Badge component should render
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have descriptive tooltip for screen readers', () => {
      const { container } = render(<MatchQualityBadge score={120} />);
      const badge = container.querySelector('[title]');
      expect(badge?.getAttribute('title')).toBeTruthy();
    });
  });
});
