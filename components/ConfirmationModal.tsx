import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonClass?: string;
    confirmButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    confirmButtonText
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 m-4 text-center">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${confirmButtonClass}`}
                    >
                        {confirmButtonText || t('confirmationModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;