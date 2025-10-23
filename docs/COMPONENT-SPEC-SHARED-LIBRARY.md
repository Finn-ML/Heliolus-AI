# Component Specification: Shared Journey Component Library

**Feature:** Reusable UI components for assessment journey consistency
**Priority:** P1 (Supporting)
**Effort:** 1 day
**Story:** Phase 1 - Core Assessment Journey

---

## 📋 Overview

### Purpose
Create a library of shared UI components used across all journey steps to ensure consistency, reduce code duplication, and accelerate development of Steps 3, 5, and 7.

### Benefits
- **Consistency:** All journey steps have identical headers, navigation, and loading states
- **Maintainability:** Single source of truth for common UI patterns
- **Development Speed:** Reusable components reduce boilerplate in each step
- **Testing:** Test shared components once, use everywhere
- **Accessibility:** WCAG compliance built into shared components

---

## 🏗️ Component Library

### 6 Core Shared Components

1. **JourneyStepContainer** - Layout wrapper for all journey steps
2. **JourneyStepHeader** - Consistent step title and progress indicator
3. **JourneyNavigation** - Back/Continue button layout
4. **JourneyProgressBar** - Visual progress through journey steps
5. **LoadingState** - Consistent loading indicators
6. **ErrorState** - Consistent error display with retry

---

## 💻 Component Specifications

### 1. JourneyStepContainer.tsx

**Purpose:** Provides consistent layout, spacing, and responsive behavior for all journey steps

**Props:**
```typescript
interface JourneyStepContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}
```

**Implementation:**
```tsx
export const JourneyStepContainer: React.FC<JourneyStepContainerProps> = ({
  children,
  className,
  maxWidth = 'lg'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'w-full mx-auto px-4 sm:px-6 lg:px-8 py-8',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
};
```

**Usage Example:**
```tsx
<JourneyStepContainer maxWidth="lg">
  <JourneyStepHeader title="Template Selection" />
  {/* Step content */}
  <JourneyNavigation onBack={...} onContinue={...} />
</JourneyStepContainer>
```

**Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Consistent padding: 32px desktop, 24px mobile]           │
│                                                              │
│  [Children rendered here]                                   │
│                                                              │
│  [Responsive max-width: 1024px by default]                 │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. JourneyStepHeader.tsx

**Purpose:** Displays step title, description, and progress indicator

**Props:**
```typescript
interface JourneyStepHeaderProps {
  title: string;
  description?: string;
  stepNumber?: number;
  totalSteps?: number;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}
```

**Implementation:**
```tsx
export const JourneyStepHeader: React.FC<JourneyStepHeaderProps> = ({
  title,
  description,
  stepNumber,
  totalSteps,
  icon: Icon,
  className
}) => {
  return (
    <div className={cn('mb-8', className)}>
      {/* Progress indicator */}
      {stepNumber && totalSteps && (
        <div className="flex items-center justify-between mb-4">
          <JourneyProgressBar current={stepNumber} total={totalSteps} />
          <span className="text-sm text-gray-600">
            Step {stepNumber} of {totalSteps}
          </span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-8 h-8 text-cyan-500" />}
        <h1 className="text-3xl font-bold text-gray-900">
          {title}
        </h1>
      </div>

      {/* Description */}
      {description && (
        <p className="mt-3 text-lg text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
};
```

**Usage Example:**
```tsx
<JourneyStepHeader
  title="Choose Your Assessment Template"
  description="Select the compliance framework that best matches your needs."
  stepNumber={3}
  totalSteps={10}
  icon={CheckSquare}
/>
```

**Visual:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Step 3 of 10

📋  Choose Your Assessment Template
    Select the compliance framework that best matches your needs.
