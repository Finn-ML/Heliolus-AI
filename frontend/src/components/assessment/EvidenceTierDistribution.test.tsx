import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceTierDistribution } from './EvidenceTierDistribution';

// Mock the useMediaQuery hook
vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: vi.fn(() => false), // Default to desktop
}));

// Mock recharts to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data }: any) => (
    <div data-testid="pie" data-value={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Cell: ({ fill }: any) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip">{content}</div>,
  Legend: ({ content }: any) => <div data-testid="legend">{content}</div>,
}));

describe('EvidenceTierDistribution', () => {
  it('renders empty state when all values are zero', () => {
    render(<EvidenceTierDistribution distribution={{ tier0: 0, tier1: 0, tier2: 0 }} />);

    expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('renders chart with correct data when values are provided', () => {
    render(<EvidenceTierDistribution distribution={{ tier0: 2, tier1: 5, tier2: 8 }} />);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  });

  it('filters out zero-value tiers from chart data', () => {
    const { container } = render(
      <EvidenceTierDistribution distribution={{ tier0: 0, tier1: 5, tier2: 8 }} />
    );

    const pie = screen.getByTestId('pie');
    const data = JSON.parse(pie.getAttribute('data-value') || '[]');

    expect(data).toHaveLength(2); // Only tier1 and tier2
    expect(data[0].value).toBe(5);
    expect(data[1].value).toBe(8);
  });

  it('renders cells with correct colors', () => {
    render(<EvidenceTierDistribution distribution={{ tier0: 2, tier1: 5, tier2: 8 }} />);

    const cells = screen.getAllByTestId('cell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('data-fill', '#6B7280'); // TIER_0 gray
    expect(cells[1]).toHaveAttribute('data-fill', '#3B82F6'); // TIER_1 blue
    expect(cells[2]).toHaveAttribute('data-fill', '#22C55E'); // TIER_2 green
  });

  it('includes tooltip component', () => {
    render(<EvidenceTierDistribution distribution={{ tier0: 2, tier1: 5, tier2: 8 }} />);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('includes legend component', () => {
    render(<EvidenceTierDistribution distribution={{ tier0: 2, tier1: 5, tier2: 8 }} />);

    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EvidenceTierDistribution
        distribution={{ tier0: 2, tier1: 5, tier2: 8 }}
        className="custom-chart-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-chart-class');
  });

  it('handles single non-zero tier', () => {
    render(<EvidenceTierDistribution distribution={{ tier0: 0, tier1: 0, tier2: 10 }} />);

    const pie = screen.getByTestId('pie');
    const data = JSON.parse(pie.getAttribute('data-value') || '[]');

    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('TIER_2');
    expect(data[0].value).toBe(10);
    expect(data[0].label).toBe('System-Generated');
  });

  it('calculates correct data structure', () => {
    render(<EvidenceTierDistribution distribution={{ tier0: 3, tier1: 6, tier2: 9 }} />);

    const pie = screen.getByTestId('pie');
    const data = JSON.parse(pie.getAttribute('data-value') || '[]');

    expect(data).toEqual([
      { name: 'TIER_0', value: 3, label: 'Self-Declared' },
      { name: 'TIER_1', value: 6, label: 'Policy Documents' },
      { name: 'TIER_2', value: 9, label: 'System-Generated' },
    ]);
  });

  it('renders ResponsiveContainer for responsive sizing', () => {
    render(<EvidenceTierDistribution distribution={{ tier0: 2, tier1: 5, tier2: 8 }} />);

    // ResponsiveContainer is mocked, but we verify it's rendered
    expect(screen.getByTestId('pie-chart').parentElement).toBeInTheDocument();
  });

  describe('mobile responsiveness', () => {
    beforeEach(() => {
      const { useMediaQuery } = vi.mocked(await import('@/hooks/use-media-query'));
      useMediaQuery.mockReturnValue(true); // Mobile view
    });

    afterEach(() => {
      const { useMediaQuery } = vi.mocked(await import('@/hooks/use-media-query'));
      useMediaQuery.mockReturnValue(false); // Reset to desktop
    });

    it('uses mobile configuration when on mobile device', async () => {
      render(<EvidenceTierDistribution distribution={{ tier0: 2, tier1: 5, tier2: 8 }} />);

      // The component should render (smoke test for mobile)
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });
});
