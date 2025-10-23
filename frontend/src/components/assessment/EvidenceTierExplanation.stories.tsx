import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { EvidenceTierExplanation } from './EvidenceTierExplanation';

const meta: Meta<typeof EvidenceTierExplanation> = {
  title: 'Assessment/EvidenceTierExplanation',
  component: EvidenceTierExplanation,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    Story => (
      <BrowserRouter>
        <div className="max-w-2xl mx-auto p-4">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
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
    reason: {
      control: 'text',
      description: 'Classification reasoning (newline-separated bullet points)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Tier 0 - Self-Declared
export const Tier0SelfDeclared: Story = {
  args: {
    documentId: 'doc_001',
    tier: 'TIER_0',
    reason:
      'No official documentation provided\nContent appears to be manually entered\nLacks verification signatures or stamps\nNo metadata from authoritative systems',
    confidence: 0.45,
  },
};

// Tier 1 - Policy Documents
export const Tier1PolicyDocuments: Story = {
  args: {
    documentId: 'doc_002',
    tier: 'TIER_1',
    reason:
      'Document contains structured policy text\nPDF format with company letterhead detected\nNo system-generated metadata present\nAppears to be an official policy export',
    confidence: 0.78,
  },
};

// Tier 2 - System-Generated
export const Tier2SystemGenerated: Story = {
  args: {
    documentId: 'doc_003',
    tier: 'TIER_2',
    reason:
      'Generated from compliance management system\nContains cryptographic signatures\nIncludes automated timestamp metadata\nVerifiable audit trail present',
    confidence: 0.95,
  },
};

// High confidence example
export const HighConfidence: Story = {
  args: {
    documentId: 'doc_004',
    tier: 'TIER_2',
    reason:
      'Direct export from Vanta compliance platform\nAll security headers validated\nComplete chain of custody verified',
    confidence: 0.98,
  },
};

// Low confidence example
export const LowConfidence: Story = {
  args: {
    documentId: 'doc_005',
    tier: 'TIER_0',
    reason:
      'Uncertain document origin\nMixed content types detected\nPossible manual modifications',
    confidence: 0.32,
  },
};

// Complex multi-line reasoning
export const DetailedReasoning: Story = {
  args: {
    documentId: 'doc_006',
    tier: 'TIER_1',
    reason:
      'Document type: PDF Policy Document\nStructural analysis: Well-formatted sections detected\nMetadata check: Basic PDF metadata present\nContent validation: Contains required policy elements\nAuthenticity markers: Company branding identified\nSystem integration: No API-generated content found\nManual review flag: Human-authored content detected',
    confidence: 0.82,
  },
};

// Collapsed state (default)
export const CollapsedByDefault: Story = {
  args: {
    documentId: 'doc_007',
    tier: 'TIER_1',
    reason: 'Standard policy document\nManually uploaded by user\nNo system integration detected',
    confidence: 0.7,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The explanation panel is collapsed by default. Users must click to expand and view details.',
      },
    },
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    documentId: 'doc_playground',
    tier: 'TIER_1',
    reason:
      'This is editable reasoning text\nYou can modify this in Storybook controls\nTry changing the tier and confidence too',
    confidence: 0.75,
  },
};

// All tiers comparison
export const AllTiersComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tier 0 - Self-Declared</h3>
        <EvidenceTierExplanation
          documentId="comp_001"
          tier="TIER_0"
          reason="User-provided information\nNo verification available\nManual data entry detected"
          confidence={0.4}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Tier 1 - Policy Documents</h3>
        <EvidenceTierExplanation
          documentId="comp_002"
          tier="TIER_1"
          reason="Official policy document\nCompany letterhead present\nPDF export from Word processor"
          confidence={0.75}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Tier 2 - System-Generated</h3>
        <EvidenceTierExplanation
          documentId="comp_003"
          tier="TIER_2"
          reason="Automated compliance report\nAPI-generated content\nCryptographically signed"
          confidence={0.92}
        />
      </div>
    </div>
  ),
};
