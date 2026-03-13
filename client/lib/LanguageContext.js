"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { TRANSLATIONS } from "./constants";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [activeLanguage, setActiveLanguage] = useState("English");
  const [mounted, setMounted] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("green-mandi-language");
    if (savedLanguage && TRANSLATIONS[savedLanguage]) {
      setActiveLanguage(savedLanguage);
    }
    setMounted(true);
  }, []);

  // Save changes to localStorage
  const updateLanguage = (language) => {
    if (TRANSLATIONS[language]) {
      setActiveLanguage(language);
      localStorage.setItem("green-mandi-language", language);
    }
  };

  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={{ activeLanguage, updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
