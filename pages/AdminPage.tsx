import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import UserManagementModal from '../components/UserManagementModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { EditIcon, DeleteIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { user: currentUser, logout, updateCurrentUser } = useAuth();

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
        if (userData.id) {
            const updatedUser = await updateUser(userData.id, { name: userData.name, role: userData.role, avatar: userData.avatar });
            if (currentUser && updatedUser.id === currentUser.id) {
                updateCurrentUser(updatedUser);
            }
        } else {
            if(!userData.password) return;
            await createUser({ name: userData.name, role: userData.role, avatar: userData.avatar }, userData.password);
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


    return (
        <div className="p-6 md:p-8 h-full">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">إدارة المستخدمين</h1>
                <button
                    onClick={() => handleOpenUserModal()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow"
                >
                    + إضافة مستخدم
                </button>
            </header>
            
            {isLoading ? (
                <div className="text-center py-10">جاري تحميل المستخدمين...</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المستخدم</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">رقم الحساب</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الصلاحية</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">تعديل</span>
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
                                            <div className="mr-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {user.role === Role.ADMIN ? user.accountId : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === Role.ADMIN ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {user.role === Role.ADMIN ? 'مدير' : 'موظف'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                        <button onClick={() => handleOpenUserModal(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 ml-4">
                                            <EditIcon className="w-5 h-5"/>
                                        </button>
                                        <button 
                                            onClick={() => handlePromptDelete(user)} 
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                                            title={'حذف المستخدم'}
                                        >
                                            <DeleteIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                    title="تأكيد الحذف"
                    message={
                        userToDelete.id === currentUser?.id
                        ? 'تحذير: أنت على وشك حذف حسابك الخاص. سيتم تسجيل خروجك فوراً. هل أنت متأكد؟'
                        : `هل أنت متأكد من حذف المستخدم "${userToDelete.name}"؟ سيتم إزالته من جميع المهام المسندة إليه.`
                    }
                />
            )}
        </div>
    );
};

export default AdminPage;