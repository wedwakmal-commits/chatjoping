import React, { useState, useEffect } from 'react';
import { Task, User, TaskStatus, Project } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (taskData: Omit<Task, 'id' | 'createdBy'>) => void;
    users: User[];
    projects: Project[];
    initialProjectId?: string | null;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onSubmit, users, projects, initialProjectId }) => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [projectId, setProjectId] = useState<string | null>(null);

    useEffect(() => {
        if(isOpen) {
            // Reset form state when modal opens
            setTitle('');
            setDescription('');
            setAssigneeIds([]);
            setDueDate('');
            setProjectId(initialProjectId || null);
        }
    }, [isOpen, initialProjectId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            assigneeIds,
            dueDate,
            status: TaskStatus.PENDING,
            projectId: projectId || null,
        });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{t('createTaskModal.title')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('createTaskModal.taskName')}</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('createTaskModal.taskDescription')}</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                     <div className="mb-4">
                        <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('createTaskModal.project')}</label>
                        <select
                            id="project"
                            value={projectId || ''}
                            onChange={(e) => setProjectId(e.target.value || null)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">{t('createTaskModal.noProject')}</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="assignees" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('createTaskModal.assignTo')}</label>
                        <select
                            id="assignees"
                            multiple
                            value={assigneeIds}
                            onChange={(e) => setAssigneeIds(Array.from(e.target.selectedOptions, option => option.value))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 h-32"
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('createTaskModal.dueDate')}</label>
                        <input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{t('createTaskModal.createTask')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
