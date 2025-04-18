import { useState } from 'react'
import { searchDocuments, SearchResult } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'

interface SearchFormProps {
  onSearchResults: (results: SearchResult[], totalResults: number) => void;
  onSearchError: (error: string) => void;
  onSearchStart: (query: string) => void;
}

const SearchForm = ({ onSearchResults, onSearchError, onSearchStart }: SearchFormProps) => {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    onSearchStart(query)

    try {
      const response = await searchDocuments(query)
      onSearchResults(response.results, response.total)
    } catch (err) {
      console.error('検索中にエラーが発生しました:', err)
      onSearchError(t.SEARCH.ERROR)
    } finally {
      setLoading(false)
    }
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
