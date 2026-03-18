import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TagSelector({ driver, allTags, onTagToggle }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (driver?.status === 'archived') return null;

  const driverStatus = driver?.status || 'active';
  const driverTagIds = driver?.tags || [];

  // Only show tags allowed for this driver's status
  const availableTags = (allTags || []).filter(tag =>
    tag.allowed_statuses?.includes(driverStatus)
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-[22px] h-[22px] rounded-full border border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center text-sm font-medium transition-colors flex-shrink-0"
        title={t('tags.manage')}
      >
        +
      </button>

      {open && (
        <div className="absolute left-0 top-6 z-50 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {availableTags.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">{t('tags.none_available')}</p>
          ) : (
            availableTags.map(tag => {
              const isActive = driverTagIds.includes(tag.id);
              // Extract first bg color class to use as dot color
              const dotColor = tag.color?.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-300';
              return (
                <button
                  key={tag.id}
                  onClick={() => { onTagToggle(tag.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                  <span className="flex-1 text-left text-gray-700">{t(tag.label_key)}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}