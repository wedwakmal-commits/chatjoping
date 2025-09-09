import React, { useEffect } from 'react';
import { ToastMessage, ToastType } from '../context/ToastContext';
import { SuccessIcon, WarningIcon, CloseIcon, InfoIcon } from './icons';
import { useLanguage } from '../context/LanguageContext';

interface ToastProps {
    toast: ToastMessage;
    onClose: () => void;
}

const toastConfig: Record<ToastType, { icon: React.FC<any>; classes: string }> = {
    success: {
        icon: SuccessIcon,
        classes: 'bg-green-50 border-green-500 dark:bg-green-900/50 dark:border-green-700 text-green-700 dark:text-green-300'
    },
    warning: {
        icon: WarningIcon,
        classes: 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/50 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
    },
    error: {
        icon: WarningIcon, // Can be a different icon
        classes: 'bg-red-50 border-red-500 dark:bg-red-900/50 dark:border-red-700 text-red-700 dark:text-red-300'
    },
    info: {
        icon: InfoIcon, 
        classes: 'bg-blue-50 border-blue-500 dark:bg-blue-900/50 dark:border-blue-700 text-blue-700 dark:text-blue-300'
    },
};


const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const { t } = useLanguage();

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const config = toastConfig[toast.type];
    const Icon = config.icon;

    return (
        <div 
             className={`flex items-start w-full p-4 rounded-lg shadow-lg border-s-4 ${config.classes} animate-toast-in`}
             role="alert"
        >
            <div className="flex-shrink-0">
                <Icon className="w-6 h-6" />
            </div>
            <div className="ms-3 flex-1 text-sm font-medium whitespace-pre-wrap">
                {toast.message}
            </div>
            <button
                onClick={onClose}
                className="ms-3 -mx-1.5 -my-1.5 bg-transparent rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                aria-label={t('close')}
            >
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// Add keyframes to your global CSS or in a style tag if needed.
// For Tailwind, you can add this to tailwind.config.js
// For simplicity, we can ensure it's in a style tag in index.html,
// but let's assume a global stylesheet or a setup that can handle this.
// A temporary fix is to add it to index.html if no global CSS file exists.
const keyframes = `
@keyframes toast-in {
  from {
    transform: translateX(var(--toast-translate-x, -100%));
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

html[dir="rtl"] .animate-toast-in {
  --toast-translate-x: 100%;
}

.animate-toast-in {
  animation: toast-in 0.5s ease-out forwards;
}
`;

// Inject keyframes into the document head
if (!document.getElementById('toast-animation-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'toast-animation-styles';
    styleSheet.type = "text/css";
    styleSheet.innerText = keyframes;
    document.head.appendChild(styleSheet);
}


export default Toast;