```

---

### 3. JourneyNavigation.tsx

**Purpose:** Provides consistent Back/Continue button layout with state management

**Props:**
```typescript
interface JourneyNavigationProps {
  onBack?: () => void;
  onContinue: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  backLabel?: string;
  isLoading?: boolean;
  showSaveDraft?: boolean;
  onSaveDraft?: () => void;
  className?: string;
}
```

**Implementation:**
```tsx
export const JourneyNavigation: React.FC<JourneyNavigationProps> = ({
  onBack,
  onContinue,
  canContinue = true,
  continueLabel = 'Continue',
  backLabel = 'Back',
  isLoading = false,
  showSaveDraft = false,
  onSaveDraft,
  className
}) => {
  return (
    <div className={cn(
      'flex items-center justify-between pt-8 mt-8 border-t border-gray-200',
      className
    )}>
      {/* Left: Back button or spacer */}
      <div className="flex gap-3">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            ← {backLabel}
          </Button>
        )}
        {showSaveDraft && onSaveDraft && (
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={isLoading}
          >
            Save Draft
          </Button>
        )}
      </div>

      {/* Right: Continue button */}
      <Button
        onClick={onContinue}
        disabled={!canContinue || isLoading}
        className="min-w-[180px] bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {continueLabel} →
          </>
        )}
      </Button>
    </div>
  );
};
```

**Usage Example:**
```tsx
<JourneyNavigation
  onBack={() => setStep(2)}
  onContinue={() => setStep(4)}
  canContinue={!!selectedTemplate}
  continueLabel="Continue with AML Assessment"
  showSaveDraft
  onSaveDraft={handleSaveDraft}
/>
```

**Visual:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[← Back]  [Save Draft]                    [Continue →]
```

---

### 4. JourneyProgressBar.tsx

**Purpose:** Visual progress indicator showing current step

**Props:**
```typescript
interface JourneyProgressBarProps {
  current: number;
  total: number;
  showLabels?: boolean;
  className?: string;
}
```

**Implementation:**
```tsx
export const JourneyProgressBar: React.FC<JourneyProgressBarProps> = ({
  current,
  total,
  showLabels = false,
  className
}) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full"
        />
      </div>

      {/* Labels (optional) */}
      {showLabels && (
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Start</span>
          <span>{percentage}% Complete</span>
          <span>Finish</span>
        </div>
      )}
    </div>
  );
};
```

**Usage Example:**
```tsx
<JourneyProgressBar current={3} total={10} showLabels />
```

**Visual:**
```
━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░
Start                 30% Complete              Finish
```

---

### 5. LoadingState.tsx

**Purpose:** Consistent loading indicators with optional messages

**Props:**
```typescript
interface LoadingStateProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}
```

**Implementation:**
```tsx
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  submessage,
  size = 'md',
  fullScreen = false,
  className
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center',
      fullScreen && 'min-h-[400px]',
      className
    )}>
      <Loader2 className={cn(
        'animate-spin text-cyan-500',
        sizeClasses[size]
      )} />
      {message && (
        <p className="mt-4 text-lg font-medium text-gray-900">
          {message}
        </p>
      )}
      {submessage && (
        <p className="mt-2 text-sm text-gray-600">
          {submessage}
        </p>
      )}
    </div>
  );

  return fullScreen ? (
    <JourneyStepContainer>
      {content}
    </JourneyStepContainer>
  ) : content;
};
```

**Usage Example:**
```tsx
<LoadingState
  message="Loading assessment questions..."
  submessage="This may take a few moments"
  size="lg"
  fullScreen
/>
```

**Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                       ⟳ (spinning)                          │
│                                                              │
│              Loading assessment questions...                 │
│              This may take a few moments                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. ErrorState.tsx

**Purpose:** Consistent error display with retry functionality

**Props:**
```typescript
interface ErrorStateProps {
  message: string;
  submessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showSupport?: boolean;
  supportEmail?: string;
  className?: string;
}
```

**Implementation:**
```tsx
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  submessage,
  onRetry,
  retryLabel = 'Try Again',
  showSupport = true,
  supportEmail = 'support@heliolus.com',
  className
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4',
      className
    )}>
      {/* Error icon */}
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>

      {/* Error message */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {message}
      </h3>

      {submessage && (
        <p className="text-gray-600 text-center max-w-md mb-6">
          {submessage}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryLabel}
          </Button>
        )}

        {showSupport && (
          <Button variant="outline" asChild>
            <a href={`mailto:${supportEmail}`}>
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};
```

**Usage Example:**
```tsx
<ErrorState
  message="Failed to load assessment templates"
  submessage="We couldn't connect to the server. Please check your internet connection and try again."
  onRetry={refetch}
  retryLabel="Reload Templates"
/>
```

**Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                       ⚠️ (red circle)                        │
│                                                              │
│              Failed to load assessment templates             │
│    We couldn't connect to the server. Please check your     │
│           internet connection and try again.                 │
│                                                              │
│         [🔄 Reload Templates]  [✉️ Contact Support]         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
frontend/src/components/assessment/shared/
├── JourneyStepContainer.tsx         (50 lines)
├── JourneyStepHeader.tsx            (60 lines)
├── JourneyNavigation.tsx            (80 lines)
├── JourneyProgressBar.tsx           (50 lines)
├── LoadingState.tsx                 (60 lines)
├── ErrorState.tsx                   (80 lines)
├── index.ts                         (export all components)
│
├── __tests__/
│   ├── JourneyStepContainer.test.tsx
│   ├── JourneyStepHeader.test.tsx
│   ├── JourneyNavigation.test.tsx
│   ├── JourneyProgressBar.test.tsx
│   ├── LoadingState.test.tsx
│   └── ErrorState.test.tsx
│
└── types/
    └── shared.types.ts              (TypeScript interfaces)
```

**Total:** ~380 lines of code across 6 components

---

## 🎨 Design Tokens

### Colors
```typescript
// Used across all shared components
export const journeyColors = {
  primary: 'cyan-500',
  secondary: 'pink-500',
  success: 'green-500',
  error: 'red-600',
  warning: 'yellow-500',
  text: {
    primary: 'gray-900',
    secondary: 'gray-600',
    tertiary: 'gray-500'
  },
  border: 'gray-200',
  background: {
    primary: 'white',
    secondary: 'gray-50',
    tertiary: 'gray-100'
  }
};
```

### Spacing
```typescript
// Consistent spacing scale
export const journeySpacing = {
  container: {
    mobile: 'px-4 py-6',
    tablet: 'px-6 py-8',
    desktop: 'px-8 py-10'
  },
  section: 'mb-8',
  element: 'mb-4',
  small: 'mb-2'
};
```

### Typography
```typescript
// Typography scale
export const journeyTypography = {
  stepTitle: 'text-3xl font-bold',
  sectionTitle: 'text-xl font-semibold',
  cardTitle: 'text-lg font-medium',
  body: 'text-base',
  caption: 'text-sm',
  tiny: 'text-xs'
};
```

---

## 🧪 Testing

### Unit Tests

```typescript
describe('JourneyStepContainer', () => {
  it('renders children with correct max-width', () => {
    const { container } = render(
      <JourneyStepContainer maxWidth="lg">
        <div>Test content</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('max-w-6xl');
  });

  it('applies custom className', () => {
    const { container } = render(
      <JourneyStepContainer className="custom-class">
        <div>Test</div>
      </JourneyStepContainer>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('JourneyNavigation', () => {
  it('disables continue when canContinue is false', () => {
    const { getByRole } = render(
      <JourneyNavigation onContinue={jest.fn()} canContinue={false} />
    );
    expect(getByRole('button', { name: /Continue/ })).toBeDisabled();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = jest.fn();
    const { getByRole } = render(
      <JourneyNavigation onBack={onBack} onContinue={jest.fn()} />
    );
    fireEvent.click(getByRole('button', { name: /Back/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const { getByRole } = render(
      <JourneyNavigation onContinue={jest.fn()} isLoading />
    );
    expect(getByRole('button', { name: /Loading/ })).toBeInTheDocument();
  });
});

describe('LoadingState', () => {
  it('renders with custom message', () => {
    const { getByText } = render(
      <LoadingState message="Custom loading message" />
    );
    expect(getByText('Custom loading message')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { container, rerender } = render(<LoadingState size="sm" />);
    expect(container.querySelector('.w-6')).toBeInTheDocument();

    rerender(<LoadingState size="lg" />);
    expect(container.querySelector('.w-16')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('calls onRetry when retry button clicked', () => {
    const onRetry = jest.fn();
    const { getByRole } = render(
      <ErrorState message="Error" onRetry={onRetry} />
    );
    fireEvent.click(getByRole('button', { name: /Try Again/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows support link when showSupport is true', () => {
    const { getByRole } = render(
      <ErrorState message="Error" showSupport />
    );
    expect(getByRole('link', { name: /Contact Support/ })).toBeInTheDocument();
  });
});
```

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

**JourneyNavigation:**
- Clear focus indicators on buttons
- Disabled buttons properly announced by screen readers
- Keyboard navigation (Tab, Enter)

**LoadingState:**
- ARIA live region for loading announcements
- `role="status"` for screen readers
- Alternative text for spinner icon

**ErrorState:**
- Clear error icon with semantic color
- Retry button accessible via keyboard
- Error message announced to screen readers

**Implementation:**
```tsx
// LoadingState with accessibility
<div role="status" aria-live="polite" aria-busy="true">
  <Loader2 className="animate-spin" aria-hidden="true" />
  <span className="sr-only">Loading assessment questions</span>
  <p aria-live="polite">{message}</p>
</div>

// ErrorState with accessibility
<div role="alert" aria-live="assertive">
  <AlertCircle aria-hidden="true" />
  <h3>{message}</h3>
  <Button onClick={onRetry} aria-label="Retry loading templates">
    Try Again
  </Button>
</div>
```

---

## 📦 Export Pattern

**index.ts:**
```typescript
// Single export file for convenience
export { JourneyStepContainer } from './JourneyStepContainer';
export { JourneyStepHeader } from './JourneyStepHeader';
export { JourneyNavigation } from './JourneyNavigation';
export { JourneyProgressBar } from './JourneyProgressBar';
export { LoadingState } from './LoadingState';
export { ErrorState } from './ErrorState';

// Export types
export type {
  JourneyStepContainerProps,
  JourneyStepHeaderProps,
  JourneyNavigationProps,
  JourneyProgressBarProps,
  LoadingStateProps,
  ErrorStateProps
} from './types/shared.types';
```

**Usage in journey steps:**
```tsx
import {
  JourneyStepContainer,
  JourneyStepHeader,
  JourneyNavigation,
  LoadingState
} from '@/components/assessment/shared';
```

---

## 🚀 Implementation Priority

### Day 1 Tasks (1 day total)

**Morning (4 hours):**
1. Create file structure
2. Implement JourneyStepContainer (1 hour)
3. Implement JourneyStepHeader (1 hour)
4. Implement JourneyNavigation (1.5 hours)
5. Write unit tests for above 3 (0.5 hours)

**Afternoon (4 hours):**
6. Implement JourneyProgressBar (1 hour)
7. Implement LoadingState (1 hour)
8. Implement ErrorState (1 hour)
9. Write unit tests for above 3 (0.5 hours)
10. Create index.ts exports (0.25 hours)
11. Documentation and examples (0.25 hours)

---

## 📊 Success Criteria

### Functionality
- [ ] All 6 components render without errors
- [ ] Props validation works correctly
- [ ] All components support className override
- [ ] Responsive behavior works on mobile/tablet/desktop

### Quality
- [ ] Unit test coverage >90%
- [ ] All components pass accessibility audit
- [ ] TypeScript types exported correctly
- [ ] Storybook stories created (optional)

### Documentation
- [ ] Component README with usage examples
- [ ] Props documentation with JSDoc comments
- [ ] Design tokens documented
- [ ] Accessibility guidelines documented

---

## 🎯 Usage in Phase 1 Components

**Step 3: Template Selection**
```tsx
<JourneyStepContainer>
  <JourneyStepHeader title="Choose Template" stepNumber={3} totalSteps={10} />
  {/* Template cards */}
  <JourneyNavigation onBack={...} onContinue={...} canContinue={!!selected} />
</JourneyStepContainer>
```

**Step 5: Guided Questionnaire**
```tsx
<JourneyStepContainer>
  {isLoading ? (
    <LoadingState message="Loading questions..." fullScreen />
  ) : isError ? (
    <ErrorState message="Failed to load" onRetry={refetch} />
  ) : (
    <>
      <JourneyStepHeader title={section.title} stepNumber={5} totalSteps={10} />
      {/* Question content */}
      <JourneyNavigation onBack={...} onContinue={...} showSaveDraft />
    </>
  )}
</JourneyStepContainer>
```

**Step 7: Results Overview**
```tsx
<JourneyStepContainer maxWidth="xl">
  <JourneyStepHeader title="Your Results" stepNumber={7} totalSteps={10} />
  {/* Results content */}
  <JourneyNavigation onBack={...} onContinue={...} continueLabel="Continue to Gaps" />
</JourneyStepContainer>
```

---

**Build these shared components FIRST before starting Step 3, 5, and 7 implementations.** This foundation will accelerate all subsequent work. ✅

*Component Specification v1.0 - Created October 9, 2025*
