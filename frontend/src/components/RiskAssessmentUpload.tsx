import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import RiskTemplateSelector from './RiskTemplateSelector';

interface RiskAssessmentUploadProps {
  onReportUploaded: (report: any) => void;
  businessProfile?: any;
}

const RiskAssessmentUpload: React.FC<RiskAssessmentUploadProps> = ({
  onReportUploaded,
  businessProfile,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const generateTemplateBasedAnalysis = (template: any) => {
    // Generate analysis incorporating business profile data
    const companySize = businessProfile?.companySize || 'Medium';
    const businessType = businessProfile?.businessType || 'Traditional Banking';
    const jurisdictions = businessProfile?.operatingJurisdictions || ['United Kingdom'];
    const maturityLevel = businessProfile?.maturityAssessment?.level || 'Intermediate Maturity';

    const baseAnalysis = {
      templateName: template.name,
      category: template.category,
      uploadDate: new Date().toISOString(),
      documentType: 'Template-Based Assessment',
      complexity: template.complexity,
      estimatedCompletionTime: template.estimatedCompletionTime,
      // Business context from profile
      businessContext: {
        companyName: businessProfile?.companyName || 'Your Organization',
        companySize,
        businessType,
        jurisdictions,
        currentMaturity: maturityLevel,
        annualRevenue: businessProfile?.annualRevenue || 'Not specified',
        customerBase: businessProfile?.customerBase || 'Mixed',
      },
      riskAreas: template.riskAreas.map((area: string, index: number) => {
        const riskScore =
          template.complexity === 'Advanced'
            ? 8 - index * 1.2
            : template.complexity === 'Intermediate'
              ? 6.5 - index * 1.0
              : 4.8 - index * 0.8;

        return {
          category: area,
          riskLevel: riskScore >= 7 ? 'High' : riskScore >= 4 ? 'Medium' : 'Low',
          score: Math.max(1, riskScore),
          currentMaturity: 'Basic',
          targetMaturity: 'Advanced',
          gapDescription: `Identified gaps in ${area.toLowerCase()} for ${businessType} organization operating in ${jurisdictions.join(', ')}`,
          findings: [
            `${area} procedures need enhancement for ${companySize.toLowerCase()} ${businessType.toLowerCase()} institution`,
            `Documentation gaps in ${area.toLowerCase()} specific to ${jurisdictions.join(', ')} regulatory requirements`,
            `Training requirements for ${area.toLowerCase()} aligned with ${maturityLevel} framework`,
          ],
          businessImpact: `Regulatory and operational risks in ${area.toLowerCase()} affecting ${businessType} operations`,
          mitigationStrategies: [
            `Implement enhanced ${area.toLowerCase()} controls suitable for ${companySize.toLowerCase()} organization`,
            `Deploy technology solutions for ${area.toLowerCase()} optimized for ${businessType}`,
            `Establish monitoring for ${area.toLowerCase()} across ${jurisdictions.join(', ')}`,
          ],
          estimatedCost:
            companySize === 'Large'
              ? '$150K-400K'
              : companySize === 'Medium'
                ? '$75K-200K'
                : '$25K-100K',
          implementation: template.complexity === 'Advanced' ? '6-12 months' : '3-9 months',
        };
      }),
      overallRiskScore:
        template.complexity === 'Advanced'
          ? 8.2
          : template.complexity === 'Intermediate'
            ? 6.5
            : 4.8,
      priority: template.complexity === 'Advanced' ? 'High' : 'Medium',
      regulatoryFrameworks: template.regulatoryFrameworks,
      recommendedActions: [
        `Prioritize ${template.riskAreas[0]?.toLowerCase()} improvements for ${businessType} operations`,
        `Implement ${template.riskAreas[1]?.toLowerCase()} controls suitable for ${companySize.toLowerCase()} organization`,
        `Establish governance framework aligned with ${maturityLevel}`,
        `Deploy technology solutions appropriate for ${jurisdictions.join(', ')} regulatory environment`,
      ],
    };

    return baseAnalysis;
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setAnalyzing(true);

    // Generate analysis based on selected template
    setTimeout(() => {
      const mockAnalysis = generateTemplateBasedAnalysis(template);
      setAnalyzing(false);
      setAnalysisComplete(true);
      onReportUploaded(mockAnalysis);

      toast({
        title: `${template.category === 'financial-crime' ? 'Financial Crime' : 'Trade'} Compliance Analysis Complete`,
        description: `Template-based analysis completed for ${template.name}.`,
      });
    }, 3000);
  };

  const handleSkipTemplates = () => {
    setShowTemplates(false);
  };

  const handleFile = async (file: File) => {
    setUploadedFile(file);
    setAnalyzing(true);

    // Enhanced analysis incorporating business profile data
    setTimeout(() => {
      const companySize = businessProfile?.companySize || 'Medium';
      const businessType = businessProfile?.businessType || 'Traditional Banking';
      const jurisdictions = businessProfile?.operatingJurisdictions || ['United Kingdom'];
      const maturityLevel = businessProfile?.maturityAssessment?.level || 'Intermediate Maturity';
      const companyName = businessProfile?.companyName || 'Your Organization';

      const mockAnalysis = {
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        documentType: file.name.toLowerCase().includes('policy')
          ? 'Financial Crime Policy'
          : 'Risk Assessment Report',
        // Business context from profile
        businessContext: {
          companyName,
          companySize,
          businessType,
          jurisdictions,
          currentMaturity: maturityLevel,
          annualRevenue: businessProfile?.annualRevenue || 'Not specified',
          customerBase: businessProfile?.customerBase || 'Mixed',
        },
        gapAnalysis: {
          overallMaturityGap: `Significant gaps identified in key areas for ${businessType} institution`,
          criticalFindings: [
            `AML/KYC procedures lack enhanced due diligence appropriate for ${companySize.toLowerCase()} ${businessType.toLowerCase()} operations`,
            `Transaction monitoring system generates excessive false positives typical of ${businessType} legacy systems`,
            `Sanctions screening not integrated with real-time payment processing across ${jurisdictions.join(', ')}`,
            `Staff training records show gaps in financial crime awareness for ${businessType} specific risks`,
            `Customer risk assessment methodology needs modernization for ${companySize.toLowerCase()} institution scale`,
          ],
          regulatoryCompliance: {
            mifidII: {
              status:
                jurisdictions.includes('United Kingdom') || jurisdictions.includes('European Union')
                  ? 'Partially Compliant'
                  : 'Not Applicable',
              gaps: ['Product governance', 'Suitability assessments'],
            },
            gdpr: {
              status:
                jurisdictions.includes('United Kingdom') || jurisdictions.includes('European Union')
                  ? 'Compliant'
                  : 'Not Applicable',
              gaps: [],
            },
            aml6: {
              status: 'Non-Compliant',
              gaps: ['Beneficial ownership registers', 'Enhanced customer due diligence'],
            },
            psd2: {
              status:
                jurisdictions.includes('United Kingdom') || jurisdictions.includes('European Union')
                  ? 'Partially Compliant'
                  : 'Not Applicable',
              gaps: ['Strong customer authentication', 'Transaction monitoring'],
            },
          },
        },
        riskAreas: [
          {
            category: 'Customer Due Diligence & KYC',
            riskLevel: 'High',
            score: 8.5,
            currentMaturity: 'Basic',
            targetMaturity: 'Advanced',
            gapDescription: `Significant deficiencies in enhanced due diligence procedures for ${businessType} serving ${businessProfile?.customerBase || 'mixed'} customer base`,
            findings: [
              `Manual KYC processes create bottlenecks and human error risks in ${companySize.toLowerCase()} ${businessType.toLowerCase()} environment`,
              `Insufficient enhanced due diligence for PEPs and high-risk customers typical in ${businessType}`,
              `Limited beneficial ownership verification capabilities across ${jurisdictions.join(', ')} jurisdictions`,
              `Outdated customer risk assessment methodology not aligned with ${maturityLevel}`,
              `Inadequate ongoing monitoring of customer relationships for ${businessType} risk profile`,
            ],
            businessImpact: `High regulatory risk in ${jurisdictions.join(', ')}, potential fines, customer onboarding delays affecting ${businessType} operations`,
            mitigationStrategies: [
              `Deploy automated KYC platform with AI-powered document verification suitable for ${companySize.toLowerCase()} ${businessType.toLowerCase()}`,
              `Implement comprehensive EDD workflows for high-risk segments typical in ${businessType}`,
              `Establish real-time beneficial ownership verification system across ${jurisdictions.join(', ')}`,
              `Modernize customer risk scoring with behavioral analytics aligned with ${maturityLevel}`,
            ],
            estimatedCost:
              companySize === 'Large'
                ? '$300K-600K'
                : companySize === 'Medium'
                  ? '$150K-300K'
                  : '$75K-150K',
            implementation: '6-12 months',
          },
          {
            category: 'Transaction Monitoring & Surveillance',
            riskLevel: 'High',
            score: 7.8,
            currentMaturity: 'Basic',
            targetMaturity: 'Advanced',
            gapDescription: `Legacy rule-based system with high false positive rates not optimized for ${businessType} transaction patterns`,
            findings: [
              `Rule-based monitoring system generates 85% false positives, typical of legacy ${businessType} systems`,
              `Limited behavioral analytics and pattern recognition for ${businessType} specific money laundering typologies`,
              `Insufficient coverage of complex money laundering typologies relevant to ${businessType} operations`,
              `Manual investigation processes slow case resolution in ${companySize.toLowerCase()} institution`,
              `Inadequate reporting and audit trail capabilities for ${jurisdictions.join(', ')} regulatory requirements`,
            ],
            businessImpact: `Operational inefficiency, missed suspicious activities, regulatory scrutiny in ${jurisdictions.join(', ')} affecting ${businessType} reputation`,
            mitigationStrategies: [
              `Implement AI-powered transaction monitoring with behavioral analytics optimized for ${businessType}`,
              `Deploy network analysis for complex relationship mapping suitable for ${companySize.toLowerCase()} institution`,
              `Establish automated case management and workflow systems aligned with ${maturityLevel}`,
              `Integrate advanced typology detection and scenario modeling for ${businessType} risks`,
            ],
            estimatedCost:
              companySize === 'Large'
                ? '$400K-800K'
                : companySize === 'Medium'
                  ? '$200K-400K'
                  : '$100K-200K',
            implementation: '9-15 months',
          },
          {
            category: 'Sanctions Screening & Management',
            riskLevel:
              companySize === 'Large' || businessType.includes('Investment') ? 'High' : 'Medium',
            score: companySize === 'Large' ? 7.2 : 6.2,
            currentMaturity: 'Intermediate',
            targetMaturity: 'Advanced',
            gapDescription: `Good coverage but lacks real-time integration and advanced matching for ${businessType} cross-border operations`,
            findings: [
              `Batch screening creates timing gaps in sanctions detection for ${businessType} real-time transactions`,
              `Limited fuzzy matching capabilities lead to false negatives in ${jurisdictions.join(', ')} sanctions lists`,
              `Insufficient coverage of beneficial ownership in screening for ${businessType} complex structures`,
              `Manual processes for sanctions alert investigation not scaled for ${companySize.toLowerCase()} institution`,
              `Incomplete audit trail for sanctions decisions across ${jurisdictions.join(', ')} jurisdictions`,
            ],
            businessImpact: `Regulatory penalties in ${jurisdictions.join(', ')}, reputational damage to ${businessType}, transaction delays`,
            mitigationStrategies: [
              `Implement real-time sanctions screening across all ${businessType} channels`,
              `Deploy advanced fuzzy matching and phonetic algorithms for ${jurisdictions.join(', ')} specific names`,
              `Establish comprehensive beneficial ownership screening for ${businessType} complex structures`,
              `Automate sanctions alert investigation workflows suitable for ${companySize.toLowerCase()} volume`,
            ],
            estimatedCost:
              companySize === 'Large'
                ? '$150K-300K'
                : companySize === 'Medium'
                  ? '$75K-150K'
                  : '$50K-100K',
            implementation: '4-8 months',
          },
          {
            category: 'Regulatory Reporting & Governance',
            riskLevel: 'Medium',
            score: 5.9,
            currentMaturity: 'Basic',
            targetMaturity: 'Intermediate',
            gapDescription: `Manual processes increase error risk and delay reporting timelines for ${businessType} regulatory obligations`,
            findings: [
              `Manual SAR/STR preparation increases error risk and delays for ${jurisdictions.join(', ')} requirements`,
              `Inconsistent data quality across regulatory reports affecting ${businessType} compliance`,
              `Limited management information and trend analysis not aligned with ${maturityLevel}`,
              `Insufficient governance framework for financial crime compliance in ${companySize.toLowerCase()} ${businessType.toLowerCase()}`,
              `Gaps in staff training and awareness programs for ${businessType} specific risks`,
            ],
            businessImpact: `Regulatory scrutiny in ${jurisdictions.join(', ')}, potential fines, operational inefficiency affecting ${businessType} operations`,
            mitigationStrategies: [
              `Automate regulatory reporting with data quality controls for ${jurisdictions.join(', ')} requirements`,
              `Implement comprehensive compliance management platform suitable for ${companySize.toLowerCase()} ${businessType.toLowerCase()}`,
              `Establish robust governance framework and committee structure aligned with ${maturityLevel}`,
              `Deploy advanced analytics for trend analysis and insights specific to ${businessType} risks`,
            ],
            estimatedCost:
              companySize === 'Large'
                ? '$200K-400K'
                : companySize === 'Medium'
                  ? '$100K-200K'
                  : '$50K-100K',
            implementation: '6-10 months',
          },
        ],
        overallRiskScore: 7.1,
        priority: 'High',
        criticalityAssessment: {
          immediateFocus: ['Customer Due Diligence & KYC', 'Transaction Monitoring & Surveillance'],
          mediumTerm: ['Sanctions Screening & Management', 'Regulatory Reporting & Governance'],
          strategicImportance: `Critical for ${businessType} regulatory compliance and business sustainability in ${jurisdictions.join(', ')}`,
        },
        recommendedActions: [
          `Immediately address Customer Due Diligence deficiencies as highest priority for ${businessType}`,
          `Upgrade transaction monitoring system to reduce false positives and improve detection for ${businessType} patterns`,
          `Implement comprehensive staff training program on financial crime compliance specific to ${businessType} risks`,
          `Establish quarterly compliance committee reviews and reporting aligned with ${maturityLevel}`,
        ],
        budgetRecommendations: {
          immediate:
            companySize === 'Large'
              ? '$800K-1.2M (next 12 months)'
              : companySize === 'Medium'
                ? '$400K-600K (next 12 months)'
                : '$200K-300K (next 12 months)',
          strategic:
            companySize === 'Large'
              ? '$400K-600K (months 12-24)'
              : companySize === 'Medium'
                ? '$200K-300K (months 12-24)'
                : '$100K-150K (months 12-24)',
          ongoing:
            companySize === 'Large'
              ? '$200K-300K annually (maintenance and enhancement)'
              : companySize === 'Medium'
                ? '$100K-150K annually (maintenance and enhancement)'
                : '$50K-100K annually (maintenance and enhancement)',
        },
      };

      setAnalyzing(false);
      setAnalysisComplete(true);
      onReportUploaded(mockAnalysis);

      toast({
        title: 'Financial Crime Compliance Analysis Complete',
        description: `Your documents have been analyzed for ${companyName} (${businessType}) compliance gaps and risk areas.`,
      });
    }, 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showTemplates && !selectedTemplate && !uploadedFile ? (
        <RiskTemplateSelector
          onTemplateSelect={handleTemplateSelect}
          onSkip={handleSkipTemplates}
        />
      ) : selectedTemplate && analyzing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>Analyzing {selectedTemplate.name}</span>
            </CardTitle>
            <CardDescription>
              Generating compliance analysis based on {selectedTemplate.name} template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                Analyzing{' '}
                {selectedTemplate.category === 'financial-crime' ? 'Financial Crime' : 'Trade'}{' '}
                Compliance
              </h3>
              <p className="text-gray-600 mb-4">
                Our AI is conducting comprehensive analysis based on the {selectedTemplate.name}{' '}
                framework...
              </p>
              <div className="flex justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Framework Review</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                  <span>Gap Analysis</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span>Risk Scoring</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>
                {selectedTemplate ? `${selectedTemplate.name} Analysis` : 'Risk Assessment Upload'}
              </span>
            </CardTitle>
            <CardDescription>
              {selectedTemplate
                ? `Analysis complete for ${selectedTemplate.name} - view detailed results below`
                : 'Upload your latest risk assessment report, AML/CFT policies, or compliance documentation for comprehensive gap analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!uploadedFile ? (
              <div>
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Financial Crime Documentation
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop your files here, or click to browse
                  </p>

                  {/* Document type examples */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="bg-blue-50 rounded-lg p-3 text-left">
                      <h4 className="font-medium text-blue-900 mb-1">Risk Assessment Reports</h4>
                      <p className="text-xs text-blue-700">
                        Annual risk assessments, compliance reviews, internal audit reports
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-left">
                      <h4 className="font-medium text-green-900 mb-1">Policy Documentation</h4>
                      <p className="text-xs text-green-700">
                        AML policies, KYC procedures, sanctions screening guidelines
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    Supported formats: PDF, DOC, DOCX (Max size: 25MB)
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    id="fileInput"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInput}
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('fileInput')?.click()}
                    className="mx-auto"
                    size="lg"
                  >
                    Choose Documents
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{uploadedFile.name}</h4>
                    <p className="text-sm text-gray-600">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  {analyzing && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                  {analysisComplete && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>

                {analyzing && (
                  <div className="text-center py-8">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">
                      Analyzing Financial Crime Compliance
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Our AI is conducting comprehensive gap analysis across all financial crime
                      compliance areas...
                    </p>
                    <div className="flex justify-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Policy Review</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                        <span>Gap Analysis</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                        <span>Risk Scoring</span>
                      </div>
                    </div>
                  </div>
                )}

                {analysisComplete && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Compliance Gap Analysis Complete
                        </span>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        Assessment Ready
                      </Badge>
                    </div>

                    {/* Gap Analysis Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-700">2</div>
                          <div className="text-sm text-red-600">Critical Gaps</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-700">2</div>
                          <div className="text-sm text-yellow-600">Medium Priority</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-700">7.1</div>
                          <div className="text-sm text-blue-600">Risk Score</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-700">$600K</div>
                          <div className="text-sm text-green-600">Est. Investment</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Findings */}
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-orange-800 mb-3 flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Critical Compliance Gaps Identified</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Badge variant="destructive" className="mb-2">
                              High Priority
                            </Badge>
                            <ul className="text-sm text-orange-700 space-y-1">
                              <li>• Customer Due Diligence deficiencies</li>
                              <li>• Transaction monitoring false positives</li>
                            </ul>
                          </div>
                          <div>
                            <Badge variant="default" className="mb-2">
                              Medium Priority
                            </Badge>
                            <ul className="text-sm text-orange-700 space-y-1">
                              <li>• Sanctions screening optimization needed</li>
                              <li>• Regulatory reporting automation gaps</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Assessment Complete - Next Steps */}
                    <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              Assessment Analysis Complete!
                            </h3>
                          </div>
                          <p className="text-gray-700">
                            Your risk assessment has been analyzed and gaps identified. You can now
                            proceed to:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                <span className="font-medium text-blue-800">
                                  View Risk Analysis
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Detailed breakdown of risk areas, scores, and findings
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Target className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-800">
                                  Create Strategy Matrix
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Prioritized action plan with implementation roadmap
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!analyzing && !analysisComplete && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => setUploadedFile(null)}
                      variant="outline"
                      className="w-full"
                    >
                      Upload Different File
                    </Button>
                    <Button
                      onClick={() => {
                        setShowTemplates(true);
                        setSelectedTemplate(null);
                        setUploadedFile(null);
                        setAnalysisComplete(false);
                      }}
                      variant="ghost"
                      className="w-full text-sm"
                    >
                      Back to Templates
                    </Button>
                  </div>
                )}

                {(analysisComplete || (selectedTemplate && !analyzing)) && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => {
                        setShowTemplates(true);
                        setSelectedTemplate(null);
                        setUploadedFile(null);
                        setAnalysisComplete(false);
                        setAnalyzing(false);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Start New Assessment
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RiskAssessmentUpload;
