import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyNavigation } from '../JourneyNavigation';

describe('JourneyNavigation', () => {
  it('renders continue button with default label', () => {
    render(<JourneyNavigation onContinue={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument();
  });

  it('renders continue button with custom label', () => {
    render(<JourneyNavigation onContinue={vi.fn()} continueLabel="Next Step" />);
    expect(screen.getByRole('button', { name: /Next Step/ })).toBeInTheDocument();
  });

  it('calls onContinue when continue button clicked', () => {
    const handleContinue = vi.fn();
    render(<JourneyNavigation onContinue={handleContinue} />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('disables continue button when canContinue is false', () => {
    render(<JourneyNavigation onContinue={vi.fn()} canContinue={false} />);
    const button = screen.getByRole('button', { name: /Continue/ });
    expect(button).toBeDisabled();
  });

  it('enables continue button when canContinue is true', () => {
    render(<JourneyNavigation onContinue={vi.fn()} canContinue={true} />);
    const button = screen.getByRole('button', { name: /Continue/ });
    expect(button).not.toBeDisabled();
  });

  it('renders back button when onBack is provided', () => {
    render(<JourneyNavigation onBack={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Back/ })).toBeInTheDocument();
  });

  it('does not render back button when onBack is not provided', () => {
    render(<JourneyNavigation onContinue={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Back/ })).not.toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const handleBack = vi.fn();
    render(<JourneyNavigation onBack={handleBack} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders back button with custom label', () => {
    render(<JourneyNavigation onBack={vi.fn()} onContinue={vi.fn()} backLabel="Previous" />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<JourneyNavigation onContinue={vi.fn()} isLoading />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<JourneyNavigation onBack={vi.fn()} onContinue={vi.fn()} isLoading />);
    expect(screen.getByRole('button', { name: /Loading/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Back/ })).toBeDisabled();
  });

  it('renders save draft button when showSaveDraft is true', () => {
    render(<JourneyNavigation onContinue={vi.fn()} showSaveDraft onSaveDraft={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Save Draft/ })).toBeInTheDocument();
  });

  it('does not render save draft button by default', () => {
    render(<JourneyNavigation onContinue={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Save Draft/ })).not.toBeInTheDocument();
  });

  it('calls onSaveDraft when save draft button clicked', () => {
    const handleSaveDraft = vi.fn();
    render(<JourneyNavigation onContinue={vi.fn()} showSaveDraft onSaveDraft={handleSaveDraft} />);
    fireEvent.click(screen.getByRole('button', { name: /Save Draft/ }));
    expect(handleSaveDraft).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <JourneyNavigation onContinue={vi.fn()} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has gradient styling on continue button', () => {
    render(<JourneyNavigation onContinue={vi.fn()} />);
    const button = screen.getByRole('button', { name: /Continue/ });
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-cyan-500');
    expect(button).toHaveClass('to-pink-500');
  });
});
