import React from 'react';
import { useLanguage } from '../../i18n';
import type { Language } from '../../i18n/types';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
    const { language, setLanguage } = useLanguage();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as Language);
    };

    return (
        <div className={`relative ${className}`}>
            <select
                value={language}
                onChange={handleChange}
                className="bg-bg-panel text-text-primary text-xs py-1 px-2 rounded-md border border-white/10 outline-none focus:border-white/30 appearance-none cursor-pointer pr-6"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 4px center',
                    backgroundSize: '12px'
                }}
            >
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="es">Español</option>
            </select>
        </div>
    );
};
