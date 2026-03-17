import React, { useMemo, useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, XCircle, MinusCircle, Clock, FileText, ChevronRight, Edit2, Check, ChevronsUpDown } from 'lucide-react';
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
import { countries, getCountryByCode, isEUCountry } from "@/lib/countries";

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

const docTypeLabels = {
  work_contract: 'Трудовой договор',
  transport_licence: 'Лицензия на транспорт',
  a1_certificate: 'Сертификат A1',
  declaration: 'Декларация',
  insurance: 'Страховка',
  travel_insurance: 'Путешественническая страховка',
  visa: 'Виза',
  passport: 'Паспорт',
  driver_license: 'Водительское удостоверение',
  medical_certificate: 'Медицинское свидетельство',
  psihotest: 'Психотест',
  adr_certificate: 'Сертификат ADR',
  chip_card: 'Чип-карта',
  code95: 'Код 95'
};

const visaTypeMap = {
  'povoleni_k_pobytu': 'Povolení k pobytu',
  'vizum': 'Vízum',
  'docasna_ochrana': 'Dočasná ochrana',
  'trvaly_pobyt': 'Trvalý pobyt',
  'vizum_strpeni': 'Vízum strpění',
};

const mistoVykonuPraceMap = {
  'praha': 'Прага',
  'kladno': 'Кладно',
};

const documentStatusIcons = {
  valid: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  expiring: <AlertCircle className="w-4 h-4 text-orange-500" />,
  expired: <XCircle className="w-4 h-4 text-red-500" />,
  missing: <MinusCircle className="w-4 h-4 text-gray-400" />,
  pending_renewal: <Clock className="w-4 h-4 text-blue-500" />,
};

const requiredNonEU = [
  'work_contract', 'transport_licence', 'a1_certificate', 'declaration',
  'insurance', 'travel_insurance', 'visa', 'passport', 'driver_license',
  'medical_certificate', 'psihotest'
];

const requiredEU = [
  'work_contract', 'a1_certificate', 'declaration', 'insurance',
  'passport', 'driver_license', 'medical_certificate', 'psihotest'
];

const optional = ['adr_certificate', 'chip_card', 'code95'];

const documentAbbreviations = {
  work_contract: 'CON',
  transport_licence: 'LIC',
  a1_certificate: 'A1',
  declaration: 'DEC',
  insurance: 'INS',
  travel_insurance: 'TIN',
  visa: 'VISA',
  passport: 'PAS',
  driver_license: 'DL',
  medical_certificate: 'MED',
  psihotest: 'PSI',
  adr_certificate: 'ADR',
  chip_card: 'CHIP',
  code95: 'C95'
};

