import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { JourneyStepContainer } from '../JourneyStepContainer';

describe('JourneyStepContainer', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <JourneyStepContainer>
        <div>Test content</div>
      </JourneyStepContainer>
    );
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('applies max-width lg by default', () => {
    const { container } = render(
      <JourneyStepContainer>
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('max-w-6xl');
  });

  it('applies max-width sm correctly', () => {
    const { container } = render(
      <JourneyStepContainer maxWidth="sm">
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('max-w-2xl');
  });

  it('applies max-width md correctly', () => {
    const { container } = render(
      <JourneyStepContainer maxWidth="md">
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('max-w-4xl');
  });

  it('applies max-width xl correctly', () => {
    const { container } = render(
      <JourneyStepContainer maxWidth="xl">
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('max-w-7xl');
  });

  it('applies max-width full correctly', () => {
    const { container } = render(
      <JourneyStepContainer maxWidth="full">
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('max-w-full');
  });

  it('applies custom className', () => {
    const { container } = render(
      <JourneyStepContainer className="custom-class">
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies responsive padding classes', () => {
    const { container } = render(
      <JourneyStepContainer>
        <div>Test</div>
      </JourneyStepContainer>
    );
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('px-4');
    expect(element).toHaveClass('sm:px-6');
    expect(element).toHaveClass('lg:px-8');
    expect(element).toHaveClass('py-8');
  });

  it('centers content with mx-auto', () => {
    const { container } = render(
      <JourneyStepContainer>
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('mx-auto');
  });

  it('is full width', () => {
    const { container } = render(
      <JourneyStepContainer>
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('w-full');
  });
});
