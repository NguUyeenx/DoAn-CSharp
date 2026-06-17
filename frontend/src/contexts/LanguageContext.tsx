import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import i18n from '@/i18n';
import { api } from '@/api/client';
import type { Language } from '@/types/api';
interface LanguageContextValue {
  language: string;
  changeLanguage: (lng: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'vk_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || i18n.language || 'en';
  });

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem(STORAGE_KEY, lng);
    setLanguageState(lng);

    // Sync to backend if logged in / api is available
    try {
      await api.post('/language/set', { language: lng });
    } catch (err) {
      // Endpoint might not exist or user is not logged in, ignore gracefully
    }
  };

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      api.get<Language[]>('/admin/languages').then(res => {
        const defaultLang = res.data.find(l => l.isDefault);
        if (defaultLang && defaultLang.code !== i18n.language) {
          i18n.changeLanguage(defaultLang.code);
          setLanguageState(defaultLang.code);
        }
      }).catch(console.error);
    }

    const handleLanguageChanged = (lng: string) => {
      setLanguageState(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
