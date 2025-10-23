import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionScoreMiniBar } from './section/SectionScoreMiniBar';
import { getEvidenceQuality, type SectionBreakdownPanelProps } from './types/results.types';

export const SectionBreakdownPanel: React.FC<SectionBreakdownPanelProps> = ({ sections }) => {
  const [expanded, setExpanded] = useState(false);
  const displaySections = expanded ? sections : sections.slice(0, 3);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Section Breakdown</h3>

      <div className="space-y-4">
        {displaySections.map(section => {
          const evidenceQuality = getEvidenceQuality(section.evidenceCounts);

          return (
            <div key={section.sectionId} className="border-l-4 border-cyan-500 pl-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-white">{section.sectionName}</h4>
                  <p className="text-xs text-gray-400">
                    Weight: {section.weight}% • Evidence: {evidenceQuality.label}
                  </p>
                </div>
                <span className="text-lg font-semibold text-white">{section.score}/100</span>
              </div>

              <SectionScoreMiniBar score={section.score} />
            </div>
          );
        })}
      </div>

      {sections.length > 3 && (
        <Button variant="link" onClick={() => setExpanded(!expanded)} className="mt-4 w-full">
          {expanded ? 'Show Less ↑' : `View All Sections (${sections.length - 3} more) ↓`}
        </Button>
      )}
    </Card>
  );
};
