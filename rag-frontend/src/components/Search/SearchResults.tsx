import { SearchResult } from '../../types/Search'
import { useLanguage } from '../../contexts/LanguageContext'
import PdfThumbnail from '../PdfThumbnail/PdfThumbnail';
interface SearchResultsProps {
  results: SearchResult;
  query: string;
  loading: boolean;
  error: string | null;
}

const SearchResults = ({ results, query, loading, error }: SearchResultsProps) => {
  const { t } = useLanguage()

  return (
    <div className="results-container">
      {error && <div className="error">{error}</div>}

      {results.documents ? (
        <>
          <ul className="results-list">
            <div className="highest-score-result">
              <h3>{t.SEARCH.RESULT_MESSAGE}</h3>
              <p>{results.result_message}</p>
            </div>

            {results.documents.length > 0 && (
              <div className="all-results">
                <h3>{t.SEARCH.ALL_RESULTS}</h3>
                {results.documents.map((result, index) =>
                  result.Score ? (
                    <li key={index} className="result-item">
                      <h3>{t.SEARCH.ANSWER} {index + 1} ({t.SEARCH.SCORE}: {result.Score.toFixed(4)})</h3>
                      <p>{result.Content}</p>
                      <a href={result.DocumentUrl} target="_blank" rel="noopener noreferrer">{t.SEARCH.REFERENCE_DOCUMENT}</a>
                      <PdfThumbnail url={result.DocumentUrl} pageNumber={result.DocumentPage} />
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
