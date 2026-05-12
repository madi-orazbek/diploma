'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { t, Lang, TranslationKey } from './translations';

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  T: (key) => t.en[key] as string,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null) as Lang | null;
    if (saved === 'ru' || saved === 'en') setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof localStorage !== 'undefined') localStorage.setItem('lang', l);
  }

  function T(key: TranslationKey): string {
    return (t[lang] as Record<string, string>)[key] ?? (t.en as Record<string, string>)[key] ?? key;
  }

  return <I18nContext.Provider value={{ lang, setLang, T }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
