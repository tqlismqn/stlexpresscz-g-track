import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Clock } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';
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
  const navigate = useNavigate();
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
          .map(d => {
            const daysLeft = differenceInDays(new Date(d.expiry_date), new Date());
            return {
              ...d,
              driverName: driverMap.get(d.driver_id)?.name || 'Unknown',
              daysLeft
            };
          })
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
            const daysLeft = doc.daysLeft;
            let bgColor = 'bg-yellow-50';
            let borderColor = 'border-l-yellow-500';
            let textColor = 'text-amber-600';
            let isBold = false;

            if (daysLeft <= 3) {
              bgColor = 'bg-red-50';
              borderColor = 'border-l-red-500';
              textColor = 'text-red-600';
              isBold = true;
            } else if (daysLeft <= 7) {
              bgColor = 'bg-orange-50';
              borderColor = 'border-l-orange-500';
              textColor = 'text-orange-600';
            }

            return (
              <div
                key={doc.id}
                onClick={() => navigate(`/Drivers?select=${doc.driver_id}&tab=documents`)}
                className={`flex justify-between items-center p-2 ${bgColor} rounded border-l-4 ${borderColor} cursor-pointer hover:bg-gray-50 transition-colors`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{doc.driverName}</p>
                  <p className="text-xs text-gray-600">{docTypeLabels[doc.document_type]}</p>
                </div>
                <p className={`text-xs ml-2 flex-shrink-0 ${textColor} ${isBold ? 'font-bold' : 'font-medium'}`}>
                  {daysLeft !== null ? (
                    daysLeft < 0 ? (
                      <span className="text-red-600 font-bold">{format(new Date(doc.expiry_date), 'dd.MM.yyyy')} (просрочен)</span>
                    ) : (
                      `${format(new Date(doc.expiry_date), 'dd.MM.yyyy')} (${daysLeft} дн.)`
                    )
                  ) : 'N/A'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}