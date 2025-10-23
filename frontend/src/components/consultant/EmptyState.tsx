import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No consultants found</h3>
        <p className="text-gray-600">
          Try adjusting your search criteria or filters to find more consultants.
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
