# Component Specification: Step 3 - Template Selection

**Feature:** Inline template selection within assessment journey
**Priority:** P0 (Critical Path)
**Effort:** 2 days
**Story:** Phase 1 - Core Assessment Journey

---

## 📋 Overview

### Purpose
Allow users to select an assessment template without leaving the journey flow. Current implementation redirects to `/assessment-templates`, breaking context and reducing completion rates.

### User Story
> **As a** user completing a risk assessment
> **I want to** select an assessment template inline within the journey
> **So that** I can maintain context and complete the assessment efficiently without navigation disruptions

### Success Criteria
- ✅ Template selection stays within journey flow (no redirect)
- ✅ All available templates displayed with relevant metadata
- ✅ Category filtering works smoothly
- ✅ Selected template persists in journey state
- ✅ Can navigate back to change template selection
- ✅ Mobile-responsive with touch-friendly interactions

---

## 🎨 User Experience

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]                                   Step 3 of 10    │
│                                                              │
│  📋 Choose Your Assessment Template                         │
│  Select the compliance framework that best matches your     │
│  organization's needs.                                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Filter: [All] [Financial Crime] [Trade] [Privacy]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────┐  ┌──────────────────────────┐ │
│  │ ◯ AML/KYC Assessment   │  │ ◯ GDPR Compliance        │ │
│  │                         │  │                          │ │
│  │ Comprehensive anti-     │  │ Data privacy and         │ │
│  │ money laundering and    │  │ protection requirements  │ │
│  │ customer due diligence  │  │ for EU operations        │ │
│  │                         │  │                          │ │
│  │ 📊 42 questions         │  │ 📊 38 questions          │ │
│  │ ⏱️ ~25 minutes         │  │ ⏱️ ~22 minutes          │ │
│  │ 🏷️ Financial Crime     │  │ 🏷️ Data Privacy         │ │
│  └─────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────┐  ┌──────────────────────────┐ │
│  │ ◯ Sanctions Screening  │  │ ◯ Trade Compliance       │ │
│  │                         │  │                          │ │
│  │ Sanctions list screening│  │ Export controls and      │ │
│  │ and watchlist monitoring│  │ trade restrictions       │ │
│  │                         │  │                          │ │
│  │ 📊 35 questions         │  │ 📊 50 questions          │ │
│  │ ⏱️ ~20 minutes         │  │ ⏱️ ~30 minutes          │ │
│  │ 🏷️ Financial Crime     │  │ 🏷️ Trade Compliance     │ │
│  └─────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│                                                              │
│  [← Back]              [Continue with AML/KYC Assessment →] │
└─────────────────────────────────────────────────────────────┘
```

### Interaction Flow

1. **Initial State:** All templates displayed, no selection
2. **User hovers template:** Card background changes, cursor pointer
3. **User clicks template:** Radio button fills, card border highlights, continue button activates
4. **User clicks category filter:** Templates filter instantly (animated transition)
5. **User clicks continue:** Navigate to Step 4, selected template saved to state
6. **User clicks back:** Return to Step 2 (Business Setup)

### States

#### Default State
- All templates visible (or filtered by category)
- No template selected
- Continue button disabled
- Gray placeholder state

#### Selected State
- One template has radio button filled
- Selected card has cyan/pink border (brand colors)
- Continue button enabled with template name
- Other cards remain available to click

#### Loading State
- Skeleton cards while fetching templates
- "Loading assessment templates..." message

#### Error State
- Error message: "Failed to load templates"
- Retry button
- Support contact link

#### Empty State (no templates match filter)
- "No templates found for [category]"
- Prompt to clear filters
- Illustration of empty state

---

## 🏗️ Component Architecture

### Component Tree

```
TemplateSelectionStep/
├── JourneyStepContainer (shared)
│   ├── JourneyStepHeader
│   │   ├── Title: "Choose Your Assessment Template"
│   │   └── Description: "Select the compliance framework..."
│   ├── TemplateCategoryFilter
│   │   └── CategoryButton[] (All, Financial Crime, Trade, Privacy, etc.)
│   ├── TemplateGrid
│   │   └── TemplateCard[]
│   │       ├── RadioButton (Radix UI)
│   │       ├── TemplateIcon
│   │       ├── TemplateTitle
│   │       ├── TemplateDescription
│   │       └── TemplateMetadata
│   │           ├── QuestionCount
│   │           ├── EstimatedTime
│   │           └── Category
│   └── JourneyNavigation (shared)
│       ├── BackButton
│       └── ContinueButton
```

### File Structure

```
frontend/src/components/assessment/
├── TemplateSelectionStep.tsx          (main component - 200 lines)
├── TemplateCard.tsx                   (template card - 100 lines)
├── TemplateCategoryFilter.tsx         (filter buttons - 80 lines)
├── __tests__/
│   ├── TemplateSelectionStep.test.tsx
│   ├── TemplateCard.test.tsx
│   └── TemplateCategoryFilter.test.tsx
└── types/
    └── template-selection.types.ts    (TypeScript types)
