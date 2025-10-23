import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EvidenceTierExplanation } from './EvidenceTierExplanation';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('EvidenceTierExplanation', () => {
  const defaultProps = {
    documentId: 'doc123',
    tier: 'TIER_1' as const,
    reason:
      'Document contains structured policy text\nNo system metadata present\nAppears to be a PDF export',
    confidence: 0.82,
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders expandable accordion panel', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} />);
    expect(screen.getByText('View Classification Details')).toBeInTheDocument();
  });

  it('shows correct icon for TIER_0', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_0" />);
    const trigger = screen.getByText('View Classification Details');
    const icon = trigger.parentElement?.querySelector('svg');
    expect(icon).toHaveClass('text-gray-500');
  });

  it('shows correct icon for TIER_1', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_1" />);
    const trigger = screen.getByText('View Classification Details');
    const icon = trigger.parentElement?.querySelector('svg');
    expect(icon).toHaveClass('text-blue-500');
  });

  it('shows correct icon for TIER_2', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_2" />);
    const trigger = screen.getByText('View Classification Details');
    const icon = trigger.parentElement?.querySelector('svg');
    expect(icon).toHaveClass('text-green-500');
  });

  it('expands and shows content when clicked', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} />);
    const trigger = screen.getByText('View Classification Details');

    // Content should not be visible initially
    expect(screen.queryByText('Classification Reasoning:')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(trigger);

    // Content should be visible after expanding
    expect(screen.getByText('Classification Reasoning:')).toBeInTheDocument();
  });

  it('parses reason into bullet points', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    expect(screen.getByText('Document contains structured policy text')).toBeInTheDocument();
    expect(screen.getByText('No system metadata present')).toBeInTheDocument();
    expect(screen.getByText('Appears to be a PDF export')).toBeInTheDocument();
  });

  it('displays confidence percentage correctly', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    expect(screen.getByText('Confidence:')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('shows appropriate "Why this matters" content for TIER_0', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_0" />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    expect(screen.getByText(/40% penalty/)).toBeInTheDocument();
  });

  it('shows appropriate "Why this matters" content for TIER_1', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_1" />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    expect(screen.getByText(/20% penalty/)).toBeInTheDocument();
  });

  it('shows appropriate "Why this matters" content for TIER_2', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_2" />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    expect(screen.getByText(/full scoring with no penalty/)).toBeInTheDocument();
  });

  it('shows upload button for TIER_0', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_0" />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    const uploadButton = screen.getByText('Upload better evidence →');
    expect(uploadButton).toBeInTheDocument();
  });

  it('shows upload button for TIER_1', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_1" />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    const uploadButton = screen.getByText('Upload better evidence →');
    expect(uploadButton).toBeInTheDocument();
  });

  it('does not show upload button for TIER_2', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_2" />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    const uploadButton = screen.queryByText('Upload better evidence →');
    expect(uploadButton).not.toBeInTheDocument();
  });

  it('navigates to upload page when upload button clicked', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} tier="TIER_1" />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    const uploadButton = screen.getByText('Upload better evidence →');
    fireEvent.click(uploadButton);

    expect(mockNavigate).toHaveBeenCalledWith('/documents/upload', {
      state: { documentId: 'doc123' },
    });
  });

  it('rounds confidence percentage correctly', () => {
    renderWithRouter(<EvidenceTierExplanation {...defaultProps} confidence={0.856} />);
    const trigger = screen.getByText('View Classification Details');
    fireEvent.click(trigger);

    expect(screen.getByText('86%')).toBeInTheDocument();
  });
});
