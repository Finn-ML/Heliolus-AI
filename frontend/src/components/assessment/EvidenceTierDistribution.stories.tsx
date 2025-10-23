import type { Meta, StoryObj } from '@storybook/react';
import { EvidenceTierDistribution } from './EvidenceTierDistribution';

const meta: Meta<typeof EvidenceTierDistribution> = {
  title: 'Assessment/EvidenceTierDistribution',
  component: EvidenceTierDistribution,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    Story => (
      <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 rounded-lg">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    distribution: {
      description: 'Document counts for each tier',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Empty state - no documents
export const EmptyState: Story = {
  args: {
    distribution: {
      tier0: 0,
      tier1: 0,
      tier2: 0,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows placeholder when no documents have been uploaded yet.',
      },
    },
  },
};

// Balanced distribution
export const BalancedDistribution: Story = {
  args: {
    distribution: {
      tier0: 5,
      tier1: 5,
      tier2: 5,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Equal distribution across all three tiers.',
      },
    },
  },
};

// Heavily skewed to Tier 0 (poor quality)
export const PoorQualityDocuments: Story = {
  args: {
    distribution: {
      tier0: 12,
      tier1: 3,
      tier2: 1,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Most documents are self-declared (Tier 0), indicating poor evidence quality.',
      },
    },
  },
};

// Heavily skewed to Tier 2 (high quality)
export const HighQualityDocuments: Story = {
  args: {
    distribution: {
      tier0: 1,
      tier1: 2,
      tier2: 15,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Most documents are system-generated (Tier 2), indicating excellent evidence quality.',
      },
    },
  },
};

// Mixed distribution (realistic)
export const RealisticDistribution: Story = {
  args: {
    distribution: {
      tier0: 3,
      tier1: 8,
      tier2: 6,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A realistic mix with most documents being policy documents.',
      },
    },
  },
};

// Single tier only
export const OnlyTier0: Story = {
  args: {
    distribution: {
      tier0: 7,
      tier1: 0,
      tier2: 0,
    },
  },
};

export const OnlyTier1: Story = {
  args: {
    distribution: {
      tier0: 0,
      tier1: 10,
      tier2: 0,
    },
  },
};

export const OnlyTier2: Story = {
  args: {
    distribution: {
      tier0: 0,
      tier1: 0,
      tier2: 12,
    },
  },
};

// Large numbers
export const LargeDataset: Story = {
  args: {
    distribution: {
      tier0: 45,
      tier1: 123,
      tier2: 87,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the component with larger document counts.',
      },
    },
  },
};

// Minimal data (1 document)
export const SingleDocument: Story = {
  args: {
    distribution: {
      tier0: 0,
      tier1: 1,
      tier2: 0,
    },
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    distribution: {
      tier0: 4,
      tier1: 7,
      tier2: 9,
    },
  },
};

// Responsive behavior demo
export const ResponsiveDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop View (300px chart)</h3>
        <div className="border rounded-lg p-4">
          <EvidenceTierDistribution
            distribution={{
              tier0: 5,
              tier1: 10,
              tier2: 8,
            }}
          />
        </div>
      </div>
      <div className="max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Mobile View (200px chart)</h3>
        <div className="border rounded-lg p-4">
          <EvidenceTierDistribution
            distribution={{
              tier0: 5,
              tier1: 10,
              tier2: 8,
            }}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Component automatically adjusts size based on viewport width.',
      },
    },
  },
};

// Use case: Assessment progress
export const AssessmentProgress: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Document Upload Progress</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Upload high-quality evidence to improve your assessment score
        </p>
        <EvidenceTierDistribution
          distribution={{
            tier0: 2,
            tier1: 5,
            tier2: 3,
          }}
        />
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Documents:</span>
            <span className="font-semibold">10</span>
          </div>
          <div className="flex justify-between">
            <span>Quality Score:</span>
            <span className="font-semibold text-yellow-600">Medium</span>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500">
              💡 Tip: Upload system-generated reports for better scoring
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};
