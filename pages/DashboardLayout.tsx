import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import TasksPage from './TasksPage';
import ChatPage from './ChatPage';
import AdminPage from './AdminPage';
import { TaskIcon, ChatIcon, AdminIcon, LogoutIcon, LanguageIcon, EditIcon } from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import ProfileModal from '../components/ProfileModal';

type Page = 'tasks' | 'chat' | 'admin';

const NavLink: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-start text-base font-medium rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        {icon}
        <span className="ms-3">{label}</span>
    </button>
);

const ImpersonationBanner: React.FC = () => {
    const { user, stopImpersonation } = useAuth();
    const { t } = useLanguage();

    return (
        <div className="bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white text-center py-2 px-4 shadow-lg z-50">
            <span>{t('impersonation.banner', { userName: user?.name || '' })}</span>
            <button onClick={stopImpersonation} className="ms-4 font-bold underline hover:text-indigo-800 dark:hover:text-indigo-200">
                {t('impersonation.endSession')}
            </button>
        </div>
    );
};

const DashboardLayout: React.FC = () => {
    const { user, logout, isImpersonating } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [activePage, setActivePage] = useState<Page>('tasks');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    const renderPage = () => {
        switch (activePage) {
            case 'tasks':
                return <TasksPage />;
            case 'chat':
                return <ChatPage />;
            case 'admin':
                return user?.role === Role.ADMIN ? <AdminPage /> : <div className="text-center p-8"> Unauthorized access. </div>;
            default:
                return <TasksPage />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            {isImpersonating && <ImpersonationBanner />}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700 shadow-md flex flex-col">
                    <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-indigo-500">
                            <TaskIcon className="w-8 h-8"/>
                            <span className="me-2 text-xl font-bold text-gray-800 dark:text-white">{t('dashboard.team')}</span>
                        </div>
                    </div>
                    <nav className="flex-1 px-4 py-6 space-y-3">
                        <NavLink
                            icon={<TaskIcon className="w-6 h-6" />}
                            label={t('dashboard.tasks')}
                            isActive={activePage === 'tasks'}
                            onClick={() => setActivePage('tasks')}
                        />
                        <NavLink
                            icon={<ChatIcon className="w-6 h-6" />}
                            label={t('dashboard.chat')}
                            isActive={activePage === 'chat'}
                            onClick={() => setActivePage('chat')}
                        />
                        {user?.role === Role.ADMIN && (
                            <NavLink
                                icon={<AdminIcon className="w-6 h-6" />}
                                label={t('dashboard.admin')}
                                isActive={activePage === 'admin'}
                                onClick={() => setActivePage('admin')}
                            />
                        )}
                    </nav>
                    <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                       <div className="flex items-center mb-4">
                           <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full"/>
                           <div className="ms-3 flex-1">
                               <p className="font-semibold text-gray-800 dark:text-white truncate">{user?.name}</p>
                               <p className="text-sm text-gray-500 dark:text-gray-400">{t(`roles.${user?.role}`)}</p>
                           </div>
                           <button onClick={() => setIsProfileModalOpen(true)} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 p-2 rounded-full transition-colors flex-shrink-0" title={t('profileModal.title')}>
                               <EditIcon className="w-5 h-5"/>
                           </button>
                       </div>
                       <button
                            onClick={toggleLanguage}
                            className="flex items-center w-full px-4 py-3 text-start text-base font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 mb-2"
                        >
                           <LanguageIcon className="w-6 h-6"/>
                            <span className="ms-3">{t('language')}</span>
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center w-full px-4 py-3 text-start text-base font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                        >
                           <LogoutIcon className="w-6 h-6"/>
                            <span className="ms-3">{t('dashboard.logout')}</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    {renderPage()}
                </main>

                <ProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default DashboardLayout;