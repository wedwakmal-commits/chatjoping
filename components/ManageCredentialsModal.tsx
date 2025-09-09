import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getUserPassword } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface ManageCredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userId: string, newPassword: string) => void;
    user: User | null;
}

const ManageCredentialsModal: React.FC<ManageCredentialsModalProps> = ({ isOpen, onClose, onSave, user }) => {
    const { t } = useLanguage();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            const fetchPassword = async () => {
                setIsLoading(true);
                setCurrentPassword(t('manageCredentialsModal.loading'));
                try {
                    const pass = await getUserPassword(user.id);
                    setCurrentPassword(pass || t('manageCredentialsModal.notAvailable'));
                } catch {
                    setCurrentPassword(t('manageCredentialsModal.loadingError'));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPassword();
            setNewPassword(''); // Reset new password field
        }
    }, [isOpen, user, t]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user && newPassword) {
            onSave(user.id, newPassword);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{t('manageCredentialsModal.title')}</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-400">{t('manageCredentialsModal.editingUser')}<span className="font-bold">{user.name}</span></p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('manageCredentialsModal.currentPassword')}</label>
                        <input
                            type="text"
                            id="current-password"
                            value={currentPassword}
                            readOnly
                            disabled
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 sm:text-sm cursor-not-allowed"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('manageCredentialsModal.newPassword')}</label>
                        <input
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                            placeholder={t('manageCredentialsModal.newPasswordPlaceholder')}
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('close')}</button>
                        <button type="submit" disabled={!newPassword || isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                            {t('manageCredentialsModal.changePassword')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManageCredentialsModal;
