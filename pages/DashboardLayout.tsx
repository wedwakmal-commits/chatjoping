
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import TasksPage from './TasksPage';
import ChatPage from './ChatPage';
import AdminPage from './AdminPage';
import { TaskIcon, ChatIcon, AdminIcon, LogoutIcon, UserIcon } from '../components/icons';

type Page = 'tasks' | 'chat' | 'admin';

const NavLink: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-right text-base font-medium rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        {icon}
        <span className="mr-3">{label}</span>
    </button>
);

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const [activePage, setActivePage] = useState<Page>('tasks');

    const renderPage = () => {
        switch (activePage) {
            case 'tasks':
                return <TasksPage />;
            case 'chat':
                return <ChatPage />;
            case 'admin':
                return user?.role === Role.ADMIN ? <AdminPage /> : <div className="text-center p-8"> وصول غير مصرح به. </div>;
            default:
                return <TasksPage />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-md flex flex-col">
                <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-indigo-500">
                        <TaskIcon className="w-8 h-8"/>
                        <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">فريق العمل</span>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-3">
                    <NavLink
                        icon={<TaskIcon className="w-6 h-6" />}
                        label="المهام"
                        isActive={activePage === 'tasks'}
                        onClick={() => setActivePage('tasks')}
                    />
                    <NavLink
                        icon={<ChatIcon className="w-6 h-6" />}
                        label="الدردشة"
                        isActive={activePage === 'chat'}
                        onClick={() => setActivePage('chat')}
                    />
                    {user?.role === Role.ADMIN && (
                        <NavLink
                            icon={<AdminIcon className="w-6 h-6" />}
                            label="الإدارة"
                            isActive={activePage === 'admin'}
                            onClick={() => setActivePage('admin')}
                        />
                    )}
                </nav>
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                   <div className="flex items-center mb-4">
                       <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full"/>
                       <div className="mr-3">
                           <p className="font-semibold text-gray-800 dark:text-white">{user?.name}</p>
                           <p className="text-sm text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? 'مدير' : 'موظف'}</p>
                       </div>
                   </div>
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-3 text-right text-base font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                       <LogoutIcon className="w-6 h-6"/>
                        <span className="mr-3">تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
};

export default DashboardLayout;
