import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Mail, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Users,
  CreditCard,
  Save,
  Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Dajavshne Gaming Hub',
    siteDescription: 'Your premier destination for discovering and booking exceptional gaming venues worldwide.',
    supportEmail: 'support@dajavshne.com',
    contactPhone: '+1 (555) 123-4567',
    
    // Platform Settings
    autoApprovalEnabled: false,
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    reviewModerationEnabled: true,
    requireEmailVerification: true,
    allowGuestBookings: false,
    
    // Business Settings
    defaultCommissionRate: 15,
    minimumBookingAmount: 25,
    maxAdvanceBookingDays: 90,
    cancellationPolicy: 'Cancellations allowed up to 24 hours before booking time.',
    
    // Appearance
    maintenanceMode: false,
    showAnalytics: true,
    enableDarkMode: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    
    toast({
      title: "Settings Saved",
      description: "Your admin settings have been updated successfully.",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
          <p className="text-gray-400">Configure your platform settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* General Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="h-5 w-5 mr-2 text-primary" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName" className="text-gray-300">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => updateSetting('siteName', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="supportEmail" className="text-gray-300">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="siteDescription" className="text-gray-300">Site Description</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => updateSetting('siteDescription', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="contactPhone" className="text-gray-300">Contact Phone</Label>
            <Input
              id="contactPhone"
              value={settings.contactPhone}
              onChange={(e) => updateSetting('contactPhone', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Database className="h-5 w-5 mr-2 text-primary" />
            Platform Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Auto-approve Venues</Label>
              <p className="text-sm text-gray-400">Automatically approve new venue submissions</p>
            </div>
            <Switch
              checked={settings.autoApprovalEnabled}
              onCheckedChange={(checked) => updateSetting('autoApprovalEnabled', checked)}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Email Notifications</Label>
              <p className="text-sm text-gray-400">Send email notifications for bookings and updates</p>
            </div>
            <Switch
              checked={settings.emailNotificationsEnabled}
              onCheckedChange={(checked) => updateSetting('emailNotificationsEnabled', checked)}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Review Moderation</Label>
              <p className="text-sm text-gray-400">Require admin approval for user reviews</p>
            </div>
            <Switch
              checked={settings.reviewModerationEnabled}
              onCheckedChange={(checked) => updateSetting('reviewModerationEnabled', checked)}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Require Email Verification</Label>
              <p className="text-sm text-gray-400">Users must verify email before booking</p>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Allow Guest Bookings</Label>
              <p className="text-sm text-gray-400">Allow bookings without user registration</p>
            </div>
            <Switch
              checked={settings.allowGuestBookings}
              onCheckedChange={(checked) => updateSetting('allowGuestBookings', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary" />
            Business Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="commissionRate" className="text-gray-300">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                value={settings.defaultCommissionRate || ''}
                onChange={(e) => updateSetting('defaultCommissionRate', parseInt(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="minimumBooking" className="text-gray-300">Minimum Booking ($)</Label>
              <Input
                id="minimumBooking"
                type="number"
                value={settings.minimumBookingAmount || ''}
                onChange={(e) => updateSetting('minimumBookingAmount', parseInt(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="maxAdvance" className="text-gray-300">Max Advance Days</Label>
              <Input
                id="maxAdvance"
                type="number"
                value={settings.maxAdvanceBookingDays || ''}
                onChange={(e) => updateSetting('maxAdvanceBookingDays', parseInt(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cancellationPolicy" className="text-gray-300">Cancellation Policy</Label>
            <Textarea
              id="cancellationPolicy"
              value={settings.cancellationPolicy}
              onChange={(e) => updateSetting('cancellationPolicy', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Maintenance Mode</Label>
              <p className="text-sm text-gray-400">Temporarily disable the platform for maintenance</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
              />
              <Badge variant={settings.maintenanceMode ? "destructive" : "default"}>
                {settings.maintenanceMode ? "Maintenance" : "Active"}
              </Badge>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Show Analytics</Label>
              <Switch
                checked={settings.showAnalytics}
                onCheckedChange={(checked) => updateSetting('showAnalytics', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Dark Mode Default</Label>
              <Switch
                checked={settings.enableDarkMode}
                onCheckedChange={(checked) => updateSetting('enableDarkMode', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="bg-primary hover:bg-primary/90">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving Changes...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Settings;