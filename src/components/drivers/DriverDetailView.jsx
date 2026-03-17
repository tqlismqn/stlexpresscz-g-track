import React, { useState, useEffect } from 'react';
import { Edit2, Check, ChevronsUpDown, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import DriverDocumentsTabContent from './DriverDocumentsTabContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format as formatDateFns } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getCountryByCode, isEUCountry, getSortedCountries } from "@/lib/countries";
import { getIncompleteFields } from '@/lib/dataCompleteness';
import { formatDriverId } from '@/lib/driverUtils';

const Driver = base44.entities.Driver;

const statusConfig = {
  active:     { bg: 'bg-green-100 text-green-700', label: 'Активный' },
  inactive:   { bg: 'bg-amber-100 text-amber-700', label: 'Неактивный' },
  on_leave:   { bg: 'bg-blue-100 text-blue-700',   label: 'В отпуске' },
  terminated: { bg: 'bg-gray-100 text-gray-500',   label: 'Уволен' }
};

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
  if (!name) return 'bg-gray-500';
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const index = Math.abs(hash % avatarColors.length);
  return avatarColors[index];
};

const getInitials = (name) => {
  if (!name) return '??';
  const formatted = formatDriverName(name);
  const parts = formatted.split(' ');
  let initials = parts[0]?.[0] || '';
  if (parts.length > 1) initials += parts[parts.length - 1]?.[0] || '';
  return initials.toUpperCase();
};



