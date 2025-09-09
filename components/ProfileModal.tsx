import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { updateUser } from '../services/api';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateCurrentUser, updatePassword: updateAuthPassword } = useAuth();
    const { addToast } = useToast();
    const { t } = useLanguage();

    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && user) {
            setName(user.name);
            setAvatar(user.avatar);
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        }
    }, [isOpen, user]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setAvatar(event.target.result as string);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        try {
            let profileUpdated = false;
            let passwordUpdated = false;

            // Update profile info if changed
            if (name !== user.name || avatar !== user.avatar) {
                const updatedUser = await updateUser(user.id, { name, avatar });
                updateCurrentUser(updatedUser);
                profileUpdated = true;
            }

            // Update password if new password is provided
            if (newPassword) {
                if (newPassword !== confirmNewPassword) {
                    throw new Error(t('profileModal.passwordsDoNotMatch'));
                }
                if (!oldPassword) {
                    throw new Error(t('errors.oldPasswordIncorrect'));
                }
                await updateAuthPassword(oldPassword, newPassword);
                passwordUpdated = true;
            }

            if (passwordUpdated) {
                addToast({ type: 'success', message: t('profileModal.passwordUpdateSuccess') });
            }
            if (profileUpdated) {
                addToast({ type: 'success', message: t('profileModal.profileUpdateSuccess') });
            }
            if (profileUpdated || passwordUpdated) {
                onClose();
            }

        } catch (error: any) {
             const errorMessageKey = error.message && t(`errors.${error.message}`) ? `errors.${error.message}` : error.message;
             addToast({ type: 'error', message: errorMessageKey });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{t('profileModal.title')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col items-center mb-6">
                        <img src={avatar} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover mb-4 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800" />
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800 transition-colors">
                            {t('profileModal.changeAvatar')}
                        </button>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profileModal.name')}</label>
                        <input type="text" id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>

                    <hr className="my-6 border-gray-200 dark:border-gray-700" />
                    
                    <div className="mb-4">
                        <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profileModal.currentPassword')}</label>
                        <input type="password" id="old-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profileModal.newPassword')}</label>
                        <input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" placeholder={t('profileModal.leaveBlank')} />
                    </div>
                     <div className="mb-6">
                        <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profileModal.confirmNewPassword')}</label>
                        <input type="password" id="confirm-new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                           {isSubmitting ? '...' : t('profileModal.saveChanges')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
