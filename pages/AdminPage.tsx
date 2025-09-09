import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';
import { getUsers, createUser, updateUser, deleteUser, updateUserPassword, exportDbAsString, importDbFromString } from '../services/api';
import UserManagementModal from '../components/UserManagementModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ManageCredentialsModal from '../components/ManageCredentialsModal';
import { EditIcon, DeleteIcon, KeyIcon, ExportIcon, ImportIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { user: currentUser, logout, updateCurrentUser } = useAuth();
    const { addToast } = useToast();
    const { t } = useLanguage();

    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [userForCredentials, setUserForCredentials] = useState<User | null>(null);

    // Import/Export state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenUserModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setEditingUser(null);
        setIsUserModalOpen(false);
    };

    const handleSaveUser = async (userData: { id?: string; name: string; role: Role; password?: string; avatar: string; }) => {
        try {
            if (userData.id) {
                const updatedUser = await updateUser(userData.id, { name: userData.name, role: userData.role, avatar: userData.avatar });
                if (currentUser && updatedUser.id === currentUser.id) {
                    updateCurrentUser(updatedUser);
                }
            } else {
                if(!userData.password) return;
                await createUser({ name: userData.name, role: userData.role, avatar: userData.avatar }, userData.password);
            }
        } catch (err: any) {
            addToast({ type: 'error', message: t(err.message) });
        }
        await fetchUsers();
        handleCloseUserModal();
    };

    const handlePromptDelete = (user: User) => {
        setUserToDelete(user);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        const isDeletingSelf = userToDelete.id === currentUser?.id;
        
        await deleteUser(userToDelete.id);

        setIsConfirmModalOpen(false);
        setUserToDelete(null);

        if (isDeletingSelf) {
            logout();
        } else {
            await fetchUsers();
        }
    };
    
    const handleOpenCredentialsModal = (user: User) => {
        setUserForCredentials(user);
        setIsCredentialsModalOpen(true);
    };

    const handleCloseCredentialsModal = () => {
        setUserForCredentials(null);
        setIsCredentialsModalOpen(false);
    };

    const handleUpdatePassword = async (userId: string, newPassword: string) => {
        try {
            await updateUserPassword(userId, newPassword);
            addToast({ type: 'success', message: t('adminPage.passwordUpdateSuccess') });
            handleCloseCredentialsModal();
        } catch (error) {
            addToast({ type: 'error', message: t('adminPage.passwordUpdateError') });
        }
    };

    const handleExport = () => {
        try {
            const dataStr = exportDbAsString();
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `employee-app-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast({ type: 'success', message: t('toasts.exportSuccess') });
        } catch (e) {
            addToast({ type: 'error', message: t('toasts.exportError') });
            console.error("Export failed", e);
        }
    };

    const handleConfirmImport = () => {
        setIsImportConfirmOpen(false);
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                if (importDbFromString(text)) {
                    addToast({ type: 'success', message: t('toasts.importSuccess') });
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    addToast({ type: 'error', message: t('toasts.importErrorInvalidFile') });
                }
            } catch (error) {
                addToast({ type: 'error', message: t('toasts.importErrorGeneric') });
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-6 md:p-8 h-full">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('adminPage.userManagement')}</h1>
                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".json" />
                     <button
                        onClick={() => setIsImportConfirmOpen(true)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow flex items-center gap-2"
                    >
                        <ImportIcon className="w-5 h-5"/>
                        {t('adminPage.importData')}
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow flex items-center gap-2"
                    >
                        <ExportIcon className="w-5 h-5"/>
                        {t('adminPage.exportData')}
                    </button>
                    <button
                        onClick={() => handleOpenUserModal()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow"
                    >
                        {t('adminPage.addUser')}
                    </button>
                </div>
            </header>
            
            {isLoading ? (
                <div className="text-center py-10">{t('adminPage.loadingUsers')}</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('adminPage.user')}</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('adminPage.accountId')}</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('adminPage.role')}</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">{t('adminPage.actions')}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={user.avatar} alt={user.name} />
                                                </div>
                                                <div className="ms-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {user.accountId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === Role.ADMIN ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {t(`roles.${user.role}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-4">
                                                <button onClick={() => handleOpenCredentialsModal(user)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" title={t('adminPage.managePasswordTitle')}>
                                                    <KeyIcon className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => handleOpenUserModal(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200" title={t('adminPage.editUserTitle')}>
                                                    <EditIcon className="w-5 h-5"/>
                                                </button>
                                                <button 
                                                    onClick={() => handlePromptDelete(user)} 
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                                                    title={t('adminPage.deleteUserTitle')}
                                                >
                                                    <DeleteIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {isUserModalOpen && (
                <UserManagementModal
                    isOpen={isUserModalOpen}
                    onClose={handleCloseUserModal}
                    onSave={handleSaveUser}
                    user={editingUser}
                />
            )}

            {isConfirmModalOpen && userToDelete && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title={t('confirmationModal.confirmDelete')}
                    message={
                        userToDelete.id === currentUser?.id
                        ? t('confirmationModal.deleteSelfWarning')
                        : t('confirmationModal.deleteOtherUser', { userName: userToDelete.name })
                    }
                />
            )}

            {isImportConfirmOpen && (
                 <ConfirmationModal
                    isOpen={isImportConfirmOpen}
                    onClose={() => setIsImportConfirmOpen(false)}
                    onConfirm={handleConfirmImport}
                    title={t('confirmationModal.importWarningTitle')}
                    message={t('confirmationModal.importWarningMessage')}
                    confirmButtonClass="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                    confirmButtonText={t('confirmationModal.importConfirm')}
                />
            )}

            {isCredentialsModalOpen && userForCredentials && (
                <ManageCredentialsModal
                    isOpen={isCredentialsModalOpen}
                    onClose={handleCloseCredentialsModal}
                    onSave={handleUpdatePassword}
                    user={userForCredentials}
                />
            )}
        </div>
    );
};

export default AdminPage;