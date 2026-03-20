import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMembership } from '@/lib/MembershipContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const COUNTRIES = [
  { value: 'CZ', label: 'Česká republika' },
  { value: 'SK', label: 'Slovensko' },
  { value: 'PL', label: 'Polska' },
  { value: 'UA', label: 'Україна' },
];

const TIMEZONES = [
  { value: 'Europe/Prague',      label: 'Europe/Prague' },
  { value: 'Europe/Bratislava',  label: 'Europe/Bratislava' },
  { value: 'Europe/Warsaw',      label: 'Europe/Warsaw' },
  { value: 'Europe/Kyiv',        label: 'Europe/Kyiv' },
];

const LANGUAGES = [
  { value: 'cs', label: 'Čeština' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

const TIER_BADGES = {
  free_trial:   'bg-blue-100 text-blue-800',
  starter:      'bg-gray-100 text-gray-800',
  professional: 'bg-green-100 text-green-800',
  enterprise:   'bg-purple-100 text-purple-800',
};

export default function CompanySettingsTab() {
  const { t } = useTranslation();
  const { companyId, permissions } = useMembership();
  const canEdit = permissions?.includes('settings_company');
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      try {
        const company = await base44.entities.Company.get(companyId);
        setOriginalData(company);
        setFormData({
          name: company.name || '',
          legal_name: company.legal_name || '',
          vat_number: company.vat_number || '',
          registration_number: company.registration_number || '',
          address: company.address || '',
          city: company.city || '',
          country: company.country || '',
          phone: company.phone || '',
          email: company.email || '',
          timezone: company.timezone || 'Europe/Prague',
          language: company.language || 'cs',
        });
      } catch (err) {
        console.error('Failed to load company:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Company.update(companyId, { ...originalData, ...formData });
      toast.success(t('settings.company.save_success'));
      // refresh originalData to reflect saved state
      const updated = await base44.entities.Company.get(companyId);
      setOriginalData(updated);
    } catch (err) {
      console.error('Failed to save company:', err);
      toast.error(t('settings.company.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
  const setSelect = (field) => (value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Resolve country: if stored value not in list, show as 'other'
  const countryValue = COUNTRIES.find(c => c.value === formData.country) ? formData.country : (formData.country ? 'other' : '');

  if (loading) {
    return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Editable Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.company.company_info')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <Label>{t('settings.company.name')}</Label>
              <Input className="mt-1" value={formData.name} onChange={set('name')} disabled={!canEdit} />
            </div>
            {/* Legal Name */}
            <div>
              <Label>{t('settings.company.legal_name')}</Label>
              <Input className="mt-1" value={formData.legal_name} onChange={set('legal_name')} disabled={!canEdit} />
            </div>
            {/* VAT Number */}
            <div>
              <Label>{t('settings.company.vat_number')}</Label>
              <Input className="mt-1" value={formData.vat_number} onChange={set('vat_number')} disabled={!canEdit} />
            </div>
            {/* Registration Number */}
            <div>
              <Label>{t('settings.company.registration_number')}</Label>
              <Input className="mt-1" value={formData.registration_number} onChange={set('registration_number')} disabled={!canEdit} />
            </div>
            {/* Address */}
            <div>
              <Label>{t('settings.company.address')}</Label>
              <Input className="mt-1" value={formData.address} onChange={set('address')} disabled={!canEdit} />
            </div>
            {/* City */}
            <div>
              <Label>{t('settings.company.city')}</Label>
              <Input className="mt-1" value={formData.city} onChange={set('city')} disabled={!canEdit} />
            </div>
            {/* Country */}
            <div>
              <Label>{t('settings.company.country')}</Label>
              <Select value={countryValue} onValueChange={(val) => {
                if (val === 'other') {
                  setFormData(prev => ({ ...prev, country: '' }));
                } else {
                  setFormData(prev => ({ ...prev, country: val }));
                }
              }} disabled={!canEdit}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <SelectItem value="other">{t('settings.company.country_other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Phone */}
            <div>
              <Label>{t('settings.company.phone')}</Label>
              <Input className="mt-1" value={formData.phone} onChange={set('phone')} disabled={!canEdit} />
            </div>
            {/* Email */}
            <div>
              <Label>{t('settings.company.email')}</Label>
              <Input className="mt-1" type="email" value={formData.email} onChange={set('email')} disabled={!canEdit} />
            </div>
            {/* Timezone */}
            <div>
              <Label>{t('settings.company.timezone')}</Label>
              <Select value={formData.timezone} onValueChange={setSelect('timezone')} disabled={!canEdit}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Language */}
            <div>
              <Label>{t('settings.company.language')}</Label>
              <Select value={formData.language} onValueChange={setSelect('language')} disabled={!canEdit}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t('settings.company.saving') : t('settings.company.save')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Read-only Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.company.subscription_info')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subscription Tier */}
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('settings.company.subscription_tier')}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${TIER_BADGES[originalData?.subscription_tier] || 'bg-gray-100 text-gray-800'}`}>
                {t(`settings.company.tier_${originalData?.subscription_tier || 'free_trial'}`)}
              </span>
            </div>
            {/* Expires At */}
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('settings.company.subscription_expires_at')}</p>
              <p className="text-sm font-medium text-gray-900">
                {originalData?.subscription_expires_at
                  ? format(new Date(originalData.subscription_expires_at), 'dd.MM.yyyy')
                  : 'N/A'}
              </p>
            </div>
            {/* Is Active */}
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('settings.company.is_active')}</p>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${originalData?.is_active ? 'text-green-700' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full ${originalData?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                {originalData?.is_active ? t('common.active') : t('common.inactive')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}