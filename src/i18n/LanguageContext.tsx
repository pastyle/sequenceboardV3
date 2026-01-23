import React, { createContext, useContext, useState } from 'react';
import type { Language, TranslationDictionary } from './types';
import { translations } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Try to get language from localStorage, default to 'pt-BR'
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('game_language');
        return (saved === 'en-US' || saved === 'pt-BR') ? saved : 'pt-BR';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('game_language', lang);
    };

    const value = React.useMemo(() => ({
        language,
        setLanguage,
        t: translations[language] || translations['pt-BR']
    }), [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
