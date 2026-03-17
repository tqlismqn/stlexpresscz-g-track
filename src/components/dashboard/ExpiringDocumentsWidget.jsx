import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Clock, ChevronRight } from 'lucide-react';
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('expired');
  const [expiredDocs, setExpiredDocs] = useState([]);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const docs = await base44.entities.DriverDocument.list();
        const drivers = activeDrivers.length > 0 ? activeDrivers : await base44.entities.Driver.list();
        const driverMap = new Map(drivers.map(d => [d.id, d]));
        const activeDriverIds = new Set(drivers.filter(d => d.status === 'active').map(d => d.id));

        // Process expired documents
        const expired = docs
          .filter(d => d.status === 'expired' && activeDriverIds.has(d.driver_id))
          .map(d => {
            const daysOverdue = differenceInDays(new Date(), new Date(d.expiry_date));
            return {
              ...d,
              driverName: driverMap.get(d.driver_id)?.name || 'Unknown',
              daysValue: daysOverdue
            };
          })
          .sort((a, b) => b.daysValue - a.daysValue)
          .slice(0, 20);

        // Process expiring documents
        const expiring = docs
          .filter(d => d.status === 'expiring' && activeDriverIds.has(d.driver_id))
          .map(d => {
            const daysLeft = differenceInDays(new Date(d.expiry_date), new Date());
            return {
              ...d,
              driverName: driverMap.get(d.driver_id)?.name || 'Unknown',
              daysValue: daysLeft
            };
          })
          .sort((a, b) => a.daysValue - b.daysValue)
          .slice(0, 20);

        setExpiredDocs(expired);
        setExpiringDocs(expiring);
        
        // Get total counts for all docs
        const totalExpired = docs.filter(d => d.status === 'expired' && activeDriverIds.has(d.driver_id)).length;
        const totalExpiring = docs.filter(d => d.status === 'expiring' && activeDriverIds.has(d.driver_id)).length;
        setExpiredCount(totalExpired);
        setExpiringCount(totalExpiring);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeDrivers]);

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>;
  }

  const items = activeTab === 'expired' ? expiredDocs : expiringDocs;
  const hasMore = activeTab === 'expired' ? expiredDocs.length < expiredCount : expiringDocs.length < expiringCount;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-orange-600" />
        <h2 className="text-lg font-semibold text-gray-900">Документы, требующие внимания</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'expired'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Просроченные ({expiredCount})
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'expiring'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Истекают ({expiringCount})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {activeTab === 'expired' ? 'Нет просроченных документов' : 'Нет истекающих документов'}
          </p>
        ) : (
          items.map(doc => {
            const isExpired = activeTab === 'expired';
            const daysValue = doc.daysValue;

            let bgColor = 'bg-yellow-50';
            let borderColor = 'border-l-yellow-500';
            let statusText = '';
            let statusColor = 'text-amber-600';

            if (isExpired) {
              bgColor = 'bg-red-50';
              borderColor = 'border-l-red-500';
              statusText = `(просрочен ${daysValue} дн.)`;
              statusColor = 'text-red-600 font-bold';
            } else {
              if (daysValue <= 3) {
                bgColor = 'bg-red-50';
                borderColor = 'border-l-red-500';
                statusColor = 'text-red-600 font-bold';
              } else if (daysValue <= 7) {
                bgColor = 'bg-orange-50';
                borderColor = 'border-l-orange-500';
                statusColor = 'text-orange-600';
              }
              statusText = `(через ${daysValue} дн.)`;
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
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className={`text-xs ${statusColor}`}>
                    {format(new Date(doc.expiry_date), 'dd.MM.yyyy')} {statusText}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Show all link */}
      {hasMore && (
        <button
          onClick={() => navigate(`/Drivers?filter=${activeTab === 'expired' ? 'expired' : 'expiring'}`)}
          className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 py-2 rounded hover:bg-blue-50 transition-colors"
        >
          Показать все <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}