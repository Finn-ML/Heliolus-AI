import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Consultant } from '@/types/consultant';

interface SelectedConsultantsSummaryProps {
  selectedConsultants: Consultant[];
}

const SelectedConsultantsSummary: React.FC<SelectedConsultantsSummaryProps> = ({
  selectedConsultants,
}) => {
  if (selectedConsultants.length === 0) return null;

  return (
    <Card className="bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="font-medium text-green-800">
              {selectedConsultants.length} consultant{selectedConsultants.length > 1 ? 's' : ''}{' '}
              shortlisted
            </span>
          </div>
          <Button variant="outline" size="sm">
            Request Proposals
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectedConsultantsSummary;
