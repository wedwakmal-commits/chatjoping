import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: { id?: string; name: string; role: Role; password?: string; avatar: string; }) => void;
    user: User | null;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, onSave, user }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState<Role>(Role.EMPLOYEE);
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const placeholderAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EwYWViZiI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTRjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+PC9zdmc+';

    useEffect(() => {
        if (user) {
            setName(user.name);
            setRole(user.role);
            setAvatar(user.avatar);
            setPassword('');
        } else {
            setName('');
            setRole(Role.EMPLOYEE);
            setAvatar(placeholderAvatar);
            setPassword('');
        }
    }, [user, isOpen]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userData: { id?: string; name: string; role: Role; password?: string; avatar: string; } = { name, role, avatar };
        if (user?.id) {
            userData.id = user.id;
        }
        if (!user?.id && password) {
            userData.password = password;
        } else if (!user?.id && !password) {
            // New user requires password, which is enforced by the 'required' attribute on the input
            return;
        }
        onSave(userData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">{user ? 'تعديل المستخدم' : 'إنشاء مستخدم جديد'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col items-center mb-6">
                        <img src={avatar} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover mb-4 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800" />
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800 transition-colors"
                        >
                            تغيير الصورة
                        </button>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    {!user && (
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    )}
                    <div className="mb-6">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصلاحية</label>
                        <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                            <option value={Role.EMPLOYEE}>موظف</option>
                            <option value={Role.ADMIN}>مدير</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 space-x-reverse">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagementModal;
