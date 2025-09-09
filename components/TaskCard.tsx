import React from 'react';
import { Task, User, TaskStatus, Project } from '../types';

interface TaskCardProps {
    task: Task;
    users: User[];
    projects: Project[];
    onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const getStatusColor = (status: TaskStatus) => {
    switch (status) {
        case TaskStatus.COMPLETED:
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case TaskStatus.ON_HOLD:
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case TaskStatus.PENDING:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, users, onStatusChange, projects }) => {
    const assignees = users.filter(user => task.assigneeIds.includes(user.id));
    const creator = users.find(user => user.id === task.createdBy);
    const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 flex flex-col justify-between transition-shadow hover:shadow-xl">
            <div>
                 {project && (
                    <div className="mb-3">
                        <span 
                            className="px-2.5 py-1 text-xs font-bold rounded-full text-white shadow-sm"
                            style={{ backgroundColor: project.color }}
                        >
                            {project.name}
                        </span>
                    </div>
                )}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{task.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                    </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-semibold">تاريخ الاستحقاق:</span> {new Date(task.dueDate).toLocaleDateString('ar-EG')}
                </div>
                {creator && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="font-semibold">أنشأها:</span> {creator.name}
                    </div>
                )}
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">المسؤولون:</p>
                    <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                        {assignees.map(user => (
                            <img
                                key={user.id}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800"
                                src={user.avatar}
                                alt={user.name}
                                title={user.name}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value={TaskStatus.PENDING}>قيد التنفيذ</option>
                    <option value={TaskStatus.COMPLETED}>مكتملة</option>
                    <option value={TaskStatus.ON_HOLD}>معلقة</option>
                </select>
            </div>
        </div>
    );
};

export default TaskCard;