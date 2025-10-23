import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, ArrowRight } from 'lucide-react';

interface MembershipProps {
  onMembershipComplete: (membershipData: any) => void;
}

const Membership: React.FC<MembershipProps> = ({ onMembershipComplete }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
  });

  const membershipPlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Free',
      icon: Star,
      description: 'Perfect for small businesses getting started with compliance',
      features: [
        'Basic risk assessment templates',
        'Access to 3 vendor profiles',
        'Basic compliance guidance',
        'Email support',
      ],
      limitations: ['Limited to 1 assessment per month', 'Basic templates only'],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$299/month',
      icon: Zap,
      description: 'Comprehensive solution for growing businesses',
      features: [
        'All risk assessment templates',
        'Access to full vendor marketplace',
        'Advanced strategy matrix',
        'Consultant marketplace access',
        'Priority support',
        'Custom template builder',
        'Compliance tracking dashboard',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      icon: Crown,
      description: 'Tailored solutions for large organizations',
      features: [
        'Everything in Professional',
        'Custom compliance frameworks',
        'Dedicated account manager',
        'On-site training',
        'API access',
        'White-label options',
        'Advanced analytics',
        'Multi-jurisdiction support',
      ],
    },
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubmit = () => {
    if (selectedPlan && userInfo.name && userInfo.email) {
      const membershipData = {
        plan: selectedPlan,
        userInfo,
        accessLevel:
          selectedPlan === 'starter'
            ? 'basic'
            : selectedPlan === 'professional'
              ? 'premium'
              : 'enterprise',
      };
      onMembershipComplete(membershipData);
    }
  };

  const isFormValid = selectedPlan && userInfo.name && userInfo.email && userInfo.company;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Choose Your Membership Plan
          </CardTitle>
          <CardDescription>
            Select the plan that best fits your compliance needs and get started with Heliolus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {membershipPlans.map(plan => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:ring-1 hover:ring-muted-foreground/20'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <Icon
                        className={`h-8 w-8 ${selectedPlan === plan.id ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold text-primary">{plan.price}</div>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.limitations && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {plan.limitations.map((limitation, index) => (
                          <div key={index}>• {limitation}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedPlan && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Complete Your Registration</CardTitle>
                <CardDescription>
                  Provide your details to get started with your{' '}
                  {membershipPlans.find(p => p.id === selectedPlan)?.name} plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={userInfo.name}
                      onChange={e => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={userInfo.email}
                      onChange={e => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      placeholder="Enter your company name"
                      value={userInfo.company}
                      onChange={e => setUserInfo(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Input
                      id="role"
                      placeholder="e.g., Compliance Officer, CEO"
                      value={userInfo.role}
                      onChange={e => setUserInfo(prev => ({ ...prev, role: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className="w-full mt-6"
                  size="lg"
                >
                  Get Started with {membershipPlans.find(p => p.id === selectedPlan)?.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Membership;
