import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import DriverDocumentsTabContent from './DriverDocumentsTabContent';
import DriverCommentsTab from './DriverCommentsTab';
import DriverHistoryTab from './DriverHistoryTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format as formatDateFns } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getCountryByCode, isEUCountry, getSortedCountries } from "@/lib/countries";
import { getIncompleteFields } from '@/lib/dataCompleteness';
import { formatDriverId } from '@/lib/driverUtils';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDriverTags } from '@/hooks/useDriverTags';

const Driver = base44.entities.Driver;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch { return dateStr; }
};

const formatDriverName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1) {
    const lastName = parts[0];
    const firstName = parts.slice(1).join(' ');
    return `${firstName} ${lastName}`;
  }
  return fullName;
};

const reverseFormatDriverName = (formattedName) => {
  if (!formattedName) return '';
  const parts = formattedName.trim().split(/\s+/);
  if (parts.length > 1) {
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return `${lastName} ${firstName}`;
  }
  return formattedName;
};

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
];

const getAvatarColor = (name) => {
  if (!name) return 'bg-gray-400';
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return avatarColors[Math.abs(hash % avatarColors.length)];
};

const getInitials = (name) => {
  if (!name) return '?';
  const formatted = formatDriverName(name);
  const parts = formatted.split(' ');
  let initials = parts[0]?.[0] || '';
  if (parts.length > 1) initials += parts[parts.length - 1]?.[0] || '';
  return initials.toUpperCase();
};

