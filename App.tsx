import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    return user ? <DashboardLayout /> : <LoginPage />;
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <ToastProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ToastProvider>
        </LanguageProvider>
    );
};

export default App;
