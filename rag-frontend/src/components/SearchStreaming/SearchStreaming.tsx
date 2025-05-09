import { useState } from "react";
import { SearchStreamingResult, SearchStreamingPayload } from "../../types/SearchStreaming";
import SearchStreamingForm from "./SearchStreamingForm";
import SearchStreamingResults from "./SearchStreamingResults";
import SearchStreamingFilter, { FilterOptions } from "./SearchStreamingFilter";
import { useLanguage } from "../../contexts/LanguageContext";
import PageLayout from "../common/Layout";
import "./SearchStreaming.css";
import { searchDocuments } from "../../services/api";

const initialResults: SearchStreamingResult = {
  categories: [],
  documents: [],
  section_name: "",
  highest_score_text: "",
  result_message: "",
};

function SearchStreaming() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchStreamingResult>(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({});



  // 検索実行関数を追加（SearchStreamingFormから移動）
  const handleSearchStreaming = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setQuery(searchQuery);

    const searchPayload: SearchStreamingPayload = {
      search_text: searchQuery,
      search_target: {
        section_name: filters.category || "",
        category: filters.subcategories || [],
      },
    };

    try {
      const data = await searchDocuments(searchPayload);
      setResults(data.results[0]); // APIから返ってくる結果の構造に合わせて調整
      setTotalResults(data.total);
      setError(null);
    } catch (err) {
      console.error('検索中にエラーが発生しました:', err);
      setError(t.SEARCH.ERROR);
      setResults(initialResults);
      setTotalResults(0);
    } finally {
      setLoading(false);
      console.log(totalResults);
    }
  };

  // フィルター変更ハンドラ
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: 既存の検索結果にフィルターを適用するロジックを追加
    console.log("Applied filters:", newFilters);
  };

  return (
    <PageLayout title={t.SEARCH.TITLE}>
      <div className="container">
        <header>
          <h1>{t.SEARCH.TITLE}</h1>
        </header>

        <div className="search-page-layout">
          <div className="search-sidebar">
            <SearchStreamingFilter onFilterChange={handleFilterChange} />
          </div>

          <div className="search-main">
            <SearchStreamingForm
              onSearchStreaming={handleSearchStreaming}
              loading={loading}
            />

            <SearchStreamingResults
              results={results}
              query={query}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default SearchStreaming;
