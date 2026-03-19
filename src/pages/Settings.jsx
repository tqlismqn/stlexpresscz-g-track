import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { useMembership } from '@/lib/MembershipContext';
import { hasPermission } from '@/lib/permissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { User, Building2, Users, CreditCard, Bell } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'cs', label: 'Čeština' },
];

export default function Settings() {
  const { t } = useTranslation();
  const { currentUser, refreshUser } = useAuth();
  const { permissions, isOwner, activeMembership } = useMembership();
  const [searchParams, setSearchParams] = useSearchParams();

  const [displayName, setDisplayName] = useState(currentUser?.display_name || currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savingLang, setSavingLang] = useState(false);

  // Tab definitions
  const tabs = [
    { id: 'profile', icon: User, labelKey: 'settings.tabs.profile', permission: null },
    { id: 'company', icon: Building2, labelKey: 'settings.tabs.company', permission: 'settings_company' },
    { id: 'team', icon: Users, labelKey: 'settings.tabs.team', permission: 'settings_team' },
    { id: 'billing', icon: CreditCard, labelKey: 'settings.tabs.billing', permission: 'settings_billing' },
    { id: 'notifications', icon: Bell, labelKey: 'settings.tabs.notifications', permission: 'settings_notifications' },
  ];

  // Filter visible tabs
  const visibleTabs = tabs.filter(tab => !tab.permission || hasPermission(permissions, tab.permission));

  // Tab state management
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Save profile changes
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ display_name: displayName, phone });
      await refreshUser();
      toast.success(t('settings.profile.saved'));
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(t('toasts.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Change language
  const handleLanguageChange = async (code) => {
    setSavingLang(true);
    try {
      i18n.changeLanguage(code);
      await base44.auth.updateMe({ language: code });
    } catch (e) {
      console.error('Failed to save language:', e);
    } finally {
      setSavingLang(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        <TabsList className="grid w-full mb-6" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile.title')}</CardTitle>
              <CardDescription>{t('settings.profile.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Name */}
              <div>
                <Label htmlFor="displayName">{t('settings.profile.displayName')}</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('settings.display_name_placeholder')}
                  className="mt-2"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <Label htmlFor="email">{t('settings.profile.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="mt-2 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">{t('settings.profile.emailHelp')}</p>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">{t('settings.profile.phone')}</Label>
                <Input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('settings.phone_placeholder')}
                  className="mt-2"
                />
              </div>

              {/* Language Selector */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('settings.profile.language')}</Label>
                    <p className="text-xs text-gray-500 mt-1">{t('settings.changes_apply_immediately')}</p>
                  </div>
                  <Select value={i18n.language || 'en'} onValueChange={handleLanguageChange} disabled={savingLang}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? t('settings.saving') : t('settings.profile.save')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Leave Company Section */}
          {!isOwner && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">{t('settings.profile.leaveCompany')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-800">
                  {t('settings.profile.leaveCompanyDesc', { company: activeMembership?.company_id || 'Company' })}
                </p>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" disabled title={t('settings.profile.leaveComingSoon')}>
                  {t('settings.profile.leaveCompany')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Company Tab - Placeholder */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.tabs.company')}</CardTitle>
              <CardDescription>{t('settings.placeholder.companyDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{t('settings.placeholder.comingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab - Placeholder */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.tabs.team')}</CardTitle>
              <CardDescription>{t('settings.placeholder.teamDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{t('settings.placeholder.comingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab - Placeholder */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.tabs.billing')}</CardTitle>
              <CardDescription>{t('settings.placeholder.billingDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{t('settings.placeholder.comingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab - Placeholder */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.tabs.notifications')}</CardTitle>
              <CardDescription>{t('settings.placeholder.notificationsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{t('settings.placeholder.comingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}