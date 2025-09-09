import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TaskIcon, LanguageIcon } from '../components/icons';
import { useLanguage } from '../context/LanguageContext';

const LoginPage: React.FC = () => {
    type AuthMode = 'login' | 'register';
    const { language, setLanguage, t } = useLanguage();
    const [mode, setMode] = useState<AuthMode>('login');
    
    // Login States
    const [accountId, setAccountId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Register States
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [adminKey, setAdminKey] = useState('');
    const [regError, setRegError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    
    const { login, registerAdmin } = useAuth();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await login(accountId, password);
            if (!user) {
                setError(t('loginPage.invalidCredentials'));
            }
        } catch (err) {
            setError(t('loginPage.loginError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (regPassword !== confirmPassword) {
            setRegError(t('loginPage.passwordsDoNotMatch'));
            return;
        }
        setRegError('');
        setIsRegistering(true);
        try {
            const user = await registerAdmin(regUsername, regPassword, adminKey);
            if (!user) {
                 setRegError(t('loginPage.registrationFailed'));
            }
        } catch (err: any) {
            setRegError(t(err.message) || t('loginPage.registrationError'));
        } finally {
            setIsRegistering(false);
        }
    };
    
    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="absolute top-4 end-4">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <LanguageIcon className="w-5 h-5" />
                    {t('language')}
                </button>
            </div>

            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <div className="text-center">
                    <div className="flex justify-center mx-auto mb-4 text-indigo-500">
                       <TaskIcon className="w-12 h-12" />
                    </div>
                </div>

                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setMode('login')}
                        className={`w-1/2 py-4 text-sm font-medium text-center transition-colors focus:outline-none ${
                            mode === 'login' 
                            ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        {t('loginPage.loginTab')}
                    </button>
                    <button 
                        onClick={() => setMode('register')}
                        className={`w-1/2 py-4 text-sm font-medium text-center transition-colors focus:outline-none ${
                            mode === 'register' 
                            ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        {t('loginPage.registerTab')}
                    </button>
                </div>

                {mode === 'login' ? (
                    <div>
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                {t('loginPage.welcomeBack')}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {t('loginPage.accessDashboard')}
                            </p>
                        </div>
                        <form className="space-y-6" onSubmit={handleLoginSubmit}>
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div>
                                    <label htmlFor="accountId" className="sr-only">{t('loginPage.accountId')}</label>
                                    <input id="accountId" name="accountId" type="text" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder={t('loginPage.accountId')} value={accountId} onChange={(e) => setAccountId(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="password" className="sr-only">{t('loginPage.password')}</label>
                                    <input id="password" name="password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder={t('loginPage.password')} value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                            <div>
                                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                                    {isLoading ? t('loginPage.loggingIn') : t('loginPage.login')}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div>
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                {t('loginPage.registerAdminTitle')}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {t('loginPage.registerAdminSubtitle')}
                            </p>
                        </div>
                         <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                            <input type="text" placeholder={t('loginPage.newUsername')} required value={regUsername} onChange={e => setRegUsername(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                            <input type="password" placeholder={t('loginPage.password')} required value={regPassword} onChange={e => setRegPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                            <input type="password" placeholder={t('loginPage.confirmPassword')} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                            <input type="password" placeholder={t('loginPage.adminKey')} required value={adminKey} onChange={e => setAdminKey(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                            
                            {regError && <p className="text-sm text-red-500 text-center">{regError}</p>}

                            <div>
                                <button type="submit" disabled={isRegistering} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400">
                                    {isRegistering ? t('loginPage.registering') : t('loginPage.register')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
