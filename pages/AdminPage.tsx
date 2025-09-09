import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Role, AppDB } from '../types';
import { getUsers, createUser, updateUser, deleteUser, updatePassword, exportData, importData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import UserManagementModal from '../components/UserManagementModal';
import ManageCredentialsModal from '../components/ManageCredentialsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { EditIcon, DeleteIcon, KeyIcon, ImportIcon, ExportIcon } from '../components/icons';

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { user: currentUser, logout } = useAuth();
    const { addToast } = useToast();
    const { t } = useLanguage();
    const importFileRef = useRef<HTMLInputElement>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenUserModal = (user: User | null = null) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };
    
    const handleOpenPasswordModal = (user: User) => {
        setSelectedUser(user);
        setIsPasswordModalOpen(true);
    };

    const handleOpenDeleteModal = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleSaveUser = async (userData: { id?: string; name: string; role: Role; password?: string; avatar: string; }) => {
        try {
            if (userData.id) { // Editing existing user
                await updateUser(userData.id, { name: userData.name, role: userData.role, avatar: userData.avatar });
            } else { // Creating new user
                await createUser(userData);
            }
            addToast({ type: 'success', message: 'User saved successfully!' });
            fetchUsers();
            setIsUserModalOpen(false);
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to save user.' });
        }
    };
    
    const handleUpdatePassword = async (userId: string, newPassword: string) => {
        try {
            await updatePassword(userId, newPassword);
            addToast({ type: 'success', message: t('adminPage.passwordUpdateSuccess') });
            setIsPasswordModalOpen(false);
        } catch (error) {
            addToast({ type: 'error', message: t('adminPage.passwordUpdateError') });
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.id);
            addToast({ type: 'success', message: `User ${selectedUser.name} deleted.` });
            if (selectedUser.id === currentUser?.id) {
                logout();
            } else {
                fetchUsers();
            }
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to delete user.' });
        }
        setIsDeleteModalOpen(false);
    };
    
    const handleExport = async () => {
        try {
            const data = await exportData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `team-dashboard-backup-${new Date().toISOString()}.json`;
            link.click();
            addToast({type: 'success', message: t('toasts.exportSuccess')});
        } catch (e) {
            addToast({type: 'error', message: t('toasts.exportError')});
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not text");
                const data = JSON.parse(text) as AppDB;
                if (!data.users || !data.credentials || !data.tasks) {
                     throw new Error("Invalid file structure");
                }
                await importData(data, true); // true for sync
                addToast({type: 'success', message: t('toasts.importSuccessSync')});
                await fetchUsers(); // Re-fetch users
            } catch (err) {
                console.error("Import failed:", err);
                addToast({type: 'error', message: t('toasts.importErrorInvalidFile')});
            } finally {
                if(importFileRef.current) importFileRef.current.value = "";
                setIsImportModalOpen(false);
            }
        };
        reader.readAsText(file);
    }

    return (
        <div className="p-6 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">{t('adminPage.userManagement')}</h1>
                <div className="flex items-center space-x-2">
                    <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept=".json" />
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md">
                        <ImportIcon className="w-5 h-5 me-2"/> {t('adminPage.importData')}
                    </button>
                    <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md">
                        <ExportIcon className="w-5 h-5 me-2"/>{t('adminPage.exportData')}
                    </button>
                    <button onClick={() => handleOpenUserModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                        {t('adminPage.addUser')}
                    </button>
                </div>
            </header>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {isLoading ? (
                    <p className="p-6 text-center">{t('adminPage.loadingUsers')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('adminPage.user')}</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('adminPage.accountId')}</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('adminPage.role')}</th>
                                    <th scope="col" className="px-6 py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('adminPage.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                                                </div>
                                                <div className="ms-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.accountId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t(`roles.${user.role}`)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                            <div className="flex justify-end items-center space-x-3">
                                                <button onClick={() => handleOpenPasswordModal(user)} className="text-gray-400 hover:text-indigo-600" title={t('adminPage.managePasswordTitle')}><KeyIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleOpenUserModal(user)} className="text-gray-400 hover:text-indigo-600" title={t('adminPage.editUserTitle')}><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleOpenDeleteModal(user)} className="text-gray-400 hover:text-red-600" title={t('adminPage.deleteUserTitle')}><DeleteIcon className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} user={selectedUser} />
            <ManageCredentialsModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSave={handleUpdatePassword} user={selectedUser} />
            {selectedUser && (
                <ConfirmationModal 
                    isOpen={isDeleteModalOpen} 
                    onClose={() => setIsDeleteModalOpen(false)} 
                    onConfirm={handleDeleteUser} 
                    title={t('confirmationModal.confirmDelete')}
                    message={selectedUser.id === currentUser?.id ? t('confirmationModal.deleteSelfWarning') : t('confirmationModal.deleteOtherUser', { userName: selectedUser.name })}
                />
            )}
             <ConfirmationModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onConfirm={() => importFileRef.current?.click()}
                title={t('confirmationModal.importWarningTitle')}
                message={t('confirmationModal.importWarningMessage')}
                confirmButtonClass="bg-indigo-600 hover:bg-indigo-700"
                confirmButtonText={t('confirmationModal.importConfirm')}
            />
        </div>
    );
};

export default AdminPage;
