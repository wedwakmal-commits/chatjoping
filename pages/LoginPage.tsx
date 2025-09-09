import React, { useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { importData } from '../services/api';
import { AppDB } from '../types';
import { LanguageIcon } from '../components/icons';

const LoginPage: React.FC = () => {
    const { login, registerAdmin } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const accountId = formData.get('accountId') as string;
        const password = formData.get('password') as string;

        try {
            const user = await login(accountId, password);
            if (!user) {
                addToast({ type: 'error', message: t('loginPage.invalidCredentials') });
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: t('loginPage.loginError') });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const username = formData.get('newUsername') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            addToast({ type: 'error', message: t('loginPage.passwordsDoNotMatch') });
            setIsSubmitting(false);
            return;
        }

        try {
            const user = await registerAdmin(username, password);
            if (!user) {
                addToast({ type: 'error', message: t('loginPage.registrationFailed') });
            }
        } catch (error: any) {
            const errorMessageKey = error.message && t(`errors.${error.message}`) ? `errors.${error.message}` : 'loginPage.registrationError';
            addToast({ type: 'error', message: t(errorMessageKey) });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not text");
                const data = JSON.parse(text) as AppDB;
                // Basic validation
                if (!data.users || !data.credentials || !data.tasks) {
                     throw new Error("Invalid file structure");
                }
                await importData(data, false);
                addToast({type: 'success', message: t('toasts.importSuccess')});
                setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
                console.error("Import failed:", err);
                addToast({type: 'error', message: t('toasts.importErrorInvalidFile')});
            } finally {
                // Reset file input
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const TabButton: React.FC<{ tab: 'login' | 'register'; label: string }> = ({ tab, label }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`w-full py-3 text-sm font-medium transition-colors ${
                activeTab === tab 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 relative">
            <div className="absolute top-6 end-6">
                <button 
                    onClick={toggleLanguage}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <LanguageIcon className="w-5 h-5"/>
                    <span>{t('language')}</span>
                </button>
            </div>

            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
                <div className="flex">
                    <TabButton tab="login" label={t('loginPage.loginTab')} />
                    <TabButton tab="register" label={t('loginPage.registerTab')} />
                </div>
                
                {activeTab === 'login' ? (
                     <div className="p-8">
                        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">{t('loginPage.welcomeBack')}</h2>
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2 mb-6">{t('loginPage.accessDashboard')}</p>
                        <form onSubmit={handleLogin}>
                             <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="accountId">{t('loginPage.accountId')}</label>
                                <input className="w-full px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" id="accountId" name="accountId" required />
                            </div>
                             <div className="mb-6">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">{t('loginPage.password')}</label>
                                <input className="w-full px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" type="password" id="password" name="password" required />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                                {isSubmitting ? t('loginPage.loggingIn') : t('loginPage.login')}
                            </button>
                        </form>
                        <div className="flex items-center my-6">
                            <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                            <span className="mx-4 text-gray-500 dark:text-gray-400 text-sm">{t('loginPage.or')}</span>
                            <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                            {t('loginPage.importData')}
                        </button>
                    </div>
                ) : (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">{t('loginPage.registerAdminTitle')}</h2>
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2 mb-6">{t('loginPage.registerAdminSubtitle')}</p>
                         <form onSubmit={handleRegister}>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="newUsername">{t('loginPage.newUsername')}</label>
                                <input className="w-full px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" id="newUsername" name="newUsername" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="reg-password">{t('loginPage.password')}</label>
                                <input className="w-full px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" type="password" id="reg-password" name="password" required />
                            </div>
                             <div className="mb-6">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirmPassword">{t('loginPage.confirmPassword')}</label>
                                <input className="w-full px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" type="password" id="confirmPassword" name="confirmPassword" required />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                                {isSubmitting ? t('loginPage.registering') : t('loginPage.register')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;