```

---

## 💻 Component Specifications

### 1. TemplateSelectionStep.tsx

**Purpose:** Main container for template selection step

**Props:**
```typescript
interface TemplateSelectionStepProps {
  assessmentId: string;
  onTemplateSelected: (templateId: string) => void;
  onBack: () => void;
  initialTemplateId?: string; // if returning to this step
}
```

**State:**
```typescript
const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialTemplateId || null);
const [selectedCategory, setSelectedCategory] = useState<string>('all');
```

**API Integration:**
```typescript
// Fetch templates using TanStack Query
const { data: templates, isLoading, isError, refetch } = useQuery({
  queryKey: ['templates'],
  queryFn: () => api.getTemplates(),
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});

// Filter templates by category
const filteredTemplates = useMemo(() => {
  if (selectedCategory === 'all') return templates;
  return templates?.filter(t => t.category === selectedCategory);
}, [templates, selectedCategory]);
```

**Implementation:**
```tsx
export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  assessmentId,
  onTemplateSelected,
  onBack,
  initialTemplateId
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialTemplateId || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: templates, isLoading, isError, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.getTemplates(),
    staleTime: 5 * 60 * 1000,
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (selectedCategory === 'all') return templates;
    return templates.filter(t => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const handleContinue = () => {
    if (selectedTemplateId) {
      onTemplateSelected(selectedTemplateId);
    }
  };

  if (isLoading) {
    return (
      <JourneyStepContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="mt-4 text-gray-600">Loading assessment templates...</p>
        </div>
      </JourneyStepContainer>
    );
  }

  if (isError) {
    return (
      <JourneyStepContainer>
        <ErrorState
          message="Failed to load assessment templates"
          onRetry={refetch}
        />
      </JourneyStepContainer>
    );
  }

  return (
    <JourneyStepContainer>
      <JourneyStepHeader
        title="Choose Your Assessment Template"
        description="Select the compliance framework that best matches your organization's needs."
        stepNumber={3}
        totalSteps={10}
      />

      <TemplateCategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={['all', 'financial_crime', 'trade_compliance', 'data_privacy']}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <TemplateCard
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => setSelectedTemplateId(template.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No templates found for this category.</p>
          <Button
            variant="link"
            onClick={() => setSelectedCategory('all')}
            className="mt-4"
          >
            Clear filters
          </Button>
        </div>
      )}

      <JourneyNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={!!selectedTemplateId}
        continueLabel={selectedTemplate ? `Continue with ${selectedTemplate.name}` : 'Continue'}
      />
    </JourneyStepContainer>
  );
};
```

---

### 2. TemplateCard.tsx

**Purpose:** Individual template card with selection radio button

**Props:**
```typescript
interface TemplateCardProps {
  template: AssessmentTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  estimatedMinutes: number;
  icon?: string; // emoji or icon name
}
```

**Implementation:**
```tsx
export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect
}) => {
  const categoryColors = {
    financial_crime: 'cyan',
    trade_compliance: 'pink',
    data_privacy: 'green',
  };

  const color = categoryColors[template.category] || 'gray';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative p-6 rounded-lg border-2 cursor-pointer transition-all",
        isSelected
          ? `border-${color}-500 bg-${color}-50 shadow-md`
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      )}
      onClick={onSelect}
    >
      {/* Radio button */}
      <div className="absolute top-4 right-4">
        <RadioGroupItem
          value={template.id}
          checked={isSelected}
          className={isSelected ? `text-${color}-500` : 'text-gray-400'}
        />
      </div>

      {/* Template icon */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-3xl`}>
          {template.icon || '📋'}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {template.name}
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {template.description}
      </p>

      {/* Metadata */}
      <div className="flex flex-col gap-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span>{template.questionCount} questions</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>~{template.estimatedMinutes} minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          <span className={`px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>
            {template.category.replace('_', ' ')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
```

---

### 3. TemplateCategoryFilter.tsx

**Purpose:** Category filter buttons

**Props:**
```typescript
interface TemplateCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}
```

**Implementation:**
```tsx
export const TemplateCategoryFilter: React.FC<TemplateCategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  categories
}) => {
  const categoryLabels = {
    all: 'All Templates',
    financial_crime: 'Financial Crime',
    trade_compliance: 'Trade Compliance',
    data_privacy: 'Data Privacy',
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(category)}
          className={cn(
            "transition-all",
            selectedCategory === category && "bg-cyan-500 hover:bg-cyan-600"
          )}
        >
          {categoryLabels[category] || category}
        </Button>
      ))}
    </div>
  );
};
```

---

## 🔌 API Integration

### Endpoint: GET /api/templates

**Existing:** Yes (implemented in backend)
**File:** `backend/src/routes/template.routes.ts`

**Request:**
```typescript
// No parameters needed (public endpoint)
GET /api/templates
```

**Response:**
```typescript
interface TemplateResponse {
  id: string;
  name: string;
  description: string;
  category: 'FINANCIAL_CRIME' | 'TRADE_COMPLIANCE' | 'DATA_PRIVACY' | 'CUSTOM';
  version: string;
  isActive: boolean;
  sections: Array<{
    id: string;
    title: string;
    weight: number;
    questionCount: number;
  }>;
  totalQuestions: number;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// Response is array of templates
TemplateResponse[]
```

**API Client Method:**
```typescript
// frontend/src/lib/api.ts
export const api = {
  async getTemplates(): Promise<AssessmentTemplate[]> {
    const response = await fetch(`${API_URL}/api/templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    return response.json();
  },
};
```

**TanStack Query Hook:**
```typescript
// Custom hook for template selection
export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => api.getTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};
```

---

## 📱 Responsive Design

### Breakpoints

**Desktop (≥1024px):**
- 2-column grid for template cards
- Full-width filter buttons (horizontal)
- Spacious padding and margins

**Tablet (768px - 1023px):**
- 2-column grid for template cards (smaller)
- Filter buttons wrap if needed
- Medium padding

**Mobile (<768px):**
- 1-column stack for template cards
- Filter buttons scroll horizontally or wrap
- Compact padding
- Touch-friendly tap targets (min 44px)

### Mobile Considerations

```tsx
// Touch-friendly card
<div
  className="min-h-[120px] p-4 active:bg-gray-50"
  onClick={onSelect}
>
  {/* Card content */}
</div>

// Horizontal scroll for filters on mobile
<div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
  {/* Filter buttons */}
</div>
```

---

## ♿ Accessibility

### Requirements (WCAG 2.1 AA)

1. **Keyboard Navigation:**
   - Tab through template cards
   - Space/Enter to select template
   - Arrow keys to navigate between cards
   - Focus visible indicator on all interactive elements

2. **Screen Reader Support:**
   - Proper ARIA labels on radio buttons
   - Announce template selection changes
   - Describe template metadata clearly

3. **Color Contrast:**
   - Text on backgrounds: minimum 4.5:1 ratio
   - Interactive elements: minimum 3:1 ratio
   - Selected state visible without color alone

4. **Focus Management:**
   - Focus on first template when step loads
   - Focus on continue button after selection
   - Maintain focus position when filtering

**Implementation:**
```tsx
<div
  role="radiogroup"
  aria-labelledby="template-selection-label"
>
  <h2 id="template-selection-label" className="sr-only">
    Available Assessment Templates
  </h2>

  {templates.map((template) => (
    <div
      key={template.id}
      role="radio"
      aria-checked={selectedTemplateId === template.id}
      aria-labelledby={`template-${template.id}-name`}
      aria-describedby={`template-${template.id}-description`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedTemplateId(template.id);
        }
      }}
    >
      {/* Template card content */}
    </div>
  ))}
</div>
```

---

## 🧪 Testing

### Unit Tests

**File:** `TemplateSelectionStep.test.tsx`

```typescript
describe('TemplateSelectionStep', () => {
  it('renders all templates when loaded', async () => {
    const { findByText } = render(<TemplateSelectionStep {...props} />);
    expect(await findByText('AML/KYC Assessment')).toBeInTheDocument();
    expect(await findByText('GDPR Compliance')).toBeInTheDocument();
  });

  it('filters templates by category', async () => {
    const { getByRole, queryByText } = render(<TemplateSelectionStep {...props} />);

    fireEvent.click(getByRole('button', { name: 'Financial Crime' }));

    expect(queryByText('AML/KYC Assessment')).toBeInTheDocument();
    expect(queryByText('GDPR Compliance')).not.toBeInTheDocument();
  });

  it('selects a template when clicked', () => {
    const { getByText } = render(<TemplateSelectionStep {...props} />);

    fireEvent.click(getByText('AML/KYC Assessment'));

    expect(getByRole('radio', { name: /AML\/KYC/ })).toBeChecked();
  });

  it('enables continue button after selection', () => {
    const { getByText, getByRole } = render(<TemplateSelectionStep {...props} />);

    const continueButton = getByRole('button', { name: /Continue/ });
    expect(continueButton).toBeDisabled();

    fireEvent.click(getByText('AML/KYC Assessment'));
    expect(continueButton).toBeEnabled();
  });

  it('calls onTemplateSelected when continue clicked', () => {
    const onTemplateSelected = jest.fn();
    const { getByText, getByRole } = render(
      <TemplateSelectionStep {...props} onTemplateSelected={onTemplateSelected} />
    );

    fireEvent.click(getByText('AML/KYC Assessment'));
    fireEvent.click(getByRole('button', { name: /Continue/ }));

    expect(onTemplateSelected).toHaveBeenCalledWith('template-id-1');
  });

  it('shows loading state while fetching', () => {
    const { getByText } = render(<TemplateSelectionStep {...props} />);
    expect(getByText('Loading assessment templates...')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    mockApiError();
    const { findByText, getByRole } = render(<TemplateSelectionStep {...props} />);

    expect(await findByText('Failed to load templates')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('Template Selection Integration', () => {
  it('persists selection across navigation', async () => {
    const { getByText, getByRole } = render(<AssessmentJourney />);

    // Navigate to Step 3
    await navigateToStep(3);

    // Select template
    fireEvent.click(getByText('AML/KYC Assessment'));
    fireEvent.click(getByRole('button', { name: /Continue/ }));

    // Go back
    fireEvent.click(getByRole('button', { name: 'Back' }));

    // Check selection persisted
    expect(getByRole('radio', { name: /AML\/KYC/ })).toBeChecked();
  });
});
```

### Manual Testing Checklist

- [ ] All templates display with correct metadata
- [ ] Category filtering works instantly
- [ ] Template selection highlights card
- [ ] Continue button enables/disables correctly
- [ ] Continue button shows selected template name
- [ ] Back button returns to previous step
- [ ] Selection persists when navigating back
- [ ] Loading state shows while fetching
- [ ] Error state shows retry button
- [ ] Empty state shows when no templates match filter
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces selections
- [ ] Works on mobile (touch interactions)
- [ ] Works on tablet (responsive grid)
- [ ] Animations smooth (no jank)

---

## 🎭 Edge Cases

1. **No templates available:**
   - Show empty state with support contact
   - Disable continue button
   - Provide alternative action (contact sales)

2. **Single template available:**
   - Auto-select the only template
   - Allow continuing immediately
   - Still show selection UI for clarity

3. **Slow network:**
   - Show loading skeleton for 3+ seconds
   - Provide cancel option
   - Retry automatically on failure

4. **Template metadata missing:**
   - Show default values (e.g., "Unknown duration")
   - Don't break card layout
   - Log error for monitoring

5. **User returns to step:**
   - Pre-select previously chosen template
   - Scroll to selected template
   - Allow changing selection

---

## 🚀 Performance

### Optimization Strategies

1. **Lazy load images/icons:**
```tsx
<img
  src={template.icon}
  alt={template.name}
  loading="lazy"
  className="w-8 h-8"
/>
```

2. **Memoize filtered templates:**
```tsx
const filteredTemplates = useMemo(() => {
  return templates?.filter(t => category === 'all' || t.category === category);
}, [templates, category]);
```

3. **Debounce filter changes:**
```tsx
const debouncedCategoryChange = useMemo(
  () => debounce(setSelectedCategory, 150),
  []
);
```

4. **Virtual scrolling (if many templates):**
```tsx
// Only if >20 templates
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Initial render | <500ms |
| Filter change | <100ms |
| Template selection | <50ms (instant) |
| Animation smoothness | 60fps |
| Bundle size impact | <10KB gzipped |

---

## 📄 Documentation

### Component README

```markdown
# TemplateSelectionStep

Inline template selection component for assessment journey.

## Usage

import { TemplateSelectionStep } from '@/components/assessment/TemplateSelectionStep';

<TemplateSelectionStep
  assessmentId="assessment-123"
  onTemplateSelected={(templateId) => console.log(templateId)}
  onBack={() => navigateBack()}
  initialTemplateId="template-456" // optional
/>

## Props

- `assessmentId`: Current assessment ID
- `onTemplateSelected`: Callback when template selected and continue clicked
- `onBack`: Callback for back button
- `initialTemplateId`: Pre-selected template (optional, for returning users)

## Features

- Category filtering
- Responsive grid layout
- Loading and error states
- Keyboard navigation
- Screen reader support
```

---

**Ready for implementation by Dev Team (James)** ✅

*Component Specification v1.0 - Created October 9, 2025*
