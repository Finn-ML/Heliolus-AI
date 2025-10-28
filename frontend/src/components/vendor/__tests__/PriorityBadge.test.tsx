// Epic 13 - Unit Tests for PriorityBadge Component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../PriorityBadge';

describe('PriorityBadge', () => {
  describe('Rank #1 Priority', () => {
    it('should display #1 Priority badge for boost score of 20', () => {
      render(<PriorityBadge priorityBoost={20} matchedPriority="Transaction Monitoring" />);
      expect(screen.getByText('#1 Priority Match')).toBeInTheDocument();
    });

    it('should display matched priority text for #1', () => {
      render(<PriorityBadge priorityBoost={20} matchedPriority="Transaction Monitoring" />);
      expect(screen.getByText('Transaction Monitoring')).toBeInTheDocument();
    });

    it('should apply gold gradient styling for #1', () => {
      const { container } = render(<PriorityBadge priorityBoost={20} />);
      const badge = container.querySelector('.from-yellow-400\\/20');
      expect(badge).toBeInTheDocument();
    });

    it('should show Star icon for #1', () => {
      const { container } = render(<PriorityBadge priorityBoost={20} />);
      const badge = screen.getByText('#1 Priority Match').closest('span');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Rank #2 Priority', () => {
    it('should display #2 Priority badge for boost score of 15', () => {
      render(<PriorityBadge priorityBoost={15} matchedPriority="KYC/AML" />);
      expect(screen.getByText('#2 Priority Match')).toBeInTheDocument();
    });

    it('should display matched priority text for #2', () => {
      render(<PriorityBadge priorityBoost={15} matchedPriority="KYC/AML" />);
      expect(screen.getByText('KYC/AML')).toBeInTheDocument();
    });

    it('should apply silver gradient styling for #2', () => {
      const { container } = render(<PriorityBadge priorityBoost={15} />);
      const badge = container.querySelector('.from-gray-300\\/20');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Rank #3 Priority', () => {
    it('should display #3 Priority badge for boost score of 10', () => {
      render(<PriorityBadge priorityBoost={10} matchedPriority="Sanctions Screening" />);
      expect(screen.getByText('#3 Priority Match')).toBeInTheDocument();
    });

    it('should display matched priority text for #3', () => {
      render(<PriorityBadge priorityBoost={10} matchedPriority="Sanctions Screening" />);
      expect(screen.getByText('Sanctions Screening')).toBeInTheDocument();
    });

    it('should apply bronze gradient styling for #3', () => {
      const { container } = render(<PriorityBadge priorityBoost={10} />);
      const badge = container.querySelector('.from-amber-600\\/20');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('No Priority Match', () => {
    it('should display "No Priority Match" for boost score of 0', () => {
      render(<PriorityBadge priorityBoost={0} />);
      expect(screen.getByText('No Priority Match')).toBeInTheDocument();
    });

    it('should display "No Priority Match" for unrecognized boost scores', () => {
      render(<PriorityBadge priorityBoost={5} />);
      expect(screen.getByText('No Priority Match')).toBeInTheDocument();
    });

    it('should apply gray styling for no match', () => {
      const { container } = render(<PriorityBadge priorityBoost={0} />);
      const badge = container.querySelector('.bg-gray-600\\/20');
      expect(badge).toBeInTheDocument();
    });

    it('should not display matched priority text when no match', () => {
      render(<PriorityBadge priorityBoost={0} matchedPriority="Something" />);
      expect(screen.queryByText('Something')).not.toBeInTheDocument();
    });
  });

  describe('Optional Priority Text', () => {
    it('should handle missing matchedPriority prop', () => {
      render(<PriorityBadge priorityBoost={20} />);
      expect(screen.getByText('#1 Priority Match')).toBeInTheDocument();
    });

    it('should display priority text when provided', () => {
      render(<PriorityBadge priorityBoost={20} matchedPriority="Custom Priority" />);
      expect(screen.getByText('Custom Priority')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className prop', () => {
      const { container } = render(
        <PriorityBadge priorityBoost={20} className="custom-test-class" />
      );
      const wrapper = container.querySelector('.custom-test-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should maintain base styling with custom className', () => {
      const { container } = render(
        <PriorityBadge priorityBoost={20} className="custom-class" />
      );
      expect(screen.getByText('#1 Priority Match')).toBeInTheDocument();
    });
  });

  describe('Tooltip/Title Support', () => {
    it('should have title attribute when matched priority provided', () => {
      const { container } = render(
        <PriorityBadge priorityBoost={20} matchedPriority="Transaction Monitoring" />
      );
      const badge = container.querySelector('[title]');
      expect(badge).toBeInTheDocument();
      expect(badge?.getAttribute('title')).toBe('Transaction Monitoring');
    });

    it('should have empty title when no matched priority', () => {
      const { container } = render(<PriorityBadge priorityBoost={20} />);
      const badge = container.querySelector('[title]');
      expect(badge).toBeInTheDocument();
      expect(badge?.getAttribute('title')).toBe('');
    });
  });

  describe('Badge Size Variations', () => {
    it('should use larger badge for #1 priority', () => {
      const { container } = render(<PriorityBadge priorityBoost={20} />);
      const badge = container.querySelector('.text-base');
      expect(badge).toBeInTheDocument();
    });

    it('should use smaller badge for #2 and #3 priorities', () => {
      const { container: container2 } = render(<PriorityBadge priorityBoost={15} />);
      const badge2 = container2.querySelector('.text-base');
      expect(badge2).not.toBeInTheDocument();

      const { container: container3 } = render(<PriorityBadge priorityBoost={10} />);
      const badge3 = container3.querySelector('.text-base');
      expect(badge3).not.toBeInTheDocument();
    });
  });
});
