import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

interface SearchStreamingFormProps {
  onSearchStreaming: (query: string) => void;
  loading: boolean;
}

const SearchStreamingForm = ({ onSearchStreaming, loading }: SearchStreamingFormProps) => {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')

  const handleSearchStreaming = () => {
    if (!query.trim()) return
    onSearchStreaming(query);
  }

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.SEARCH.PLACEHOLDER}
        className="search-input"
        onKeyDown={(e) => e.key === 'Enter' && handleSearchStreaming()}
      />
      <button
        onClick={handleSearchStreaming}
        className="search-button"
        disabled={loading}
      >
        {loading ? t.SEARCH.BUTTON_LOADING : t.SEARCH.BUTTON}
      </button>
    </div>
  )
}

export default SearchStreamingForm
