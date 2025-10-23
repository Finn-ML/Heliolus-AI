import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from '../TemplateCard';
import type { AssessmentTemplate } from '../types/template-selection.types';

describe('TemplateCard', () => {
  const mockTemplate: AssessmentTemplate = {
    id: 'template-1',
    name: 'AML/KYC Assessment',
    description: 'Comprehensive anti-money laundering and customer due diligence assessment',
    category: 'financial_crime',
    questionCount: 42,
    estimatedMinutes: 25,
    icon: '💰',
  };

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders template name correctly', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.getByText('AML/KYC Assessment')).toBeInTheDocument();
  });

  it('renders template description', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.getByText(/Comprehensive anti-money laundering/)).toBeInTheDocument();
  });

  it('renders question count', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.getByText('42 questions')).toBeInTheDocument();
  });

  it('renders estimated time', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.getByText('~25 minutes')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.getByText('financial crime')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('renders default icon when not provided', () => {
    const templateWithoutIcon = { ...mockTemplate, icon: undefined };
    render(
      <TemplateCard template={templateWithoutIcon} isSelected={false} onSelect={mockOnSelect} />
    );
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);

    const card = screen.getByRole('radio');
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('applies selected styling when isSelected is true', () => {
    render(<TemplateCard template={mockTemplate} isSelected={true} onSelect={mockOnSelect} />);

    const card = screen.getByRole('radio');
    expect(card).toHaveClass('border-cyan-500');
    expect(card).toHaveClass('bg-cyan-50');
  });

  it('applies unselected styling when isSelected is false', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);

    const card = screen.getByRole('radio');
    expect(card).toHaveClass('border-gray-200');
    expect(card).toHaveClass('bg-white');
  });

  it('has correct aria-checked attribute when selected', () => {
    render(<TemplateCard template={mockTemplate} isSelected={true} onSelect={mockOnSelect} />);

    const card = screen.getByRole('radio');
    expect(card).toHaveAttribute('aria-checked', 'true');
  });

  it('has correct aria-checked attribute when not selected', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);

    const card = screen.getByRole('radio');
    expect(card).toHaveAttribute('aria-checked', 'false');
  });

  it('handles keyboard Enter key to select', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);

    const card = screen.getByRole('radio');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard Space key to select', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);

    const card = screen.getByRole('radio');
    fireEvent.keyDown(card, { key: ' ' });

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('formats category with underscores correctly', () => {
    const template = { ...mockTemplate, category: 'trade_compliance' };
    render(<TemplateCard template={template} isSelected={false} onSelect={mockOnSelect} />);

    expect(screen.getByText('trade compliance')).toBeInTheDocument();
  });

  it('applies correct category color for financial_crime', () => {
    render(<TemplateCard template={mockTemplate} isSelected={false} onSelect={mockOnSelect} />);

    const badge = screen.getByText('financial crime');
    expect(badge).toHaveClass('bg-cyan-100');
    expect(badge).toHaveClass('text-cyan-700');
  });

  it('applies correct category color for trade_compliance', () => {
    const template = { ...mockTemplate, category: 'trade_compliance' };
    render(<TemplateCard template={template} isSelected={false} onSelect={mockOnSelect} />);

    const badge = screen.getByText('trade compliance');
    expect(badge).toHaveClass('bg-pink-100');
    expect(badge).toHaveClass('text-pink-700');
  });

  it('applies correct category color for data_privacy', () => {
    const template = { ...mockTemplate, category: 'data_privacy' };
    render(<TemplateCard template={template} isSelected={false} onSelect={mockOnSelect} />);

    const badge = screen.getByText('data privacy');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-700');
  });

  it('applies gray color for unknown category', () => {
    const template = { ...mockTemplate, category: 'unknown_category' };
    render(<TemplateCard template={template} isSelected={false} onSelect={mockOnSelect} />);

    const badge = screen.getByText('unknown category');
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-700');
  });
});
