import { SearchResult } from '../../types/Search'
import { useLanguage } from '../../contexts/LanguageContext'
import { useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist'

// PDF.jsワーカーの設定
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface SearchResultsProps {
  results: SearchResult;
  totalResults: number;
  query: string;
  loading: boolean;
  error: string | null;
}

const SearchResults = ({ results, totalResults, query, loading, error }: SearchResultsProps) => {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    results.documents.forEach(async (result) => {
      const loadPdf = async () => {
        try {
          const pdf = await pdfjsLib.getDocument(result.DocumentUrl).promise;
          const page = await pdf.getPage(parseInt(result.DocumentPage));
          const viewport = page.getViewport({ scale: 1.0 });
          const canvas = canvasRef.current;
          if (!canvas) return;
          const context = canvas.getContext('2d');
          if (!context) return;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport: viewport }).promise;
        } catch (error) {
          console.error('PDFファイルの読み込みに失敗しました:', error);
        }
      }
      loadPdf();
    })
  }, [results.documents])


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
                  result.Score ? (
                    <li key={index} className="result-item">
                      <h3>{t.SEARCH.ANSWER} {index + 1} ({t.SEARCH.SCORE}: {result.Score.toFixed(4)})</h3>
                      <p>{result.Content}</p>
                      <canvas ref={canvasRef} />
                      <a href={result.DocumentUrl} target="_blank" rel="noopener noreferrer">{t.SEARCH.REFERENCE_DOCUMENT}</a>
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
