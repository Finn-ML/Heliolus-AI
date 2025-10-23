import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Error occurred" />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('renders submessage when provided', () => {
    render(<ErrorState message="Error" submessage="Please try again later" />);
    expect(screen.getByText('Please try again later')).toBeInTheDocument();
  });

  it('does not render submessage when not provided', () => {
    render(<ErrorState message="Error" />);
    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
  });

  it('has correct ARIA attributes for accessibility', () => {
    const { container } = render(<ErrorState message="Error" />);
    const errorDiv = container.querySelector('[role="alert"]');
    expect(errorDiv).toBeInTheDocument();
    expect(errorDiv).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorState message="Error" onRetry={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState message="Error" />);
    expect(screen.queryByRole('button', { name: /Try Again/i })).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorState message="Error" onRetry={handleRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders retry button with custom label', () => {
    render(<ErrorState message="Error" onRetry={vi.fn()} retryLabel="Reload" />);
    expect(screen.getByRole('button', { name: /Reload/i })).toBeInTheDocument();
  });

  it('renders support link by default', () => {
    render(<ErrorState message="Error" />);
    expect(screen.getByRole('link', { name: /Contact Support/i })).toBeInTheDocument();
  });

  it('does not render support link when showSupport is false', () => {
    render(<ErrorState message="Error" showSupport={false} />);
    expect(screen.queryByRole('link', { name: /Contact Support/i })).not.toBeInTheDocument();
  });

  it('uses default support email', () => {
    render(<ErrorState message="Error" />);
    const link = screen.getByRole('link', { name: /Contact Support/i });
    expect(link).toHaveAttribute('href', 'mailto:support@heliolus.com');
  });

  it('uses custom support email when provided', () => {
    render(<ErrorState message="Error" supportEmail="custom@example.com" />);
    const link = screen.getByRole('link', { name: /Contact Support/i });
    expect(link).toHaveAttribute('href', 'mailto:custom@example.com');
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorState message="Error" className="custom-class" />);
    const errorDiv = container.querySelector('.custom-class');
    expect(errorDiv).toBeInTheDocument();
  });

  it('renders error icon with correct styling', () => {
    const { container } = render(<ErrorState message="Error" />);
    const iconContainer = container.querySelector('.bg-red-100');
    expect(iconContainer).toBeInTheDocument();

    const icon = container.querySelector('.text-red-600');
    expect(icon).toBeInTheDocument();
  });

  it('has correct heading styling', () => {
    render(<ErrorState message="Error occurred" />);
    const heading = screen.getByText('Error occurred');
    expect(heading.tagName).toBe('H3');
    expect(heading).toHaveClass('text-xl');
    expect(heading).toHaveClass('font-semibold');
    expect(heading).toHaveClass('text-gray-900');
  });

  it('renders both retry button and support link when both provided', () => {
    render(<ErrorState message="Error" onRetry={vi.fn()} showSupport />);
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact Support/i })).toBeInTheDocument();
  });

  it('has correct ARIA label on retry button', () => {
    render(<ErrorState message="Error" onRetry={vi.fn()} />);
    const button = screen.getByRole('button', { name: /Try Again/i });
    expect(button).toHaveAttribute('aria-label');
  });
});
