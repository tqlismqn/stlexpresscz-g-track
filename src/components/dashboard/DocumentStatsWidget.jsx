import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_KEYS } from '@/lib/documentTypes';

export default function DocumentStatsWidget({ documents = [], activeDriverIds = [] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sortedTypes = useMemo(() => {
    const activeSet = new Set(activeDriverIds);
    const activeDocs = documents.filter(d => activeSet.has(d.driver_id));
    const total = activeDriverIds.length;

    const rows = DOCUMENT_TYPE_KEYS.map(key => {
      const config = DOCUMENT_TYPES[key];
      const typeDocs = activeDocs.filter(d => d.document_type === key);
      const valid = typeDocs.filter(d => d.status === 'valid').length;
      const expiring = typeDocs.filter(d => d.status === 'expiring').length;
      const expired = typeDocs.filter(d => d.status === 'expired').length;
      const existingDriverIds = new Set(typeDocs.map(d => d.driver_id));
      const missing = total - existingDriverIds.size;
      const rowTotal = Math.max(total, 1);
      return { key, config, valid, expiring, expired, missing, total: rowTotal };
    });

    return rows.sort((a, b) => b.expired - a.expired || b.expiring - a.expiring);
  }, [documents, activeDriverIds]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.document_stats')}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium">{t('dashboard.doc_type')}</th>
              <th className="pb-2 font-medium text-center">{t('dashboard.status_valid')}</th>
              <th className="pb-2 font-medium text-center">{t('dashboard.status_expiring')}</th>
              <th className="pb-2 font-medium text-center">{t('dashboard.status_expired')}</th>
              <th className="pb-2 font-medium text-center">{t('dashboard.status_missing')}</th>
              <th className="pb-2 font-medium">{t('dashboard.visual')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTypes.map(({ key, config, valid, expiring, expired, missing, total }) => (
              <tr key={key} className={`border-b border-gray-100 ${expired > 10 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                <td className="py-2 font-medium whitespace-nowrap">
                  <span className="text-gray-400 text-xs mr-1.5">{config.abbr}</span>
                  {t(config.i18nKey)}
                </td>
                <td className="py-2 text-center">
                  <span
                    className="inline-block min-w-[28px] px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 cursor-pointer hover:bg-green-200"
                    onClick={() => navigate(`/Drivers?docType=${key}&docStatus=valid`)}
                  >{valid}</span>
                </td>
                <td className="py-2 text-center">
                  <span
                    className="inline-block min-w-[28px] px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200"
                    onClick={() => navigate(`/Drivers?docType=${key}&docStatus=expiring`)}
                  >{expiring}</span>
                </td>
                <td className="py-2 text-center">
                  <span
                    className="inline-block min-w-[28px] px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 cursor-pointer hover:bg-red-200"
                    onClick={() => navigate(`/Drivers?docType=${key}&docStatus=expired`)}
                  >{expired}</span>
                </td>
                <td className="py-2 text-center">
                  <span
                    className="inline-block min-w-[28px] px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate(`/Drivers?docType=${key}&docStatus=missing`)}
                  >{missing}</span>
                </td>
                <td className="py-2 w-32">
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                    {valid > 0 && <div className="bg-green-500" style={{ width: `${(valid / total) * 100}%` }} />}
                    {expiring > 0 && <div className="bg-orange-400" style={{ width: `${(expiring / total) * 100}%` }} />}
                    {expired > 0 && <div className="bg-red-500" style={{ width: `${(expired / total) * 100}%` }} />}
                    {missing > 0 && <div className="bg-gray-300" style={{ width: `${(missing / total) * 100}%` }} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}