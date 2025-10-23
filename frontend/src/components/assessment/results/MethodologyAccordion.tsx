import { Info } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import type { MethodologyAccordionProps } from './types/results.types';

export const MethodologyAccordion: React.FC<MethodologyAccordionProps> = ({ methodology }) => {
  return (
    <Accordion type="single" collapsible className="mt-6">
      <AccordionItem value="methodology" className="border rounded-lg px-6">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-500" />
            <span className="font-medium">How is this score calculated?</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pt-4 pb-6 space-y-6">
          <div>
            <h4 className="font-semibold text-white mb-2">1. Question-Level Scoring</h4>
            <p className="text-sm text-gray-400 mb-2">{methodology.scoringApproach}</p>
            <ul className="text-sm text-gray-400 space-y-1 ml-4">
              <li>• TIER_0 (Self-declared): ×0.6 multiplier</li>
              <li>• TIER_1 (Claimed with evidence): ×0.8 multiplier</li>
              <li>• TIER_2 (Pre-filled from documents): ×1.0 multiplier</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">2. Section-Level Aggregation</h4>
            <p className="text-sm text-gray-400">{methodology.weightingExplanation}</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">3. Overall Risk Score</h4>
            <p className="text-sm text-gray-400">{methodology.evidenceImpact}</p>
          </div>

          <Button variant="link" className="p-0 h-auto text-cyan-600">
            View Detailed Methodology Documentation →
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
