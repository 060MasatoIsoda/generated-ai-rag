import { SearchStreamingResult } from '../../types/SearchStreaming'
import { useLanguage } from '../../contexts/LanguageContext'
import PdfThumbnail from '../PdfThumbnail/PdfThumbnail';
import { useSectionResult } from '../../contexts/hooks/useSectionResult';

interface SearchStreamingResultsProps {
  results: SearchStreamingResult;
  streamingText?: string;
  query: string;
  loading: boolean;
  error: string | null;
}

const SearchStreamingResults = ({ query, loading, error }: SearchStreamingResultsProps) => {
  const { t } = useLanguage();
  const { results, isFinished, hasResults } = useSectionResult();

  return (
    <div className="results-container">
      {error && <div className="error">{error}</div>}

      {hasResults() ? (
        <>
          <ul className="results-list">
            {Object.entries(results).map(([sectionName, sectionResult]) => (
              <li key={sectionName} className="section-result">
                <h2 className="section-name">{sectionName}</h2>

                <div className="streaming-result">
                  <h3>{t.SEARCH.RESULT_MESSAGE}</h3>
                  <p>{sectionResult?.answer}</p>
                </div>

                {sectionResult?.docs && sectionResult.docs.length > 0 && (
                  <div className="all-results">
                    <h3>{t.SEARCH.ALL_RESULTS}</h3>
                    {sectionResult?.docs.map((doc, index) => (
                      <div key={index} className="result-item">
                        <h3>{t.SEARCH.ANSWER} {index + 1} ({t.SEARCH.SCORE}: {(doc.similarity).toFixed(2)}%)</h3>
                        <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                          {t.SEARCH.REFERENCE_DOCUMENT}
                        </a>
                        <PdfThumbnail url={doc.documentUrl} pageNumber={doc.pageNumber} />
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {!isFinished && (
            <div className="loading-indicator">
              <p>{t.SEARCH.BUTTON_LOADING}</p>
            </div>
          )}
        </>
      ) : query && !loading && !error ? (
        <p className="no-results">{t.SEARCH.NO_RESULTS}</p>
      ) : loading ? (
        <p className="loading">{t.SEARCH.BUTTON_LOADING}</p>
      ) : null}
    </div>
  )
}

export default SearchStreamingResults
