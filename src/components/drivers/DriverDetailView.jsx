import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import DriverDocumentsTabContent from './DriverDocumentsTabContent';
import DriverCommentsTab from './DriverCommentsTab';
import DriverHistoryTab from './DriverHistoryTab';
import DriverDocumentBadges from './DriverDocumentBadges';
import TagSelector from './TagSelector';
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
import { useMembership } from '@/lib/MembershipContext';
import { hasPermission } from '@/lib/permissions';
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
  company_id: '',
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
  const { permissions, companyId } = useMembership();
  const { t } = useTranslation();
  const { tagMap, archiveTags, tags: allTags } = useDriverTags();

  const statusConfig = {
    candidate: { bg: 'bg-purple-100 text-purple-700', label: t('drivers.status_candidate') },
    active:    { bg: 'bg-green-100 text-green-700',   label: t('drivers.status_active') },
    archived:  { bg: 'bg-gray-100 text-gray-500',     label: t('drivers.status_archived') },
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pendingTab, setPendingTab] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveReasonTagId, setArchiveReasonTagId] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [formData, setFormData] = useState({});

  // Reset form when switching drivers or entering create mode
  useEffect(() => {
    if (isCreating && !driver) {
      setFormData({ ...EMPTY_FORM, company_id: companyId || '' });
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
  }, [driver, isCreating, companyId]);

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
        if (!companyId) {
          toast.error('Company not found. Cannot create driver.');
          setIsSaving(false);
          return;
        }
        const allDrivers = await Driver.filter({ company_id: companyId });
        const maxNum = Math.max(0, ...allDrivers.map(d => d.internal_number || 0));
        const newDriver = await Driver.create({ ...dataToSave, company_id: companyId, internal_number: maxNum + 1 });
        
        // Create history for new driver
        await base44.entities.DriverHistory.create({
          driver_id: newDriver.id,
          company_id: companyId,
          action: 'created',
          description: t('history.driver_created', { id: String(newDriver.internal_number).padStart(5, '0') }),
          changed_by: currentUser?.display_name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Unknown'
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
              company_id: companyId,
              action: field === 'status' ? 'status_changed' : 'updated',
              field_name: field,
              old_value: String(oldVal || ''),
              new_value: String(newVal || ''),
              description: buildDescription(field, oldVal, newVal, t),
              changed_by: currentUser?.display_name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Unknown'
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
      const existingTags = driver.tags || [];
      const newTags = archiveReasonTagId && !existingTags.includes(archiveReasonTagId)
        ? [...existingTags, archiveReasonTagId]
        : existingTags;
      const update = {
        ...driver,
        status: 'archived',
        archive_reason_tag_id: archiveReasonTagId || null,
        tags: newTags,
      };
      await Driver.update(driver.id, update);
      await base44.entities.DriverHistory.create({
        driver_id: driver.id,
        company_id: companyId,
        action: 'archived',
        field_name: 'status',
        old_value: driver.status,
        new_value: 'archived',
        description: t('toasts.driver_archived'),
        changed_by: currentUser?.display_name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Unknown'
      });
      toast.success(t('toasts.driver_archived'));
      setShowArchiveModal(false);
      setArchiveReasonTagId('');
      if (onSave) onSave(update);
    } catch (error) {
      toast.error(t('toasts.archive_error'));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const archiveReasonId = driver.archive_reason_tag_id;
      const cleanedTags = (driver.tags || []).filter(id => id !== archiveReasonId);
      const update = {
        ...driver,
        status: 'active',
        archive_reason_tag_id: null,
        tags: cleanedTags,
      };
      await Driver.update(driver.id, update);
      await base44.entities.DriverHistory.create({
        driver_id: driver.id,
        company_id: companyId,
        action: 'restored',
        field_name: 'status',
        old_value: 'archived',
        new_value: 'active',
        description: t('toasts.driver_restored', { name: formatDriverName(driver.name) }),
        changed_by: currentUser?.display_name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Unknown'
      });
      toast.success(t('toasts.driver_restored', { name: formatDriverName(driver.name) }));
      setShowRestoreModal(false);
      if (onSave) onSave(update);
    } catch (error) {
      toast.error(t('toasts.restore_error'));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleTagToggle = async (tagId) => {
    const currentTags = driver?.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    const update = { ...driver, tags: newTags };
    await Driver.update(driver.id, update);
    if (onSave) onSave(update);
  };

  const isCreateMode = isCreating && !driver;
  const isArchived = driver?.status === 'archived';
  const canEdit = hasPermission(permissions, 'driver_edit');
  const showEditableFields = (isEditing || isCreateMode) && !isArchived && canEdit;

  // Left border accent color based on status
  const borderAccent = isCreateMode ? 'border-l-4 border-blue-400'
    : driver?.status === 'active'    ? 'border-l-4 border-green-500'
    : driver?.status === 'candidate' ? 'border-l-4 border-amber-500'
    : 'border-l-4 border-gray-400';

  // Days as candidate
  const daysAsCandidate = driver?.status === 'candidate' && driver?.created_date
    ? Math.floor((Date.now() - new Date(driver.created_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const countryFlag = getCountryByCode(driver?.country_code)?.flag || '';

  return (
    <div className={`h-full flex flex-col bg-white ${borderAccent} ${isArchived ? 'opacity-[0.65]' : ''}`}>
      {/* HEADER */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-start gap-3">

          {/* Left col: Avatar + DRV number */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${getAvatarColor(isCreateMode ? null : driver?.name)}`}>
              {isCreateMode ? '+' : getInitials(driver?.name)}
            </div>
            {!isCreateMode && (
              <span className="text-[10px] text-gray-400 font-mono">{formatDriverId(driver)}</span>
            )}
          </div>

          {/* Right col */}
          <div className="flex-1 min-w-0">

            {/* Row 1: Name + flag + action buttons */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-xl font-medium text-gray-900 truncate">
                  {isCreateMode ? t('drivers.new_driver') : formatDriverName(driver?.name)}
                </h3>
                {isCreateMode ? (
                  <span className="text-xs text-gray-400 italic flex-shrink-0">{t('drivers.id_auto_assigned')}</span>
                ) : (
                  countryFlag && <span className="text-lg leading-none flex-shrink-0">{countryFlag}</span>
                )}
              </div>
              {/* Archive / Restore button */}
              {!isCreateMode && !isEditing && hasPermission(permissions, 'driver_delete') && (
                <div className="flex-shrink-0">
                  {isArchived ? (
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

            {/* Row 2: Readiness / Candidate days + separator + tags + "+" */}
            {!isCreateMode && (
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {daysAsCandidate !== null ? (
                  <span className="text-xs text-purple-600 font-medium">
                    {t('drivers.days_as_candidate', { count: daysAsCandidate })}
                  </span>
                ) : isArchived ? (
                  <span className="text-xs text-gray-500">{t('drivers.status_archived')}</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-[100px] h-[5px] bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${readinessPct >= 80 ? 'bg-green-500' : readinessPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${readinessPct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${readinessPct >= 80 ? 'text-green-600' : readinessPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {readinessPct}%
                    </span>
                  </div>
                )}

                <div className="w-px h-4 bg-gray-300 flex-shrink-0" />

                {/* Tag pills */}
                {isArchived ? (
                  // Archived: show archive reason tag only
                  driver?.archive_reason_tag_id && tagMap[driver.archive_reason_tag_id] && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagMap[driver.archive_reason_tag_id].color}`}>
                      {t(tagMap[driver.archive_reason_tag_id].label_key)}
                    </span>
                  )
                ) : (
                  <>
                    {(driver?.tags || []).map(tagId => {
                       const tag = tagMap[tagId];
                       if (!tag) return null;
                       return (
                         <span key={tagId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.color}`}>
                           {t(tag.label_key)}
                         </span>
                       );
                     })}
                     {hasPermission(permissions, 'driver_tags') && <TagSelector driver={driver} allTags={allTags} onTagToggle={handleTagToggle} />}
                  </>
                )}
              </div>
            )}

            {/* Row 3: Document badges */}
            {!isCreateMode && (
              <DriverDocumentBadges driver={driver} documents={documents} size="sm" />
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={(newTab) => {
        if (isCreateMode) return; // Block tab switching in create mode
        if (isEditing) {
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
                 !isArchived && canEdit && (
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
                        {isEditing && hasPermission(permissions, 'driver_status') ? (
                          <Select value={formData.status || ''} onValueChange={(val) => handleFieldChange('status', val)}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="candidate">{t('drivers.status_candidate')}</SelectItem>
                              <SelectItem value="active">{t('drivers.status_active')}</SelectItem>
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
            <DriverDocumentsTabContent driver={driver} documents={documents} onDocumentsChange={onSave} />
          </TabsContent>

          {/* COMMENTS TAB */}
          <TabsContent value="comments" className="p-4">
            <DriverCommentsTab driver={driver} isTerminated={isArchived} />
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
            {/* Archive reason */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('dialogs.archive_reason')}</label>
              <select
                value={archiveReasonTagId}
                onChange={e => setArchiveReasonTagId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">{t('dialogs.archive_reason_none')}</option>
                {archiveTags.map(tag => (
                  <option key={tag.id} value={tag.id}>{t(tag.label_key)}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowArchiveModal(false); setArchiveReasonTagId(''); }}
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