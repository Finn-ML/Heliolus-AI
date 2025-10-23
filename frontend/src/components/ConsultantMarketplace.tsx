import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { consultants } from '@/data/consultants';
import { filterConsultants } from '@/utils/consultant';
import { ConsultantMarketplaceProps } from '@/types/consultant';
import ConsultantFilters from './consultant/ConsultantFilters';
import SelectedConsultantsSummary from './consultant/SelectedConsultantsSummary';
import ConsultantCard from './consultant/ConsultantCard';
import EmptyState from './consultant/EmptyState';

const ConsultantMarketplace: React.FC<ConsultantMarketplaceProps> = ({
  businessProfile,
  riskData,
  selectedConsultants,
  onConsultantSelect,
  selectedVendors,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');

  const filteredConsultants = filterConsultants(
    consultants,
    searchTerm,
    expertiseFilter,
    locationFilter,
    sizeFilter
  );

  const handleConsultantToggle = (consultant: any) => {
    const isSelected = selectedConsultants.some(c => c.id === consultant.id);
    if (isSelected) {
      onConsultantSelect(selectedConsultants.filter(c => c.id !== consultant.id));
    } else {
      onConsultantSelect([...selectedConsultants, consultant]);
      toast({
        title: 'Consultant Added',
        description: `${consultant.name} has been added to your shortlist.`,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-card/50 to-card/80 backdrop-blur-sm border-cyan-500/20">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Compliance IT Consultants & Integrators
          </h2>
          <p className="text-gray-200">
            Find expert consultants and integrators to help implement and optimize your compliance
            technology solutions
          </p>
        </CardContent>
      </Card>

      <ConsultantFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        expertiseFilter={expertiseFilter}
        setExpertiseFilter={setExpertiseFilter}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        sizeFilter={sizeFilter}
        setSizeFilter={setSizeFilter}
      />

      <SelectedConsultantsSummary selectedConsultants={selectedConsultants} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredConsultants.map(consultant => {
          const isSelected = selectedConsultants.some(c => c.id === consultant.id);
          return (
            <ConsultantCard
              key={consultant.id}
              consultant={consultant}
              isSelected={isSelected}
              onToggle={handleConsultantToggle}
            />
          );
        })}
      </div>

      {filteredConsultants.length === 0 && <EmptyState />}
    </div>
  );
};

export default ConsultantMarketplace;
