import { useLanguage } from '../../contexts/LanguageContext'

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="language-switcher">
      <label htmlFor="language-select">{t.COMMON.LANGUAGE_SELECT}: </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'ja' | 'en')}
      >
        <option value="ja">{t.COMMON.LANGUAGE_SELECT_JAPANESE}</option>
        <option value="en">{t.COMMON.LANGUAGE_SELECT_ENGLISH}</option>
      </select>
    </div>
  )
}

export default LanguageSwitcher
