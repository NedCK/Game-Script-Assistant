import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

type Language = 'en' | 'zh';
type Translations = Record<string, string>;

// A simple in-memory cache to avoid re-fetching translations
const translationsCache: Partial<Record<Language, Translations>> = {};

interface I18nContextType {
  language: Language;
  t: (key: string) => string; // Using string for the key is more flexible for dynamic loading
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  language: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, language }) => {
  const [translations, setTranslations] = useState<Translations | null>(
    // Initialize from cache if available
    translationsCache[language] || null
  );

  useEffect(() => {
    let isMounted = true;
    const loadTranslations = async () => {
      // If translations are already in the cache, use them.
      if (translationsCache[language]) {
        if (isMounted) {
            setTranslations(translationsCache[language]);
        }
        return;
      }
      
      try {
        // Construct the path relative to the root of the site (where index.html is)
        const response = await fetch(`./i18n/locales/${language}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Translations = await response.json();
        
        if (isMounted) {
          translationsCache[language] = data;
          setTranslations(data);
        }
      } catch (error) {
        console.error(`Failed to load translations for language "${language}":`, error);
        // Set to an empty object on error to prevent re-fetching and signal that loading is "done"
        if (isMounted) {
            setTranslations({});
        }
      }
    };

    loadTranslations();
    
    return () => {
        isMounted = false;
    };
  }, [language]);

  const t = useCallback(
    (key: string): string => {
      // While loading (translations is null), or if a key is missing, return the key itself.
      return translations?.[key] || key;
    },
    [translations]
  );
  
  const contextValue: I18nContextType = {
    language,
    t,
  };

  // We can render children immediately. The `t` function will provide fallback keys while loading.
  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
