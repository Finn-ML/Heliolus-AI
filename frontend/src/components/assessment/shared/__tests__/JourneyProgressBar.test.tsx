import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JourneyProgressBar } from '../JourneyProgressBar';

describe('JourneyProgressBar', () => {
  it('renders progress bar with correct percentage', () => {
    const { container } = render(<JourneyProgressBar current={3} total={10} />);
    const progressBar = container.querySelector('.bg-gradient-to-r');
    expect(progressBar).toBeInTheDocument();
  });

  it('calculates percentage correctly for 30%', () => {
    render(<JourneyProgressBar current={3} total={10} showLabels />);
    expect(screen.getByText('30% Complete')).toBeInTheDocument();
  });

  it('calculates percentage correctly for 50%', () => {
    render(<JourneyProgressBar current={5} total={10} showLabels />);
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('calculates percentage correctly for 100%', () => {
    render(<JourneyProgressBar current={10} total={10} showLabels />);
    expect(screen.getByText('100% Complete')).toBeInTheDocument();
  });

  it('does not show labels by default', () => {
    render(<JourneyProgressBar current={3} total={10} />);
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
    expect(screen.queryByText('Finish')).not.toBeInTheDocument();
  });

  it('shows labels when showLabels is true', () => {
    render(<JourneyProgressBar current={3} total={10} showLabels />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('30% Complete')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <JourneyProgressBar current={3} total={10} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('rounds percentage to nearest integer', () => {
    render(<JourneyProgressBar current={1} total={3} showLabels />);
    expect(screen.getByText('33% Complete')).toBeInTheDocument();
  });

  it('renders with gradient colors', () => {
    const { container } = render(<JourneyProgressBar current={5} total={10} />);
    const progressBar = container.querySelector('.bg-gradient-to-r');
    expect(progressBar).toHaveClass('from-cyan-500');
    expect(progressBar).toHaveClass('to-pink-500');
  });

  it('has correct height', () => {
    const { container } = render(<JourneyProgressBar current={3} total={10} />);
    const barContainer = container.querySelector('.h-2');
    expect(barContainer).toBeInTheDocument();
  });
});
