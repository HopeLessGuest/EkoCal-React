
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const ConfirmDeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventName: string;
}> = ({ isOpen, onClose, onConfirm, eventName }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] transition-opacity" 
      onClick={onClose}
      aria-modal="true"
      role="alertdialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
          {t('deleteConfirmTitle')}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('deleteConfirmMessage', { eventName })}
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 px-4 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-slate-500">
            {t('cancel')}
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className="p-2 px-4 rounded-full text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-red-500">
            {t('deleteConfirmAction')}
          </button>
        </div>
      </div>
    </div>
  );
};