function CountryCombobox({ value, onChange }) {
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
          {selected ? `${selected.flag} ${selected.name}` : "Выберите страну..."}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск страны..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Страна не найдена</CommandEmpty>
            {filteredPinned.length > 0 && (
              <CommandGroup heading="Основные">
                {filteredPinned.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.code}`}
                    onSelect={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === c.code ? "opacity-100" : "opacity-0")} />
                    {c.flag} {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredRest.length > 0 && (
              <CommandGroup heading="Все страны">
                {filteredRest.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.code}`}
                    onSelect={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                  >
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

export default function DriverDetailView({ driver, documents = [], onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [documentsEditing, setDocumentsEditing] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (driver) setFormData({
      ...driver,
      name: formatDriverName(driver.name),
      _dob_display: driver.date_of_birth ? formatDateFns(new Date(driver.date_of_birth), "dd.MM.yyyy") : ''
    });
  }, [driver]);

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
      await Driver.update(dataToSave.id, dataToSave);
      setIsEditing(false);
      if (onSave) onSave(dataToSave);
      toast.success('✓ Изменения сохранены');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('✗ Ошибка сохранения. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="h-full flex flex-col bg-white">
      {/* HEADER */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 ${getAvatarColor(driver?.name)}`}>
            {getInitials(driver?.name)}
          </div>

          {/* Name, DRV-ID, Nationality, Edit Button */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">{formatDriverName(driver?.name)}</h3>
              <span className="text-xs text-gray-500">{formatDriverId(driver)}</span>
              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                driver?.nationality_group === 'EU'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {driver?.nationality_group === 'EU' ? 'EU' : 'non-EU'}
              </span>

            </div>

            {/* Status + Readiness */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                driver?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {driver?.status === 'active' ? 'Активный' : 'Неактивный'}
              </span>

              {/* Circular readiness indicator */}
              <div className="relative w-12 h-12">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-200" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={(newTab) => {
  if (isEditing || documentsEditing) {
    setPendingTab(newTab);
    setShowUnsavedModal(true);
  } else {
    setActiveTab(newTab);
  }
}} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="flex-shrink-0 w-full justify-start border-b bg-transparent p-0 rounded-none h-auto">
            <TabsTrigger value="overview" className="rounded-none">Обзор</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-none">Документы</TabsTrigger>
            <TabsTrigger value="comments" className="rounded-none">Комментарии</TabsTrigger>
            <TabsTrigger value="history" className="rounded-none">История</TabsTrigger>
          </TabsList>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          {/* TAB 1: Обзор (Overview) */}
          <TabsContent value="overview" className="p-0">
            {incompleteFields.length > 0 && (
              <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                ⚠ Неполные данные: {incompleteFields.map(f => f.label).join(', ')}
              </div>
            )}
            <div className="flex justify-end px-4 pt-3 mb-1">
              {isEditing ? (
                <div className="flex gap-2">
                  <button onClick={() => { setFormData({ ...driver }); setIsEditing(false); }} disabled={isSaving} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 disabled:opacity-50">Отмена</button>
                  <button onClick={handleSave} disabled={isSaving} className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                    {isSaving ? (<><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Сохранение...</>) : 'Сохранить'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Изменить
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100">

              {/* SECTION 1: Личные данные */}
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Личные данные</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  {/* Row 1: Имя | Дата рождения */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Имя</p>
                    {isEditing ? (
                      <Input value={formData.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{formatDriverName(driver?.name) || '—'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Дата рождения</p>
                    {isEditing ? (
                      <Input
                        type="text"
                        placeholder="ДД.ММ.ГГГГ"
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

                  {/* Row 2: Национальность | Rodné číslo */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Гражданство</p>
                    {isEditing ? (
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
                          return <span className="text-gray-400">Не указано</span>;
                        })()}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Rodné číslo</p>
                    {isEditing ? (
                      <Input value={formData.rodne_cislo || ''} onChange={(e) => handleFieldChange('rodne_cislo', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.rodne_cislo || '—'}</p>
                    )}
                  </div>

                  {/* Row 3: Телефон | Email */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Телефон</p>
                    {isEditing ? (
                      <Input value={formData.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.phone || '—'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    {isEditing ? (
                      <Input value={formData.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.email || '—'}</p>
                    )}
                  </div>

                  {/* Row 4: Статус | empty */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Статус</p>
                    {isEditing ? (
                      <Select value={formData.status || ''} onValueChange={(val) => handleFieldChange('status', val)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активный</SelectItem>
                          <SelectItem value="inactive">Неактивный</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className={`font-medium ${driver?.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
                        {driver?.status === 'active' ? 'Активный' : 'Неактивный'}
                      </p>
                    )}
                  </div>
                  <div />

                  {/* Full width: Адрес */}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Адрес / Прописка CZ</p>
                    {isEditing ? (
                      <Input value={formData.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.address || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Банковские реквизиты */}
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Банковские реквизиты</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Банк</p>
                    {isEditing ? (
                      <Input value={formData.bank_name || ''} onChange={(e) => handleFieldChange('bank_name', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.bank_name || '—'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Счёт / IBAN</p>
                    {isEditing ? (
                      <Input value={formData.bank_account || ''} onChange={(e) => handleFieldChange('bank_account', e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="font-medium text-gray-900">{driver?.bank_account || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </TabsContent>

          {/* TAB 2: Документы (Documents) */}
          <TabsContent value="documents" className="p-0">
            <DriverDocumentsTabContent driver={driver} documents={documents} onDocumentsChange={onSave} onEditingChange={setDocumentsEditing} />
          </TabsContent>

          {/* TAB 3: Комментарии (Comments) */}
          <TabsContent value="comments" className="p-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Комментарии и заметки</h4>
              <p className="text-sm text-gray-500">Пока нет записей.</p>
            </div>
          </TabsContent>

          {/* TAB 4: История (History) */}
          <TabsContent value="history" className="p-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">История изменений</h4>
              <p className="text-sm text-gray-500">Пока нет записей.</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    {showUnsavedModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Несохранённые изменения</h3>
          <p className="text-sm text-gray-600 mb-4">У вас есть несохранённые изменения. Сохранить перед переключением?</p>
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
              Не сохранять
            </button>
            <button
              onClick={() => {
                setShowUnsavedModal(false);
                setPendingTab(null);
              }}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700"
            >
              Остаться
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}