export interface Consultant {
  id: number;
  name: string;
  type: string;
  description: string;
  logo: string;
  rating: number;
  reviewCount: number;
  hourlyRate: string;
  projectRate: string;
  location: string;
  size: string;
  matchScore: number;
  expertise: string[];
  certifications: string[];
  experience: string;
  clientTypes: string[];
  languages: string[];
  availability: string;
  completedProjects: number;
  teamSize: string;
  specializations: string[];
  aiModels: string[];
  // Verification fields
  verificationStatus: {
    isVerified: boolean;
    linkedInVerified: boolean;
    companyVerified: boolean;
    complianceCertified: boolean;
    verificationDate?: string;
    linkedInProfile?: string;
  };
}

export interface ConsultantMarketplaceProps {
  businessProfile: any;
  riskData: any;
  selectedConsultants: Consultant[];
  onConsultantSelect: (consultants: Consultant[]) => void;
  selectedVendors: any[];
}
