import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { User, Mail, Building, Globe, Bell, Lock, Eye, EyeOff, Edit2, RefreshCw } from 'lucide-react';

const PasswordResetSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'No email address found for your account.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Password Reset Email Sent',
          description: 'Please check your email for password reset instructions.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to send password reset email.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({
        title: 'Error',
        description: 'Failed to send password reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          To change your password, we'll send you a secure reset link via email.
        </p>
        <p className="text-sm text-muted-foreground">
          Current email: <span className="font-medium">{user?.email}</span>
        </p>
      </div>

      <Button
        onClick={handleSendResetLink}
        disabled={isLoading}
        data-testid="button-send-reset-link"
        className="w-full"
      >
        {isLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
      </Button>
    </div>
  );
};

const UserSettings = () => {
  const { toast } = useToast();
  const { user, login } = useAuth();
  const { startTour } = useOnboarding();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    timezone: 'America/New_York',
    bio: '',
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    twoFactorAuth: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Load user data from auth when component mounts or user changes
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        // Keep existing values for fields not in user object
        company: prev.company || '',
        jobTitle: prev.jobTitle || '',
        phone: prev.phone || '',
        bio: prev.bio || '',
      }));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          firstName: settings.firstName,
          lastName: settings.lastName,
          email: settings.email,
          company: settings.company,
          jobTitle: settings.jobTitle,
          phone: settings.phone,
          bio: settings.bio,
          timezone: settings.timezone,
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          marketingEmails: settings.marketingEmails,
          twoFactorAuth: settings.twoFactorAuth,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();

        // Update the auth state with new user data
        if (updatedUser.user) {
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            login(currentToken, updatedUser.user);
          }
        }

        toast({
          title: 'Settings Updated',
          description: 'Your user settings have been saved successfully.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleEditToggle = () => {
    if (!isEditMode) {
      // Entering edit mode - save current settings as backup
      setOriginalSettings(settings);
    }
    setIsEditMode(!isEditMode);
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(originalSettings);
    }
    setIsEditMode(false);
    setOriginalSettings(null);
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (newEmail === user?.email) {
      toast({
        title: 'Error',
        description: 'The new email address is the same as your current email.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingEmail(true);

    try {
      const response = await fetch('/v1/auth/request-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          newEmail: newEmail.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Verification Email Sent',
          description: `A verification email has been sent to ${newEmail}. Please check your inbox and follow the instructions to complete the email change.`,
        });
        setShowChangeEmail(false);
        setNewEmail('');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to send verification email.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting email change:', error);
      toast({
        title: 'Error',
        description: 'Failed to request email change. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={isEditMode ? handleCancel : handleEditToggle}
              data-testid="button-edit-profile"
              className="min-w-24"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditMode ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={settings.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                disabled={!isEditMode}
                data-testid="input-firstName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={settings.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                disabled={!isEditMode}
                data-testid="input-lastName"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={settings.email}
                readOnly
                className="flex-1"
                data-testid="input-email-readonly"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowChangeEmail(true)}
                data-testid="button-change-email"
              >
                <Edit2 className="h-4 w-4" />
                Change
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={settings.company}
                onChange={e => handleChange('company', e.target.value)}
                disabled={!isEditMode}
                data-testid="input-company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={settings.jobTitle}
                onChange={e => handleChange('jobTitle', e.target.value)}
                disabled={!isEditMode}
                data-testid="input-jobTitle"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={e => handleChange('phone', e.target.value)}
              disabled={!isEditMode}
              data-testid="input-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={settings.bio}
              onChange={e => handleChange('bio', e.target.value)}
              disabled={!isEditMode}
              rows={3}
              data-testid="textarea-bio"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>Configure your application preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={value => handleChange('timezone', value)}
              disabled={!isEditMode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Onboarding Tour</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Restart the interactive walkthrough to learn about platform features
            </p>
            <Button
              variant="outline"
              onClick={() => {
                startTour(true);
                navigate('/dashboard');
                toast({
                  title: 'Onboarding Tour Started',
                  description: 'The guided tour has begun on the Dashboard.',
                });
              }}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart Onboarding Tour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={checked => handleChange('emailNotifications', checked)}
              disabled={!isEditMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={settings.pushNotifications}
              onCheckedChange={checked => handleChange('pushNotifications', checked)}
              disabled={!isEditMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features and products
              </p>
            </div>
            <Switch
              id="marketingEmails"
              checked={settings.marketingEmails}
              onCheckedChange={checked => handleChange('marketingEmails', checked)}
              disabled={!isEditMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              id="twoFactorAuth"
              checked={settings.twoFactorAuth}
              onCheckedChange={checked => handleChange('twoFactorAuth', checked)}
              disabled={!isEditMode}
            />
          </div>

          <Separator />

          <PasswordResetSection />

          <Separator />

          <div className="space-y-4">
            <Button variant="outline" className="w-full">
              Download Account Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {isEditMode && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            data-testid="button-cancel-changes"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-8"
            disabled={isLoading}
            data-testid="button-save-settings"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Change Email Modal */}
      <Dialog open={showChangeEmail} onOpenChange={setShowChangeEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. A verification email will be sent to confirm the change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">Current Email</Label>
              <Input
                id="currentEmail"
                type="email"
                value={user?.email || ''}
                readOnly
                className="bg-muted"
                data-testid="input-current-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEmailAddress">New Email Address</Label>
              <Input
                id="newEmailAddress"
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Enter your new email address"
                data-testid="input-new-email"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeEmail(false);
                setNewEmail('');
              }}
              data-testid="button-cancel-email-change"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestEmailChange}
              disabled={isChangingEmail || !newEmail}
              data-testid="button-request-email-change"
            >
              {isChangingEmail ? 'Sending...' : 'Send Verification Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSettings;
