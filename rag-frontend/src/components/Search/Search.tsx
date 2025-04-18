import { useState } from "react";
import { SearchResult } from "../../services/api";
import SearchForm from "./SearchForm";
import SearchResults from "./SearchResults";
import SearchFilter, { FilterOptions } from "./SearchFilter";
import { useLanguage } from "../../contexts/LanguageContext";
import PageLayout from "../common/Layout";
import "./Search.css";

function Search() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleSearchResults = (
    searchResults: SearchResult[],
    total: number
  ) => {
    setResults(searchResults);
    setTotalResults(total);
    setError(null);
    setLoading(false);
  };

  const handleSearchError = (errorMessage: string) => {
    setError(errorMessage);
    setResults([]);
    setTotalResults(0);
    setLoading(false);
  };

  // 検索中の状態を設定
  const handleSearchStart = (searchQuery: string) => {
    setQuery(searchQuery);
    setLoading(true);
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
            <SearchFilter onFilterChange={handleFilterChange} />
          </div>

          <div className="search-main">
            <SearchForm
              onSearchResults={handleSearchResults}
              onSearchError={handleSearchError}
              onSearchStart={handleSearchStart}
            />

            <SearchResults
              results={results}
              totalResults={totalResults}
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

export default Search;
