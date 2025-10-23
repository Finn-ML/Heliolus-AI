import { Consultant } from '@/types/consultant';

export const getMatchColor = (score: number): string => {
  if (score >= 90) return 'text-primary bg-primary/20';
  if (score >= 75) return 'text-primary bg-primary/15';
  return 'text-primary bg-primary/10';
};

export const getSizeLabel = (size: string): string => {
  switch (size) {
    case 'individual':
      return 'Individual';
    case 'small':
      return 'Small Team';
    case 'medium':
      return 'Medium Firm';
    case 'large':
      return 'Large Firm';
    default:
      return size;
  }
};

export const filterConsultants = (
  consultants: Consultant[],
  searchTerm: string,
  expertiseFilter: string,
  locationFilter: string,
  sizeFilter: string
): Consultant[] => {
  return consultants.filter(consultant => {
    const matchesSearch =
      consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultant.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultant.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesExpertise =
      expertiseFilter === 'all' || consultant.specializations.includes(expertiseFilter);
    const matchesLocation =
      locationFilter === 'all' ||
      consultant.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesSize = sizeFilter === 'all' || consultant.size === sizeFilter;

    return matchesSearch && matchesExpertise && matchesLocation && matchesSize;
  });
};
