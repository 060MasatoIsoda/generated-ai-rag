import { SearchResult } from '../../types/Search'
import { useLanguage } from '../../contexts/LanguageContext'

interface SearchResultsProps {
  results: SearchResult;
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

      {results.documents ? (
        <>
          <h2>{t.SEARCH.RESULTS.replace('{count}', totalResults.toString())}</h2>
          <ul className="results-list">
            <div className="highest-score-result">
              <h3>{t.SEARCH.HIGHEST_SCORE_ANSWER}</h3>
              <p>{results.highest_score_text}</p>
            </div>

            {results.documents.length > 0 && (
              <div className="all-results">
                <h3>{t.SEARCH.ALL_RESULTS}</h3>
                {results.documents.map((result, index) =>
                  result.score ? (
                    <li key={index} className="result-item">
                      <h3>{t.SEARCH.ANSWER} {index + 1} ({t.SEARCH.SCORE}: {result.score.toFixed(4)})</h3>
                      <p>{result.content.text}</p>
                    </li>
                  ) : null
                )}
              </div>
            )}
          </ul>
        </>
      ) : query && !loading && !error ? (
        <p className="no-results">{t.SEARCH.NO_RESULTS}</p>
      ) : null}
    </div>
  )
}

export default SearchResults