const getStatusColor = (status) => {
  switch (status) {
    case 'valid':
      return 'text-green-500';
    case 'expiring':
      return 'text-amber-500';
    case 'expired':
      return 'text-red-500';
    case 'pending_renewal':
      return 'text-blue-500';
    case 'missing':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

function CountryCombobox({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const selected = getCountryByCode(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full h-8 justify-between text-sm font-normal">
          {selected ? `${selected.name} (${selected.code})` : "Выберите страну..."}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск страны..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Страна не найдена</CommandEmpty>
            <CommandGroup>
              {filtered.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} (${c.code})`}
                  onSelect={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.code ? "opacity-100" : "opacity-0")} />
                  {c.name} ({c.code}) {c.isEU ? '🇪🇺' : ''}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function DriverDetailView({ driver, documents = [], onSave }) {
  const [expandedSections, setExpandedSections] = useState({
    bankDetails: false,
    additionalData: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (driver) setFormData({
      ...driver,
      name: formatDriverName(driver.name),
      _dob_display: driver.date_of_birth ? formatDateFns(new Date(driver.date_of_birth), "dd.MM.yyyy") : ''
    });
  }, [driver]);

  const readinessPct = driver?.trip_readiness_pct || 0;
  const isNonEU = driver?.nationality_group === 'non-EU';

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    return days < 0 ? `Просрочено на ${Math.abs(days)} дн.` : `Осталось ${days} дн.`;
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const { _dob_display, ...restData } = formData;
      const dataToSave = { ...restData, name: reverseFormatDriverName(restData.name) };
      await Driver.update(dataToSave.id, dataToSave);
      setIsEditing(false);
      if (onSave) onSave(dataToSave);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const categorizedDocuments = useMemo(() => {
    const requiredDocs = isNonEU ? requiredNonEU : requiredEU;
    const docsMap = new Map(documents.map(d => [d.document_type, d]));

    const required = requiredDocs.map(docType => ({
      type: docType,
      label: docTypeLabels[docType],
      doc: docsMap.get(docType) || null,
      status: docsMap.get(docType)?.status || 'missing'
    }));

    const opt = optional
      .map(docType => ({
        type: docType,
        label: docTypeLabels[docType],
        doc: docsMap.get(docType) || null,
        status: docsMap.get(docType)?.status || 'missing'
      }))
      .filter(item => item.doc);

    return { required, optional: opt };
  }, [documents, isNonEU]);

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
              <span className="text-xs text-gray-500">DRV-{driver?.id?.slice(-4)}</span>
              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                driver?.nationality_group === 'EU'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {driver?.nationality_group === 'EU' ? 'EU' : 'non-EU'}
              </span>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-auto flex items-center gap-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  <Edit2 className="w-3 h-3" />
                  Изменить
                </button>
              ) : (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => { setFormData({ ...driver }); setIsEditing(false); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Сохранить
                  </button>
                </div>
              )}
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
      <Tabs defaultValue="overview" className="flex-1 min-h-0 flex flex-col">
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
                      <p className="font-medium text-gray-900">{driver?.date_of_birth || '—'}</p>
                    )}
                  </div>

                  {/* Row 2: Национальность | Rodné číslo */}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Национальность</p>
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
                        {getCountryByCode(driver?.country_code)?.name || driver?.nationality_group || '—'}
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
          <TabsContent value="documents" className="p-4">
            <div className="space-y-4">
              {/* Required */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Обязательные</p>
                <div className="space-y-2">
                  {categorizedDocuments.required.map(({ type, label, doc, status }) => (
                    <div key={type} className="flex items-center gap-2 text-xs text-gray-800 bg-gray-50 p-2 rounded">
                      <div className="flex-shrink-0">{documentStatusIcons[status]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{label}</p>
                        <p className="text-gray-600">
                          {doc?.document_number ? `№${doc.document_number}` : '—'}
                          {doc?.issue_date && ` | ${format(new Date(doc.issue_date), 'dd.MM.yyyy', { locale: ru })}`}
                          {doc?.expiry_date && ` → ${format(new Date(doc.expiry_date), 'dd.MM.yyyy', { locale: ru })}`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {doc?.expiry_date && (
                          <p className={`text-xs font-medium ${status === 'expiring' ? 'text-amber-600' : status === 'expired' ? 'text-red-600' : 'text-gray-500'}`}>
                            {getDaysLeft(doc.expiry_date)}
                          </p>
                        )}
                        {doc?.file_url && <FileText className="w-3 h-3 text-blue-500 mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional */}
              {categorizedDocuments.optional.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Дополнительные</p>
                  <div className="space-y-2">
                    {categorizedDocuments.optional.map(({ type, label, doc, status }) => (
                      <div key={type} className="flex items-center gap-2 text-xs text-gray-800 bg-gray-50 p-2 rounded">
                        <div className="flex-shrink-0">{documentStatusIcons[status]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{label}</p>
                          <p className="text-gray-600">
                            {doc?.document_number ? `№${doc.document_number}` : '—'}
                            {doc?.issue_date && ` | ${format(new Date(doc.issue_date), 'dd.MM.yyyy', { locale: ru })}`}
                            {doc?.expiry_date && ` → ${format(new Date(doc.expiry_date), 'dd.MM.yyyy', { locale: ru })}`}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {doc?.expiry_date && (
                            <p className={`text-xs font-medium ${status === 'expiring' ? 'text-amber-600' : status === 'expired' ? 'text-red-600' : 'text-gray-500'}`}>
                              {getDaysLeft(doc.expiry_date)}
                            </p>
                          )}
                          {doc?.file_url && <FileText className="w-3 h-3 text-blue-500 mt-1" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
    </div>
  );
}