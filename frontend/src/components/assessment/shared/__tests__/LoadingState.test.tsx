import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
  it('renders with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingState message="Custom loading message" />);
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('renders submessage when provided', () => {
    render(<LoadingState message="Loading" submessage="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('does not render submessage when not provided', () => {
    render(<LoadingState message="Loading" />);
    expect(screen.queryByText(/wait/i)).not.toBeInTheDocument();
  });

  it('has correct ARIA attributes for accessibility', () => {
    const { container } = render(<LoadingState />);
    const loadingDiv = container.querySelector('[role="status"]');
    expect(loadingDiv).toBeInTheDocument();
    expect(loadingDiv).toHaveAttribute('aria-live', 'polite');
    expect(loadingDiv).toHaveAttribute('aria-busy', 'true');
  });

  it('renders spinner with correct size - small', () => {
    const { container } = render(<LoadingState size="sm" />);
    const spinner = container.querySelector('.w-6.h-6');
    expect(spinner).toBeInTheDocument();
  });

  it('renders spinner with correct size - medium (default)', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('.w-10.h-10');
    expect(spinner).toBeInTheDocument();
  });

  it('renders spinner with correct size - large', () => {
    const { container } = render(<LoadingState size="lg" />);
    const spinner = container.querySelector('.w-16.h-16');
    expect(spinner).toBeInTheDocument();
  });

  it('spinner has animate-spin class', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('spinner has cyan color', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('.text-cyan-500');
    expect(spinner).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingState className="custom-class" />);
    const loadingDiv = container.querySelector('.custom-class');
    expect(loadingDiv).toBeInTheDocument();
  });

  it('applies min-height when fullScreen is true', () => {
    const { container } = render(<LoadingState fullScreen />);
    const loadingDiv = container.querySelector('.min-h-\\[400px\\]');
    expect(loadingDiv).toBeInTheDocument();
  });

  it('wraps in JourneyStepContainer when fullScreen is true', () => {
    const { container } = render(<LoadingState fullScreen />);
    // Check for container wrapper classes
    const wrapper = container.querySelector('.max-w-6xl');
    expect(wrapper).toBeInTheDocument();
  });

  it('does not wrap in JourneyStepContainer when fullScreen is false', () => {
    const { container } = render(<LoadingState fullScreen={false} />);
    // Check that max-w class is not present
    const wrapper = container.querySelector('.max-w-6xl');
    expect(wrapper).not.toBeInTheDocument();
  });

  it('has screen reader text', () => {
    render(<LoadingState message="Loading content" />);
    const srText = document.querySelector('.sr-only');
    expect(srText).toHaveTextContent('Loading content');
  });
});
