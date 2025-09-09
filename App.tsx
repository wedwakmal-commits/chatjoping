import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';

const AppContent: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <LoginPage />;
    }

    return <DashboardLayout />;
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ToastProvider>
                    <div className="min-h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        <AppContent />
                    </div>
                </ToastProvider>
            </AuthProvider>
        </LanguageProvider>
    );
};

export default App;
