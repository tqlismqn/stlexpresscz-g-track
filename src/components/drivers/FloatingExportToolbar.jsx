import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FloatingExportToolbar({ selectedCount, onClearSelection, onExportCSV, onExportPDF }) {
  const { t } = useTranslation();
  const [csvOpen, setCsvOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const csvRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    if (!csvOpen && !pdfOpen) return;
    const handler = (e) => {
      if (csvRef.current && !csvRef.current.contains(e.target)) setCsvOpen(false);
      if (pdfRef.current && !pdfRef.current.contains(e.target)) setPdfOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [csvOpen, pdfOpen]);

  const templates = [
    { key: 'driver_list', icon: '📋', label: t('export.driver_list'), desc: t('export.driver_list_desc') },
    { key: 'document_statuses', icon: '📊', label: t('export.document_statuses'), desc: t('export.document_statuses_desc') },
    { key: 'document_expiry', icon: '📅', label: t('export.document_expiry'), desc: t('export.document_expiry_desc') },
  ];

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-xl px-6 py-3 flex items-center gap-4"
    >
      {/* Left: count + clear */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-800">
          {t('export.selected_count', { count: selectedCount })}
        </span>
        <button
          onClick={onClearSelection}
          className="text-sm text-gray-400 hover:text-gray-700 underline-offset-2 hover:underline"
        >
          {t('export.clear_selection')}
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-gray-200" />

      {/* Export buttons */}
      <div className="flex gap-2">
        {/* CSV dropdown */}
        <div className="relative" ref={csvRef}>
          <button
            onClick={() => { setCsvOpen(v => !v); setPdfOpen(false); }}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
          >
            {t('export.export_csv')}
          </button>
          {csvOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
              {templates.map(tpl => (
                <button
                  key={tpl.key}
                  onClick={() => { setCsvOpen(false); onExportCSV(tpl.key); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-800">{tpl.icon} {tpl.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{tpl.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PDF dropdown */}
        <div className="relative" ref={pdfRef}>
          <button
            onClick={() => { setPdfOpen(v => !v); setCsvOpen(false); }}
            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
          >
            {t('export.export_pdf')}
          </button>
          {pdfOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
              {templates.map(tpl => (
                <button
                  key={tpl.key}
                  onClick={() => { setPdfOpen(false); onExportPDF(tpl.key); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-800">{tpl.icon} {tpl.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{tpl.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}