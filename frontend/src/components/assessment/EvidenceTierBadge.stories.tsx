import type { Meta, StoryObj } from '@storybook/react';
import { EvidenceTierBadge } from './EvidenceTierBadge';

const meta: Meta<typeof EvidenceTierBadge> = {
  title: 'Assessment/EvidenceTierBadge',
  component: EvidenceTierBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tier: {
      control: 'select',
      options: ['TIER_0', 'TIER_1', 'TIER_2'],
      description: 'Evidence tier level',
    },
    confidence: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Confidence score (0-1)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Individual tier stories
export const Tier0SelfDeclared: Story = {
  args: {
    tier: 'TIER_0',
  },
};

export const Tier1PolicyDocuments: Story = {
  args: {
    tier: 'TIER_1',
  },
};

export const Tier2SystemGenerated: Story = {
  args: {
    tier: 'TIER_2',
  },
};

// With confidence scores
export const WithHighConfidence: Story = {
  args: {
    tier: 'TIER_2',
    confidence: 0.95,
  },
};

export const WithMediumConfidence: Story = {
  args: {
    tier: 'TIER_1',
    confidence: 0.72,
  },
};

export const WithLowConfidence: Story = {
  args: {
    tier: 'TIER_0',
    confidence: 0.45,
  },
};

// Size variants
export const SizeSmall: Story = {
  args: {
    tier: 'TIER_1',
    size: 'sm',
    confidence: 0.85,
  },
};

export const SizeMedium: Story = {
  args: {
    tier: 'TIER_1',
    size: 'md',
    confidence: 0.85,
  },
};

export const SizeLarge: Story = {
  args: {
    tier: 'TIER_1',
    size: 'lg',
    confidence: 0.85,
  },
};

// All tiers comparison
export const AllTiers: Story = {
  render: () => (
    <div className="flex gap-4 items-center flex-wrap">
      <EvidenceTierBadge tier="TIER_0" />
      <EvidenceTierBadge tier="TIER_1" />
      <EvidenceTierBadge tier="TIER_2" />
    </div>
  ),
};

// All sizes comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center flex-wrap">
      <EvidenceTierBadge tier="TIER_1" size="sm" confidence={0.85} />
      <EvidenceTierBadge tier="TIER_1" size="md" confidence={0.85} />
      <EvidenceTierBadge tier="TIER_1" size="lg" confidence={0.85} />
    </div>
  ),
};

// Interactive playground
export const Playground: Story = {
  args: {
    tier: 'TIER_1',
    confidence: 0.75,
    size: 'md',
  },
};
