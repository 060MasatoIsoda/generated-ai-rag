import { SearchResult } from '../../types/Search'
import { useLanguage } from '../../contexts/LanguageContext'
import { useEffect, useState } from 'react'
interface SearchResultsProps {
  results: SearchResult;
  totalResults: number;
  query: string;
  loading: boolean;
  error: string | null;
}

const SearchResults = ({ results, totalResults, query, loading, error }: SearchResultsProps) => {
  const { t } = useLanguage()
  const [updateCount, setUpdateCount] = useState(0);
  // useEffect(() => {
  //   // 最初の初期値（空オブジェクト）もカウントしたくない場合はガード
  //   if (results.documents.length === 0 && updateCount === 0) return;

  //   setUpdateCount((prev: number) => prev + 1);
  //   console.log("🔁 resultsが更新されました:");
  //   console.log("✅ 更新回数:", updateCount + 1);
  //   console.log("📦 新しいresultsの中身:", results);
  // }, [results, updateCount]);

  return (
    <div className="results-container">
      {error && <div className="error">{error}</div>}

      {results.documents ? (
        <>
          <h2>{t.SEARCH.RESULTS.replace('{count}', totalResults.toString())}</h2>
          <ul className="results-list">
            {results.documents.length > 0 ? (
              results.documents.map((result) => (
                <li key={result.score} className="result-item">
                  <h3>回答</h3>
                  <p>{result.content.text}</p>
                </li>
              ))
            ) : (
              <li className="result-item">
                <h3>回答</h3>
                <p>回答がありません</p>
              </li>
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
