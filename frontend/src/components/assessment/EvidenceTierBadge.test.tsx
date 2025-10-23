import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceTierBadge } from './EvidenceTierBadge';
import type { EvidenceTier } from '@/types/evidence-tier.types';

describe('EvidenceTierBadge', () => {
  it('renders TIER_0 with gray color and correct label', () => {
    render(<EvidenceTierBadge tier="TIER_0" />);
    const badge = screen.getByText('Self-Declared');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-gray-500');
  });

  it('renders TIER_1 with blue color and correct label', () => {
    render(<EvidenceTierBadge tier="TIER_1" />);
    const badge = screen.getByText('Policy Documents');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-blue-500');
  });

  it('renders TIER_2 with green color and correct label', () => {
    render(<EvidenceTierBadge tier="TIER_2" />);
    const badge = screen.getByText('System-Generated');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-green-500');
  });

  it('shows confidence percentage when provided', () => {
    render(<EvidenceTierBadge tier="TIER_1" confidence={0.85} />);
    expect(screen.getByText('(85%)')).toBeInTheDocument();
  });

  it('does not show confidence when not provided', () => {
    render(<EvidenceTierBadge tier="TIER_1" />);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });

  it('applies small size variant correctly', () => {
    render(<EvidenceTierBadge tier="TIER_0" size="sm" />);
    const badge = screen.getByText('Self-Declared').parentElement;
    expect(badge).toHaveClass('text-xs');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-0.5');
  });

  it('applies medium size variant correctly (default)', () => {
    render(<EvidenceTierBadge tier="TIER_0" />);
    const badge = screen.getByText('Self-Declared').parentElement;
    expect(badge).toHaveClass('text-sm');
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('py-1');
  });

  it('applies large size variant correctly', () => {
    render(<EvidenceTierBadge tier="TIER_0" size="lg" />);
    const badge = screen.getByText('Self-Declared').parentElement;
    expect(badge).toHaveClass('text-base');
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1.5');
  });

  it('rounds confidence to nearest integer', () => {
    render(<EvidenceTierBadge tier="TIER_2" confidence={0.856} />);
    expect(screen.getByText('(86%)')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<EvidenceTierBadge tier="TIER_1" className="custom-class" />);
    const badge = screen.getByText('Policy Documents').parentElement;
    expect(badge).toHaveClass('custom-class');
  });

  it('handles invalid tier gracefully', () => {
    // Suppress console.warn for this test
    const originalWarn = console.warn;
    console.warn = () => {};

    const { container } = render(<EvidenceTierBadge tier={'INVALID' as EvidenceTier} />);
    expect(container.firstChild).toBeNull();

    console.warn = originalWarn;
  });
});
