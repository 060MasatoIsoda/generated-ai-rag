import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

interface SearchFormProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

const SearchForm = ({ onSearch, loading }: SearchFormProps) => {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (!query.trim()) return
    onSearch(query);
  }

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.SEARCH.PLACEHOLDER}
        className="search-input"
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button
        onClick={handleSearch}
        className="search-button"
        disabled={loading}
      >
        {loading ? t.SEARCH.BUTTON_LOADING : t.SEARCH.BUTTON}
      </button>
    </div>
  )
}

export default SearchForm
