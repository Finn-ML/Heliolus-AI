import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Users,
  MapPin,
  Clock,
  Award,
  Briefcase,
  Cpu,
  CheckCircle,
  Building2,
  Shield,
  Linkedin,
} from 'lucide-react';
import { Consultant } from '@/types/consultant';
import { getMatchColor, getSizeLabel } from '@/utils/consultant';

interface ConsultantCardProps {
  consultant: Consultant;
  isSelected: boolean;
  onToggle: (consultant: Consultant) => void;
}

const ConsultantCard: React.FC<ConsultantCardProps> = ({ consultant, isSelected, onToggle }) => {
  return (
    <Card
      className={`transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{consultant.logo}</div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{consultant.name}</CardTitle>
                {consultant.verificationStatus.isVerified && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{consultant.type}</Badge>
                {consultant.verificationStatus.linkedInVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <Linkedin className="h-3 w-3 mr-1" />
                    LinkedIn
                  </Badge>
                )}
                {consultant.verificationStatus.companyVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    Verified Company
                  </Badge>
                )}
                {consultant.verificationStatus.complianceCertified && (
                  <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                    <Shield className="h-3 w-3 mr-1 text-white" />
                    Compliance Certified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-sm font-bold ${getMatchColor(consultant.matchScore)}`}
          >
            {consultant.matchScore}% match
          </div>
        </div>
        <CardDescription>{consultant.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-secondary fill-current" />
            <span className="font-medium">{consultant.rating}</span>
            <span className="text-gray-500">({consultant.reviewCount})</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-gray-600">{consultant.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-gray-600">{getSizeLabel(consultant.size)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-gray-600">{consultant.availability}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-white">Pricing:</span>
            <div className="text-sm text-gray-300">
              <div>{consultant.hourlyRate}</div>
              <div>{consultant.projectRate}</div>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-white">Expertise:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {consultant.expertise.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {consultant.expertise.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{consultant.expertise.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-white">AI Models Experience:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {consultant.aiModels.slice(0, 3).map((model, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <Cpu className="h-3 w-3 mr-1" />
                  {model}
                </Badge>
              ))}
              {consultant.aiModels.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{consultant.aiModels.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-white">Certifications:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {consultant.certifications.slice(0, 3).map((cert, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <Award className="h-3 w-3 mr-1" />
                  {cert}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              <Briefcase className="h-4 w-4 inline mr-1" />
              {consultant.completedProjects} projects
            </span>
            <span className="text-gray-600">{consultant.experience}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => onToggle(consultant)}
            className="flex-1"
          >
            {isSelected ? 'Shortlisted' : 'Add to Shortlist'}
          </Button>
          <Button variant="ghost" size="sm">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultantCard;
