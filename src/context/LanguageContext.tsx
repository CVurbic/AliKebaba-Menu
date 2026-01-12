// LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";
import { Language, translations } from "../services/language";

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getProductTranslation: (product: any, field: string) => string;
  formatItemsCount: (count: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("hr");

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
  };

  const t = (key: string): string => {
    return translations[currentLanguage][key] || key;
  };

  const getProductTranslation = (product: any, field: string): string => {
    const langField = `${field}_${currentLanguage}`;
    if (product?.[langField]) return product[langField];
    return product?.[field];
  };

  // HR 1/2-4/ostalo, ostali jezici: one/other
  const formatItemsCount = (count: number): string => {
    const dict = translations[currentLanguage];

    if (currentLanguage === "hr") {
      const mod10 = count % 10;
      const mod100 = count % 100;

      // 1, 21, 31... (ali ne 11)
      if (mod10 === 1 && mod100 !== 11) return `${count} ${dict.items_one}`;

      // 2-4, 22-24... (ali ne 12-14)
      if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
        return `${count} ${dict.items_few}`;
      }

      return `${count} ${dict.items_many}`;
    }

    // EN/DE/TR
    const key = count === 1 ? "items_one" : "items_other";
    return `${count} ${dict[key]}`;
  };

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, setLanguage, t, getProductTranslation, formatItemsCount }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
