import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCategoryFilter } from '../TemplateCategoryFilter';

describe('TemplateCategoryFilter', () => {
  const mockOnCategoryChange = vi.fn();
  const categories = ['all', 'financial_crime', 'trade_compliance', 'data_privacy'];

  beforeEach(() => {
    mockOnCategoryChange.mockClear();
  });

  it('renders all category buttons', () => {
    render(
      <TemplateCategoryFilter
        selectedCategory="all"
        onCategoryChange={mockOnCategoryChange}
        categories={categories}
      />
    );

    expect(screen.getByText('All Templates')).toBeInTheDocument();
    expect(screen.getByText('Financial Crime')).toBeInTheDocument();
    expect(screen.getByText('Trade Compliance')).toBeInTheDocument();
    expect(screen.getByText('Data Privacy')).toBeInTheDocument();
  });

  it('highlights the selected category', () => {
    render(
      <TemplateCategoryFilter
        selectedCategory="financial_crime"
        onCategoryChange={mockOnCategoryChange}
        categories={categories}
      />
    );

    const selectedButton = screen.getByRole('button', { name: 'Financial Crime' });
    expect(selectedButton).toHaveClass('bg-cyan-500');
  });

  it('calls onCategoryChange when a category is clicked', () => {
    render(
      <TemplateCategoryFilter
        selectedCategory="all"
        onCategoryChange={mockOnCategoryChange}
        categories={categories}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Financial Crime' }));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('financial_crime');
  });

  it('calls onCategoryChange with correct value for each category', () => {
    render(
      <TemplateCategoryFilter
        selectedCategory="all"
        onCategoryChange={mockOnCategoryChange}
        categories={categories}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trade Compliance' }));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('trade_compliance');

    fireEvent.click(screen.getByRole('button', { name: 'Data Privacy' }));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('data_privacy');
  });

  it('renders with custom categories', () => {
    const customCategories = ['all', 'custom_category'];
    render(
      <TemplateCategoryFilter
        selectedCategory="all"
        onCategoryChange={mockOnCategoryChange}
        categories={customCategories}
      />
    );

    expect(screen.getByText('All Templates')).toBeInTheDocument();
    expect(screen.getByText('custom_category')).toBeInTheDocument();
  });

  it('applies correct variant to selected and unselected buttons', () => {
    render(
      <TemplateCategoryFilter
        selectedCategory="financial_crime"
        onCategoryChange={mockOnCategoryChange}
        categories={categories}
      />
    );

    const selectedButton = screen.getByRole('button', { name: 'Financial Crime' });
    const unselectedButton = screen.getByRole('button', { name: 'All Templates' });

    expect(selectedButton).toHaveClass('bg-cyan-500');
    expect(unselectedButton).not.toHaveClass('bg-cyan-500');
  });
});
