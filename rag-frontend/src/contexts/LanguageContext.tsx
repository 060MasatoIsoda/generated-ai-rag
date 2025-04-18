import React, { createContext, useContext, useState } from 'react'
import { ja } from '../constants/locales/ja'
import { en } from '../constants/locales/en'
import { Locale } from '../constants/locales/type'

type Language = 'ja' | 'en'

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: Locale
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ja')

  const t = language === 'ja' ? ja : en

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
