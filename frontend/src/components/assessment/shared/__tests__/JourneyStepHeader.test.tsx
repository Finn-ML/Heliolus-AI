import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckSquare } from 'lucide-react';
import { JourneyStepHeader } from '../JourneyStepHeader';

describe('JourneyStepHeader', () => {
  it('renders title correctly', () => {
    render(<JourneyStepHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<JourneyStepHeader title="Test" description="Test description" />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<JourneyStepHeader title="Test" />);
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('renders progress bar when stepNumber and totalSteps provided', () => {
    render(<JourneyStepHeader title="Test" stepNumber={3} totalSteps={10} />);
    expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();
  });

  it('does not render progress bar when stepNumber not provided', () => {
    render(<JourneyStepHeader title="Test" totalSteps={10} />);
    expect(screen.queryByText(/Step.*of/i)).not.toBeInTheDocument();
  });

  it('does not render progress bar when totalSteps not provided', () => {
    render(<JourneyStepHeader title="Test" stepNumber={3} />);
    expect(screen.queryByText(/Step.*of/i)).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(<JourneyStepHeader title="Test" icon={CheckSquare} />);
    // Check for svg element with specific className
    const icon = container.querySelector('.text-cyan-500');
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<JourneyStepHeader title="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has correct title styling', () => {
    render(<JourneyStepHeader title="Test Title" />);
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('text-3xl');
    expect(title).toHaveClass('font-bold');
    expect(title).toHaveClass('text-gray-900');
  });

  it('has correct description styling', () => {
    render(<JourneyStepHeader title="Test" description="Test description" />);
    const description = screen.getByText('Test description');
    expect(description).toHaveClass('text-lg');
    expect(description).toHaveClass('text-gray-600');
  });

  it('renders all elements in correct order', () => {
    render(
      <JourneyStepHeader
        title="Test Title"
        description="Test description"
        stepNumber={5}
        totalSteps={10}
        icon={CheckSquare}
      />
    );
    expect(screen.getByText('Step 5 of 10')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
});
