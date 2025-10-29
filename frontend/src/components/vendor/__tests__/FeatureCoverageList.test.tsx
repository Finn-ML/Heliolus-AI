// Epic 13 - Unit Tests for FeatureCoverageList Component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureCoverageList } from '../FeatureCoverageList';

describe('FeatureCoverageList', () => {
  describe('Coverage Display', () => {
    it('should display feature coverage heading', () => {
      render(<FeatureCoverageList missingFeatures={[]} />);
      expect(screen.getByText('Feature Coverage')).toBeInTheDocument();
    });

    it('should calculate and display coverage percentage', () => {
      render(<FeatureCoverageList missingFeatures={['Feature 1', 'Feature 2']} />);
      // 8/10 = 80%
      expect(screen.getByText('8/10 features')).toBeInTheDocument();
      expect(screen.getByText('80% coverage')).toBeInTheDocument();
    });

    it('should handle 100% coverage', () => {
      render(<FeatureCoverageList missingFeatures={[]} />);
      expect(screen.getByText('10/10 features')).toBeInTheDocument();
      expect(screen.getByText('100% coverage')).toBeInTheDocument();
    });

    it('should handle 0% coverage', () => {
      const allMissing = Array(10).fill('Missing Feature');
      render(<FeatureCoverageList missingFeatures={allMissing} />);
      expect(screen.getByText('0/10 features')).toBeInTheDocument();
      expect(screen.getByText('0% coverage')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should render progress bar', () => {
      const { container } = render(<FeatureCoverageList missingFeatures={['Feature 1']} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should apply green styling for high coverage (>=80%)', () => {
      const { container } = render(<FeatureCoverageList missingFeatures={['Feature 1']} />);
      const progress = container.querySelector('.bg-green-900\\/30');
      expect(progress).toBeInTheDocument();
    });

    it('should apply yellow styling for medium coverage (>=60%, <80%)', () => {
      const { container } = render(
        <FeatureCoverageList missingFeatures={['F1', 'F2', 'F3', 'F4']} />
      );
      const progress = container.querySelector('.bg-yellow-900\\/30');
      expect(progress).toBeInTheDocument();
    });

    it('should apply red styling for low coverage (<60%)', () => {
      const { container } = render(
        <FeatureCoverageList missingFeatures={['F1', 'F2', 'F3', 'F4', 'F5', 'F6']} />
      );
      const progress = container.querySelector('.bg-red-900\\/30');
      expect(progress).toBeInTheDocument();
    });
  });

  describe('Missing Features Display', () => {
    it('should display list of missing features', () => {
      render(
        <FeatureCoverageList
          missingFeatures={['Real-time monitoring', 'API integration', 'Custom reports']}
        />
      );
      expect(screen.getByText('Missing Features:')).toBeInTheDocument();
      expect(screen.getByText('Real-time monitoring')).toBeInTheDocument();
      expect(screen.getByText('API integration')).toBeInTheDocument();
      expect(screen.getByText('Custom reports')).toBeInTheDocument();
    });

    it('should show XCircle icons for missing features', () => {
      const { container } = render(
        <FeatureCoverageList missingFeatures={['Feature 1', 'Feature 2']} />
      );
      const icons = container.querySelectorAll('.text-red-400');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should handle single missing feature', () => {
      render(<FeatureCoverageList missingFeatures={['Single Feature']} />);
      expect(screen.getByText('Missing Features:')).toBeInTheDocument();
      expect(screen.getByText('Single Feature')).toBeInTheDocument();
    });
  });

  describe('All Features Available State', () => {
    it('should show success message when no features missing', () => {
      render(<FeatureCoverageList missingFeatures={[]} />);
      expect(screen.getByText('All features available')).toBeInTheDocument();
    });

    it('should show CheckCircle icon for all features available', () => {
      const { container } = render(<FeatureCoverageList missingFeatures={[]} />);
      const icon = container.querySelector('.text-green-400');
      expect(icon).toBeInTheDocument();
    });

    it('should not show missing features section when all available', () => {
      render(<FeatureCoverageList missingFeatures={[]} />);
      expect(screen.queryByText('Missing Features:')).not.toBeInTheDocument();
    });
  });

  describe('Custom Must-Have Features', () => {
    it('should use custom total when mustHaveFeatures provided', () => {
      const customFeatures = ['F1', 'F2', 'F3', 'F4', 'F5'];
      render(
        <FeatureCoverageList
          missingFeatures={['F1']}
          mustHaveFeatures={customFeatures}
        />
      );
      expect(screen.getByText('4/5 features')).toBeInTheDocument();
      expect(screen.getByText('80% coverage')).toBeInTheDocument();
    });

    it('should default to 10 features when mustHaveFeatures not provided', () => {
      render(<FeatureCoverageList missingFeatures={['Feature 1']} />);
      expect(screen.getByText('9/10 features')).toBeInTheDocument();
    });

    it('should handle empty mustHaveFeatures array', () => {
      render(<FeatureCoverageList missingFeatures={[]} mustHaveFeatures={[]} />);
      // Should default to 10
      expect(screen.getByText('10/10 features')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty missing features array', () => {
      render(<FeatureCoverageList missingFeatures={[]} />);
      expect(screen.getByText('100% coverage')).toBeInTheDocument();
    });

    it('should handle more missing features than total', () => {
      const tooManyMissing = Array(15).fill('Missing');
      render(<FeatureCoverageList missingFeatures={tooManyMissing} />);
      // Should show negative matched count as 0 implicitly
      expect(screen.getByText(/-5\/10 features/)).toBeInTheDocument();
    });

    it('should handle very long feature names', () => {
      const longFeature =
        'Very Long Feature Name That Should Still Be Displayed Correctly Without Breaking Layout';
      render(<FeatureCoverageList missingFeatures={[longFeature]} />);
      expect(screen.getByText(longFeature)).toBeInTheDocument();
    });

    it('should handle special characters in feature names', () => {
      render(<FeatureCoverageList missingFeatures={['Feature & <Integration>']} />);
      expect(screen.getByText('Feature & <Integration>')).toBeInTheDocument();
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className prop', () => {
      const { container } = render(
        <FeatureCoverageList missingFeatures={[]} className="custom-class" />
      );
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading', () => {
      render(<FeatureCoverageList missingFeatures={[]} />);
      const heading = screen.getByText('Feature Coverage');
      expect(heading.tagName).toBe('H4');
    });

    it('should use list elements for missing features', () => {
      const { container } = render(
        <FeatureCoverageList missingFeatures={['Feature 1', 'Feature 2']} />
      );
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(2);
    });

    it('should have proper ARIA roles for progress bar', () => {
      const { container } = render(<FeatureCoverageList missingFeatures={['Feature 1']} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should use consistent icon sizing', () => {
      const { container } = render(
        <FeatureCoverageList missingFeatures={['Feature 1', 'Feature 2']} />
      );
      const icons = container.querySelectorAll('.h-4');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should apply proper spacing between items', () => {
      const { container } = render(
        <FeatureCoverageList missingFeatures={['Feature 1', 'Feature 2']} />
      );
      const list = container.querySelector('.space-y-1');
      expect(list).toBeInTheDocument();
    });
  });
});
