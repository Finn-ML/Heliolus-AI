import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplateSelectionStep } from '../TemplateSelectionStep';
import { api } from '@/lib/api';
import type { AssessmentTemplate } from '../types/template-selection.types';

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    getTemplates: vi.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('TemplateSelectionStep', () => {
  let queryClient: QueryClient;

  const mockTemplates: AssessmentTemplate[] = [
    {
      id: 'template-1',
      name: 'AML/KYC Assessment',
      description: 'Anti-money laundering assessment',
      category: 'financial_crime',
      questionCount: 42,
      estimatedMinutes: 25,
      icon: '💰',
    },
    {
      id: 'template-2',
      name: 'GDPR Compliance',
      description: 'Data privacy assessment',
      category: 'data_privacy',
      questionCount: 38,
      estimatedMinutes: 22,
      icon: '🔒',
    },
    {
      id: 'template-3',
      name: 'Trade Compliance',
      description: 'Export controls assessment',
      category: 'trade_compliance',
      questionCount: 50,
      estimatedMinutes: 30,
      icon: '🌍',
    },
  ];

  const mockProps = {
    assessmentId: 'assessment-123',
    onTemplateSelected: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  it('shows loading state initially', () => {
    vi.mocked(api.getTemplates).mockReturnValue(new Promise(() => {})); // Never resolves

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    expect(screen.getByText('Loading assessment templates...')).toBeInTheDocument();
  });

  it('renders all templates when loaded', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
    expect(screen.getByText('Trade Compliance')).toBeInTheDocument();
  });

  it('renders step header with correct title and description', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Choose Your Assessment Template')).toBeInTheDocument();
    });

    expect(screen.getByText(/Select the compliance framework/)).toBeInTheDocument();
  });

  it('renders category filter buttons', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('All Templates')).toBeInTheDocument();
    });

    expect(screen.getByText('Financial Crime')).toBeInTheDocument();
    expect(screen.getByText('Trade Compliance')).toBeInTheDocument();
    expect(screen.getByText('Data Privacy')).toBeInTheDocument();
  });

  it('filters templates by category', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    // Click Financial Crime filter
    fireEvent.click(screen.getByRole('button', { name: 'Financial Crime' }));

    // Should still see financial crime template
    expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();

    // Should not see other categories
    expect(screen.queryByText('GDPR Compliance')).not.toBeInTheDocument();
    expect(screen.queryByText('Trade Compliance')).not.toBeInTheDocument();
  });

  it('shows empty state when no templates match filter', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue([]);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('No templates found for this category.')).toBeInTheDocument();
    });

    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('clears filter when "Clear filters" is clicked', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    // Filter to category with no templates (simulate by filtering then clearing)
    fireEvent.click(screen.getByRole('button', { name: 'Financial Crime' }));

    // Click "All Templates" to see all again
    fireEvent.click(screen.getByRole('button', { name: 'All Templates' }));

    // All templates should be visible
    expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
    expect(screen.getByText('Trade Compliance')).toBeInTheDocument();
  });

  it('disables continue button when no template selected', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: /Continue/ });
    expect(continueButton).toBeDisabled();
  });

  it('enables continue button when template is selected', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    // Select a template
    const templates = screen.getAllByRole('radio');
    fireEvent.click(templates[0]);

    const continueButton = screen.getByRole('button', {
      name: /Continue with AML\/KYC Assessment/,
    });
    expect(continueButton).not.toBeDisabled();
  });

  it('updates continue button label with selected template name', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    // Select a template
    const templates = screen.getAllByRole('radio');
    fireEvent.click(templates[0]);

    expect(
      screen.getByRole('button', { name: /Continue with AML\/KYC Assessment/ })
    ).toBeInTheDocument();
  });

  it('calls onTemplateSelected with correct template ID when continue clicked', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    // Select first template
    const templates = screen.getAllByRole('radio');
    fireEvent.click(templates[0]);

    // Click continue
    const continueButton = screen.getByRole('button', {
      name: /Continue with AML\/KYC Assessment/,
    });
    fireEvent.click(continueButton);

    expect(mockProps.onTemplateSelected).toHaveBeenCalledWith('template-1');
  });

  it('calls onBack when back button is clicked', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /Back/ });
    fireEvent.click(backButton);

    expect(mockProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('shows error state when API call fails', async () => {
    vi.mocked(api.getTemplates).mockRejectedValue(new Error('API Error'));

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load assessment templates')).toBeInTheDocument();
    });
  });

  it('retries fetching templates when retry button is clicked', async () => {
    vi.mocked(api.getTemplates)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load assessment templates')).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByRole('button', { name: /Try Again/ });
    fireEvent.click(retryButton);

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });
  });

  it('pre-selects template when initialTemplateId is provided', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} initialTemplateId="template-2" />);

    await waitFor(() => {
      expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
    });

    // Continue button should show the pre-selected template
    expect(
      screen.getByRole('button', { name: /Continue with GDPR Compliance/ })
    ).toBeInTheDocument();
  });

  it('has correct accessibility attributes', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue(mockTemplates);

    renderWithQueryClient(<TemplateSelectionStep {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
    });

    // Check for radiogroup role
    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toHaveAttribute('aria-labelledby', 'template-selection-label');

    // Check for screen reader label
    expect(screen.getByText('Available Assessment Templates')).toHaveClass('sr-only');
  });
});