function CountryCombobox({ value, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { pinned, rest } = getSortedCountries();

  const filterFn = (c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase());

  const filteredPinned = pinned.filter(filterFn);
  const filteredRest = rest.filter(filterFn);
  const selected = getCountryByCode(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full h-8 justify-between text-sm font-normal">
          {selected ? `${selected.flag} ${selected.name}` : t('fields.select_country')}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('fields.search_country')} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{t('fields.country_not_found')}</CommandEmpty>
            {filteredPinned.length > 0 && (
              <CommandGroup heading={t('fields.main_countries')}>
                {filteredPinned.map((c) => (
                  <CommandItem key={c.code} value={`${c.name} ${c.code}`} onSelect={() => { onChange(c.code); setOpen(false); setSearch(''); }}>
                    <Check className={cn("mr-2 h-4 w-4", value === c.code ? "opacity-100" : "opacity-0")} />
                    {c.flag} {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredRest.length > 0 && (
              <CommandGroup heading={t('fields.all_countries')}>
                {filteredRest.map((c) => (
                  <CommandItem key={c.code} value={`${c.name} ${c.code}`} onSelect={() => { onChange(c.code); setOpen(false); setSearch(''); }}>
                    <Check className={cn("mr-2 h-4 w-4", value === c.code ? "opacity-100" : "opacity-0")} />
                    {c.flag} {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const EMPTY_FORM = {
  name: '',
  company_id: '69b82c27ef634769ef155579',
  status: 'active',
  nationality_group: 'non-EU',
  country_code: '',
  date_of_birth: '',
  rodne_cislo: '',
  phone: '',
  email: '',
  address: '',
  bank_name: '',
  bank_account: '',
  _dob_display: ''
};

const TRACKED_FIELDS = ['name', 'phone', 'email', 'date_of_birth', 'nationality_group', 'country_code', 'address', 'passport_number', 'driving_license_number', 'status', 'rodne_cislo'];

const buildDescription = (field, oldVal, newVal, t) => {
  const fieldLabels = {
    name: t('fields.name'),
    phone: t('fields.phone'),
    email: t('fields.email'),
    date_of_birth: t('fields.date_of_birth'),
    nationality_group: t('fields.nationality'),
    country_code: t('fields.citizenship'),
    address: t('fields.address'),
    passport_number: t('fields.passport_number'),
    driving_license_number: t('fields.driving_license'),
    status: t('fields.status'),
    rodne_cislo: t('fields.rodne_cislo')
  };
  if (field === 'status') {
    return `${t('history.status_changed')} ${oldVal} → ${newVal}`;
  }
  return `${fieldLabels[field] || field} ${t('history.field_updated')}`;
};

export default function DriverDetailView({ driver, documents = [], onSave, isCreating, initialTab = 'overview' }) {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { tagMap, archiveTags } = useDriverTags();

  const statusConfig = {
    candidate: { bg: 'bg-purple-100 text-purple-700', label: t('drivers.status_candidate') },
    active:    { bg: 'bg-green-100 text-green-700',   label: t('drivers.status_active') },
    archived:  { bg: 'bg-gray-100 text-gray-500',     label: t('drivers.status_archived') },
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [documentsEditing, setDocumentsEditing] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [formData, setFormData] = useState({});

  // Reset form when switching drivers or entering create mode
  useEffect(() => {
    if (isCreating && !driver) {
      setFormData({ ...EMPTY_FORM });
      setIsEditing(false);
      setActiveTab('overview');
    } else if (driver) {
      setFormData({
        ...driver,
        name: formatDriverName(driver.name),
        _dob_display: driver.date_of_birth ? formatDateFns(new Date(driver.date_of_birth), "dd.MM.yyyy") : ''
      });
      setIsEditing(false);
      setActiveTab('overview');
    }
  }, [driver, isCreating]);

  const readinessPct = driver?.trip_readiness_pct || 0;
  const incompleteFields = getIncompleteFields(isEditing ? formData : driver);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { _dob_display, ...restData } = formData;
      const dataToSave = { ...restData, name: reverseFormatDriverName(restData.name) };

      if (isCreating && !driver) {
        const allDrivers = await Driver.list();
        const maxNum = Math.max(0, ...allDrivers.map(d => d.internal_number || 0));
        const newDriver = await Driver.create({ ...dataToSave, internal_number: maxNum + 1 });
        
        // Create history for new driver
        await base44.entities.DriverHistory.create({
          driver_id: newDriver.id,
          action: 'created',
          description: t('history.driver_created', { id: String(newDriver.internal_number).padStart(5, '0') }),
          changed_by: currentUser?.full_name || 'Unknown'
        });
        
        toast.success(t('toasts.driver_created'));
        if (onSave) onSave(newDriver);
      } else {
        // Compare and log changes
        const historyRecords = [];
        TRACKED_FIELDS.forEach(field => {
          const oldVal = driver?.[field];
          const newVal = dataToSave[field];
          if (String(oldVal || '') !== String(newVal || '')) {
            historyRecords.push({
              driver_id: dataToSave.id,
              action: field === 'status' ? 'status_changed' : 'updated',
              field_name: field,
              old_value: String(oldVal || ''),
              new_value: String(newVal || ''),
              description: buildDescription(field, oldVal, newVal, t),
              changed_by: currentUser?.full_name || 'Unknown'
            });
          }
        });

        await Driver.update(dataToSave.id, dataToSave);
        
        // Bulk create history records
        if (historyRecords.length > 0) {
          await base44.entities.DriverHistory.bulkCreate(historyRecords);
        }

        setIsEditing(false);
        if (onSave) onSave(dataToSave);
        toast.success(t('toasts.changes_saved'));
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(t('toasts.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreating && !driver) {
      if (onSave) onSave(null);
    } else {
      setFormData({
        ...driver,
        name: formatDriverName(driver.name),
        _dob_display: driver.date_of_birth ? formatDateFns(new Date(driver.date_of_birth), "dd.MM.yyyy") : ''
      });
      setIsEditing(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await Driver.update(driver.id, { ...driver, status: 'terminated' });
      
      // Create history
      await base44.entities.DriverHistory.create({
        driver_id: driver.id,
        action: 'archived',
        field_name: 'status',
        old_value: driver.status,
        new_value: 'terminated',
        description: t('toasts.driver_archived'),
        changed_by: currentUser?.full_name || 'Unknown'
      });
      
      toast.success(t('toasts.driver_archived'));
      setShowArchiveModal(false);
      if (onSave) onSave({ ...driver, status: 'terminated' });
    } catch (error) {
      toast.error(t('toasts.archive_error'));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await Driver.update(driver.id, { ...driver, status: 'inactive', fired_date: null });
      
      // Create history
      await base44.entities.DriverHistory.create({
        driver_id: driver.id,
        action: 'restored',
        field_name: 'status',
        old_value: 'terminated',
        new_value: 'inactive',
        description: t('toasts.driver_restored', { name: formatDriverName(driver.name) }),
        changed_by: currentUser?.full_name || 'Unknown'
      });
      
      toast.success(t('toasts.driver_restored', { name: formatDriverName(driver.name) }));
      setShowRestoreModal(false);
      if (onSave) onSave({ ...driver, status: 'inactive', fired_date: null });
    } catch (error) {
      toast.error(t('toasts.restore_error'));
    } finally {
      setIsRestoring(false);
    }
  };

  const isCreateMode = isCreating && !driver;
  const isTerminated = driver?.status === 'terminated';
  const showEditableFields = (isEditing || isCreateMode) && !isTerminated;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* HEADER */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 ${getAvatarColor(isCreateMode ? null : driver?.name)}`}>
            {isCreateMode ? '+' : getInitials(driver?.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900">
                  {isCreateMode ? t('drivers.new_driver') : formatDriverName(driver?.name)}
                </h3>
                {isCreateMode ? (
                  <span className="text-xs text-gray-400 italic">{t('drivers.id_auto_assigned')}</span>
                ) : (
                  <>
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      driver?.nationality_group === 'EU' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {driver?.nationality_group === 'EU' ? 'EU' : 'non-EU'}
                    </span>
                  </>
                )}
              </div>
              {/* Top-right action area */}
              {!isCreateMode && !isEditing && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                   <span className="text-xs text-gray-400">{formatDriverId(driver)}</span>
                   {driver?.status === 'terminated' ? (
                    <button
                      onClick={() => setShowRestoreModal(true)}
                      title={t('drivers.restore_driver')}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        {t('common.restore')}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowArchiveModal(true)}
                      title={t('drivers.archive_driver')}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isCreateMode && (
              <div className="flex items-center gap-3">
                {(() => { const sc = statusConfig[driver?.status] || statusConfig.active; return (
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${sc.bg}`}>{sc.label}</span>
                ); })()}
                <div className="relative w-12 h-12">
                  <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-200" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeDasharray={`${readinessPct} 100`}
                      className={readinessPct >= 80 ? 'text-green-500' : readinessPct >= 50 ? 'text-amber-500' : 'text-red-500'}
                      style={{ transition: 'all 300ms' }}
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-gray-800">
                    {readinessPct}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={(newTab) => {
        if (isCreateMode) return; // Block tab switching in create mode
        if (isEditing || documentsEditing) {
          setPendingTab(newTab);
          setShowUnsavedModal(true);
        } else {
          setActiveTab(newTab);
        }
      }} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="flex-shrink-0 w-full justify-start border-b bg-transparent p-0 rounded-none h-auto">
          <TabsTrigger value="overview" className="rounded-none">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="documents" className={cn("rounded-none", isCreateMode && "opacity-40 cursor-not-allowed")} disabled={isCreateMode}>{t('tabs.documents')}</TabsTrigger>
          <TabsTrigger value="comments" className={cn("rounded-none", isCreateMode && "opacity-40 cursor-not-allowed")} disabled={isCreateMode}>{t('tabs.comments')}</TabsTrigger>
          <TabsTrigger value="history" className={cn("rounded-none", isCreateMode && "opacity-40 cursor-not-allowed")} disabled={isCreateMode}>{t('tabs.history')}</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="p-0">
            {incompleteFields.length > 0 && !isCreateMode && (
              <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                {t('drivers.incomplete_data_warning')} {incompleteFields.map(f => {
                  const keyMap = {
                    country_code: 'fields.citizenship',
                    date_of_birth: 'fields.date_of_birth',
                    phone: 'fields.phone',
                    passport_number: 'fields.passport_number',
                    driving_license_number: 'fields.driving_license',
                    bank: 'drivers.bank_details',
                  };
                  return keyMap[f.field] ? t(keyMap[f.field]) : f.label;
                }).join(', ')}
              </div>
            )}

            {/* Edit / Save buttons */}
            <div className="flex justify-end px-4 pt-3 mb-1">
              {showEditableFields ? (
                <div className="flex gap-2">
                  <button onClick={handleCancel} disabled={isSaving} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 disabled:opacity-50">
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !formData.name?.trim()}
                    className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                    ) : t('common.save')}
                  </button>
                </div>
              ) : (
                !isTerminated && (
                  <button onClick={() => setIsEditing(true)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                     <Pencil className="w-3.5 h-3.5" /> {t('common.edit')}
                   </button>
                )
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {/* SECTION 1: Личные данные */}
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">{t('drivers.personal_data')}</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">

                  {/* Имя */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.name')} <span className="text-red-500">*</span></p>
                    {showEditableFields ? (
                      <Input value={formData.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{formatDriverName(driver?.name) || '—'}</p>
                    )}
                  </div>

                  {/* Дата рождения */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.date_of_birth')}</p>
                    {showEditableFields ? (
                      <Input
                        type="text"
                        placeholder={t('common.date_placeholder')}
                        value={formData._dob_display || ''}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d.]/g, '');
                          if (val.length === 2 && !val.includes('.')) val += '.';
                          if (val.length === 5 && val.split('.').length === 2) val += '.';
                          if (val.length > 10) val = val.slice(0, 10);
                          handleFieldChange('_dob_display', val);
                          const match = val.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                          if (match) {
                            const [, dd, mm, yyyy] = match;
                            const day = parseInt(dd), month = parseInt(mm), year = parseInt(yyyy);
                            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1940 && year <= 2010) {
                              handleFieldChange('date_of_birth', `${yyyy}-${mm}-${dd}`);
                            }
                          }
                        }}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.date_of_birth ? formatDate(driver.date_of_birth) : '—'}</p>
                    )}
                  </div>

                  {/* Гражданство (no asterisk) */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.citizenship')}</p>
                    {showEditableFields ? (
                      <CountryCombobox
                        value={formData.country_code || ''}
                        onChange={(code) => {
                          handleFieldChange('country_code', code);
                          handleFieldChange('nationality_group', isEUCountry(code) ? 'EU' : 'non-EU');
                        }}
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {(() => {
                          const c = getCountryByCode(driver?.country_code);
                          if (c) return `${c.flag} ${c.name}`;
                          return <span className="text-gray-400">{t('common.not_specified')}</span>;
                        })()}
                      </p>
                    )}
                  </div>

                  {/* Rodné číslo */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.rodne_cislo')}</p>
                    {showEditableFields ? (
                      <Input value={formData.rodne_cislo || ''} onChange={(e) => handleFieldChange('rodne_cislo', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.rodne_cislo || '—'}</p>
                    )}
                  </div>

                  {/* Телефон */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.phone')}</p>
                    {showEditableFields ? (
                      <Input value={formData.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.phone || '—'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.email')}</p>
                    {showEditableFields ? (
                      <Input value={formData.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.email || '—'}</p>
                    )}
                  </div>

                  {/* Статус — hidden in create mode */}
                  {!isCreateMode && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">{t('fields.status')}</p>
                         {isEditing ? (
                           <Select value={formData.status || ''} onValueChange={(val) => handleFieldChange('status', val)}>
                             <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="active">{t('drivers.status_active')}</SelectItem>
                               <SelectItem value="inactive">{t('drivers.status_inactive')}</SelectItem>
                               <SelectItem value="on_leave">{t('drivers.status_on_leave')}</SelectItem>
                               <SelectItem value="terminated">{t('drivers.status_fired')}</SelectItem>
                             </SelectContent>
                           </Select>
                        ) : (
                          <p className={`font-medium ${driver?.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
                            {statusConfig[driver?.status]?.label || '—'}
                          </p>
                        )}
                      </div>
                      <div />
                    </>
                  )}

                  {/* Адрес */}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.address_cz')}</p>
                    {showEditableFields ? (
                      <Input value={formData.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.address || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Банковские реквизиты */}
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">{t('drivers.bank_details')}</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.bank')}</p>
                    {showEditableFields ? (
                      <Input value={formData.bank_name || ''} onChange={(e) => handleFieldChange('bank_name', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.bank_name || '—'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('fields.iban')}</p>
                    {showEditableFields ? (
                      <Input value={formData.bank_account || ''} onChange={(e) => handleFieldChange('bank_account', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.bank_account || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="p-0">
            <DriverDocumentsTabContent driver={driver} documents={documents} onDocumentsChange={onSave} onEditingChange={setDocumentsEditing} />
          </TabsContent>

          {/* COMMENTS TAB */}
          <TabsContent value="comments" className="p-4">
            <DriverCommentsTab driver={driver} isTerminated={isTerminated} />
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="p-4">
            <DriverHistoryTab driver={driver} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Restore confirmation modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dialogs.restore_title')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('dialogs.restore_message', { name: formatDriverName(driver?.name) })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                disabled={isRestoring}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRestore}
                disabled={isRestoring}
                className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRestoring ? t('common.restoring') : t('common.restore')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive confirmation modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dialogs.archive_title')}</h3>
            <p className="text-sm text-gray-600 mb-1">
              {t('dialogs.archive_message', { name: formatDriverName(driver?.name) })}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {t('dialogs.archive_description')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={isArchiving}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="text-sm bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isArchiving ? t('common.archiving') : t('common.archive')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved changes modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dialogs.unsaved_title')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('dialogs.unsaved_message')}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setDocumentsEditing(false);
                  setActiveTab(pendingTab);
                  setShowUnsavedModal(false);
                  setPendingTab(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                {t('dialogs.discard')}
              </button>
              <button
                onClick={() => { setShowUnsavedModal(false); setPendingTab(null); }}
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700"
              >
                {t('dialogs.stay')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}