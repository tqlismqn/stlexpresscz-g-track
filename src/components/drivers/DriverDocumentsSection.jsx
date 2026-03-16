import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import DocumentBadge from './DocumentBadge';

const docTypeLabels = {
  work_contract: 'Трудовой договор',
  transport_licence: 'Лицензия на транспорт',
  a1_certificate: 'Сертификат A1',
  declaration: 'Декларация',
  insurance: 'Страховка',
  travel_insurance: 'Путешественческая страховка',
  visa: 'Виза',
  passport: 'Паспорт',
  driver_license: 'Водительское удостоверение',
  medical_certificate: 'Медицинское свидетельство',
  psihotest: 'Психотест',
  adr_certificate: 'Сертификат ADR',
  chip_card: 'Чип-карта',
  code95: 'Код 95'
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

export default function DriverDocumentsSection({ documents, driver }) {
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    documents: true,
    bankDetails: false,
    additionalData: false
  });

  const isNonEU = driver?.nationality_group === 'non-EU';
  const requiredDocs = isNonEU ? requiredNonEU : requiredEU;

  const docsByCategory = useMemo(() => {
    const required = [];
    const opt = [];

    requiredDocs.forEach(docType => {
      const doc = documents.find(d => d.document_type === docType);
      required.push({
        docType,
        doc,
        isRequired: true
      });
    });

    optional.forEach(docType => {
      const doc = documents.find(d => d.document_type === docType);
      opt.push({
        docType,
        doc,
        isRequired: false
      });
    });

    return { required, optional: opt };
  }, [documents, requiredDocs]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderSection = (title, sectionKey, children, alwaysOpen = false) => (
    <div className="border-b">
      <button
        onClick={() => !alwaysOpen && toggleSection(sectionKey)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
      >
        <h4 className="font-semibold text-gray-900">{title}</h4>
        {!alwaysOpen && (
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections[sectionKey] ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>
      {(alwaysOpen || expandedSections[sectionKey]) && (
        <div className="px-4 pb-4 space-y-3 bg-gray-50">{children}</div>
      )}
    </div>
  );

  return (
    <div className="divide-y">
      {renderSection('Основная информация', 'basicInfo', (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-600">Статус</p>
            <p className="font-medium">{driver?.status === 'active' ? 'Активный' : 'Неактивный'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Национальность</p>
            <p className="font-medium">{driver?.nationality_group === 'EU' ? 'ЕС' : 'Не-ЕС'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Место работы</p>
            <p className="font-medium capitalize">{driver?.misto_vykonu_prace || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Дата рождения</p>
            <p className="font-medium">{driver?.date_of_birth || '-'}</p>
          </div>
        </div>
      ), true)}

      {renderSection('Документы', 'documents', (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Обязательные</p>
            <div className="space-y-2">
              {docsByCategory.required.map(({ docType, doc }) => (
                <DocumentBadge
                  key={docType}
                  label={docTypeLabels[docType]}
                  status={doc?.status || 'missing'}
                  expiryDate={doc?.expiry_date}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Дополнительные</p>
            <div className="space-y-2">
              {docsByCategory.optional.map(({ docType, doc }) => (
                <DocumentBadge
                  key={docType}
                  label={docTypeLabels[docType]}
                  status={doc?.status || 'missing'}
                  expiryDate={doc?.expiry_date}
                />
              ))}
            </div>
          </div>
        </div>
      ), true)}

      {renderSection('Банковские данные', 'bankDetails', (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-600">Банк</p>
            <p className="font-medium">{driver?.bank_name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Счёт</p>
            <p className="font-medium">{driver?.bank_account || '-'}</p>
          </div>
        </div>
      ), false)}

      {renderSection('Дополнительные данные', 'additionalData', (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-600">Номер паспорта</p>
            <p className="font-medium">{driver?.passport_number || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Номер водительского удостоверения</p>
            <p className="font-medium">{driver?.driving_license_number || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Адрес</p>
            <p className="font-medium text-xs">{driver?.address || '-'}</p>
          </div>
        </div>
      ), false)}
    </div>
  );
}