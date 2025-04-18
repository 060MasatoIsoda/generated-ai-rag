import { useState } from 'react'
import './App.css'
import { searchDocuments, SearchResult } from './services/api'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await searchDocuments(query)
      setResults(response.results)
      setTotalResults(response.total)
    } catch (err) {
      console.error('検索中にエラーが発生しました:', err)
      setError('検索中にエラーが発生しました。もう一度お試しください。')
      setResults([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>RAG検索アプリ</h1>
      </header>

      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索キーワードを入力..."
          className="search-input"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="search-button"
          disabled={loading}
        >
          {loading ? '検索中...' : '検索'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="results-container">
        {results.length > 0 ? (
          <>
            <h2>検索結果: {totalResults}件</h2>
            <ul className="results-list">
              {results.map((result) => (
                <li key={result.id} className="result-item">
                  <h3>{result.title}</h3>
                  <p>{result.content}</p>
                  {result.url && <a href={result.url} target="_blank" rel="noopener noreferrer">ソースを表示</a>}
                  <small>関連度: {result.score.toFixed(2)}</small>
                </li>
              ))}
            </ul>
          </>
        ) : query && !loading && !error ? (
          <p className="no-results">検索結果がありません</p>
        ) : null}
      </div>
    </div>
  )
}

export default App
