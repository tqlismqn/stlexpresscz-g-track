import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

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

export default function ExpiringDocumentsWidget({ activeDrivers = [] }) {
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const docs = await base44.entities.DriverDocument.list();
        const drivers = activeDrivers.length > 0 ? activeDrivers : await base44.entities.Driver.list();
        const driverMap = new Map(drivers.map(d => [d.id, d]));
        const activeDriverIds = new Set(drivers.filter(d => d.status === 'active').map(d => d.id));

        const expiring = docs
          .filter(d => d.status === 'expiring' && activeDriverIds.has(d.driver_id))
          .map(d => ({
            ...d,
            driverName: driverMap.get(d.driver_id)?.name || 'Unknown'
          }))
          .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
          .slice(0, 10);

        setExpiringDocs(expiring);
      } catch (error) {
        console.error('Error loading expiring documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeDrivers]);

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-orange-600" />
        <h2 className="text-lg font-semibold text-gray-900">Истекающие документы</h2>
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {expiringDocs.length === 0 ? (
          <p className="text-gray-500 text-sm">Нет истекающих документов</p>
        ) : (
          expiringDocs.map(doc => {
            const daysLeft = doc.expiry_date ? differenceInDays(new Date(doc.expiry_date), new Date()) : null;
            return (
              <div key={doc.id} className="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-200">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{doc.driverName}</p>
                  <p className="text-xs text-gray-600">{docTypeLabels[doc.document_type]}</p>
                </div>
                <p className="text-xs font-medium text-amber-600 ml-2 flex-shrink-0">
                  {daysLeft !== null ? `в ${daysLeft} дн.` : 'N/A'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}