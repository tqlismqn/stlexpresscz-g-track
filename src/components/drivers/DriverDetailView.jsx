import React, { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, XCircle, MinusCircle, Clock, FileText, ChevronRight } from 'lucide-react';

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
  const parts = name.split(' ');
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
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

export default function DriverDetailView({ driver, documents = [] }) {
  const [expandedSections, setExpandedSections] = useState({
    bankDetails: false,
    additionalData: false
  });

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
    <div className="flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 ${getAvatarColor(driver?.name)}`}>
            {getInitials(driver?.name)}
          </div>

          {/* Name, DRV-ID, Nationality */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">{driver?.name}</h3>
              <span className="text-xs text-gray-500">DRV-{driver?.id?.slice(-4)}</span>
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

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {/* SECTION 1: Основная информация */}
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Основная информация</h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Имя</p>
              <p className="font-medium text-gray-900">{driver?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Статус</p>
              <p className={`font-medium ${driver?.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
                {driver?.status === 'active' ? 'Активный' : 'Неактивный'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Национальность</p>
              <p className="font-medium text-gray-900">{driver?.nationality_group === 'EU' ? 'ЕС' : 'Не-ЕС'}</p>
            </div>
            {isNonEU && (
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Тип визы</p>
                <p className="font-medium text-gray-900">{visaTypeMap[driver?.visa_type] || '-'}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Дата рождения</p>
              <p className="font-medium text-gray-900">{driver?.date_of_birth || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Телефон</p>
              <p className="font-medium text-gray-900">{driver?.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Email</p>
              <p className="font-medium text-gray-900">{driver?.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Место работы</p>
              <p className="font-medium text-gray-900">{mistoVykonuPraceMap[driver?.misto_vykonu_prace] || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Pas souhlas</p>
              <p className="font-medium text-gray-900">{driver?.pas_souhlas ? '✓' : '✗'}</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Документы */}
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Документы</h4>
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
        </div>

        {/* SECTION 3: Банковские реквизиты */}
        <div className="border-t">
          <button
            onClick={() => toggleSection('bankDetails')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-semibold text-gray-900 text-sm">Банковские реквизиты</h4>
            <ChevronRight
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedSections.bankDetails ? 'rotate-90' : ''
              }`}
            />
          </button>
          {expandedSections.bankDetails && (
            <div className="px-4 pb-4 space-y-3 text-sm bg-gray-50 border-t">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Банк</p>
                <p className="font-medium text-gray-900">{driver?.bank_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Счёт / IBAN</p>
                <p className="font-medium text-gray-900">{driver?.bank_account || '—'}</p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Дополнительные данные */}
        <div className="border-t">
          <button
            onClick={() => toggleSection('additionalData')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-semibold text-gray-900 text-sm">Дополнительные данные</h4>
            <ChevronRight
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedSections.additionalData ? 'rotate-90' : ''
              }`}
            />
          </button>
          {expandedSections.additionalData && (
            <div className="px-4 pb-4 space-y-3 text-sm bg-gray-50 border-t">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Rodné číslo</p>
                <p className="font-medium text-gray-900">{driver?.rodne_cislo || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Номер паспорта</p>
                <p className="font-medium text-gray-900">{driver?.passport_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Номер ВУ</p>
                <p className="font-medium text-gray-900">{driver?.driving_license_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Адрес / Прописка</p>
                <p className="font-medium text-gray-900">{driver?.address || '—'}</p>
              </div>
              {driver?.status === 'inactive' && (
                <>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Дата увольнения</p>
                    <p className="font-medium text-gray-900">{driver?.fired_date || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Причина увольнения</p>
                    <p className="font-medium text-gray-900">{driver?.fired_reason || '—'}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}