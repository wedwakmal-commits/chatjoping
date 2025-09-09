import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { translations } from '../lib/translations';

type Language = 'ar' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, replacements?: { [key: string]: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('ar');

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    // FIX: Refactored the 't' function to be more type-safe and handle unresolved keys gracefully.
    const t = useCallback((key: string, replacements?: { [key: string]: string }): string => {
        const keys = key.split('.');
        let result: any = translations[language];
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return key; // Return the key if not found
            }
        }

        if (typeof result === 'string') {
            if (replacements) {
                return Object.entries(replacements).reduce((acc, [placeholder, value]) => {
                    return acc.replace(`{${placeholder}}`, value);
                }, result);
            }
            return result;
        }

        // If after traversal result is not a string (e.g., a sub-object of translations),
        // it means the key was incomplete. Return the original key.
        return key;
    }, [language]);

    const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
