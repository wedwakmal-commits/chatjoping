import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (groupData: { name: string; participantIds: string[] }) => void;
    users: User[];
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onSave, users }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setGroupName('');
            setSelectedUserIds([]);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim() || selectedUserIds.length === 0) {
            // Basic validation
            alert("يرجى إدخال اسم للمجموعة واختيار عضو واحد على الأقل.");
            return;
        }
        onSave({ name: groupName, participantIds: selectedUserIds });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">إنشاء مجموعة جديدة</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المجموعة</label>
                        <input 
                            type="text" 
                            id="groupName" 
                            value={groupName} 
                            onChange={(e) => setGroupName(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" 
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="participants" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اختيار الأعضاء</label>
                        <select
                            id="participants"
                            multiple
                            value={selectedUserIds}
                            onChange={(e) => setSelectedUserIds(Array.from(e.target.selectedOptions, option => option.value))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 h-48"
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name} ({user.role === 'admin' ? 'مدير' : 'موظف'})</option>
                            ))}
                        </select>
                         <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">يمكنك تحديد عدة مستخدمين بالضغط على Ctrl (أو Cmd في ماك) ثم النقر.</p>
                    </div>

                    <div className="flex justify-end space-x-2 space-x-reverse">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">إنشاء المجموعة</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;