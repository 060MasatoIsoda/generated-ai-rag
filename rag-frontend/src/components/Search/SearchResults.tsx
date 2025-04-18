import { SearchResult } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'

interface SearchResultsProps {
  results: SearchResult[];
  totalResults: number;
  query: string;
  loading: boolean;
  error: string | null;
}

const SearchResults = ({ results, totalResults, query, loading, error }: SearchResultsProps) => {
  const { t } = useLanguage()

  return (
    <div className="results-container">
      {error && <div className="error">{error}</div>}

      {results.length > 0 ? (
        <>
          <h2>{t.SEARCH.RESULTS.replace('{count}', totalResults.toString())}</h2>
          <ul className="results-list">
            {results.map((result) => (
              <li key={result.id} className="result-item">
                <h3>{result.title}</h3>
                <p>{result.content}</p>
                {result.url && (
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    {t.SEARCH.VIEW_SOURCE}
                  </a>
                )}
                <small>
                  {t.SEARCH.RELEVANCE.replace('{score}', result.score.toFixed(2))}
                </small>
              </li>
            ))}
          </ul>
        </>
      ) : query && !loading && !error ? (
        <p className="no-results">{t.SEARCH.NO_RESULTS}</p>
      ) : null}
    </div>
  )
}

export default SearchResults
