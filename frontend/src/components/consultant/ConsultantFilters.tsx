import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ConsultantFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  expertiseFilter: string;
  setExpertiseFilter: (filter: string) => void;
  locationFilter: string;
  setLocationFilter: (filter: string) => void;
  sizeFilter: string;
  setSizeFilter: (filter: string) => void;
}

const ConsultantFilters: React.FC<ConsultantFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  expertiseFilter,
  setExpertiseFilter,
  locationFilter,
  setLocationFilter,
  sizeFilter,
  setSizeFilter,
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
            <Input
              placeholder="Search consultants..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Expertise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expertise</SelectItem>
              <SelectItem value="Customer Due Diligence">Customer Due Diligence</SelectItem>
              <SelectItem value="Transaction Monitoring">Transaction Monitoring</SelectItem>
              <SelectItem value="Sanctions Screening">Sanctions Screening</SelectItem>
              <SelectItem value="Risk Assessment">Risk Assessment</SelectItem>
              <SelectItem value="Regulatory Reporting">Regulatory Reporting</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="uk">United Kingdom</SelectItem>
              <SelectItem value="eu">Europe</SelectItem>
              <SelectItem value="asia">Asia Pacific</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sizeFilter} onValueChange={setSizeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Firm Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="small">Small Team</SelectItem>
              <SelectItem value="medium">Medium Firm</SelectItem>
              <SelectItem value="large">Large Firm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultantFilters;
