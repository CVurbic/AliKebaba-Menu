// LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language, translations, availableLanguages } from '../services/language';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getProductTranslation: (product: any, field: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('hr');

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    // Optionally save to localStorage for persistence
    localStorage.setItem('preferredLanguage', lang);
  };

  // Simple translation function
  const t = (key: string): string => {
    return translations[currentLanguage][key] || key;
  };
  
  // Function to get product translations from the database
  const getProductTranslation = (product: any, field: string): string => {
    // First check if we have a translation in the current language
    const langField = `${field}_${currentLanguage}`;
    
    // If translation exists, use it, otherwise fall back to the default field
    if (product[langField]) {
      return product[langField];
    }
    
    return product[field];
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, getProductTranslation }}>
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
