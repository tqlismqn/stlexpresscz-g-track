import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FloatingExportToolbar({ selectedCount, onClearSelection }) {
  const { t } = useTranslation();

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

      {/* Right: export buttons (disabled placeholders) */}
      <div className="flex gap-2">
        <button
          disabled
          className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed font-medium"
        >
          {t('export.export_csv')}
        </button>
        <button
          disabled
          className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white opacity-50 cursor-not-allowed font-medium"
        >
          {t('export.export_pdf')}
        </button>
      </div>
    </motion.div>
  );
}