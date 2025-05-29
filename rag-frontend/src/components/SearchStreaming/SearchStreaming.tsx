import { useState } from "react";
import { SearchStreamingPayload } from "../../types/SearchStreaming";
import SearchStreamingForm from "./SearchStreamingForm";
import SearchStreamingResults from "./SearchStreamingResults";
import SearchStreamingFilter, { FilterOptions } from "./SearchStreamingFilter";
import { useLanguage } from "../../contexts/LanguageContext";
import PageLayout from "../common/Layout";
import "./SearchStreaming.css";
import { documentApi } from "../../services/api";
import { useSectionResult } from "../../contexts/hooks/useSectionResult";

function SearchStreaming() {
  const { t } = useLanguage();
  const {
    updateAnswer,
    updateDoc,
    setIsFinished,
    clearResults
  } = useSectionResult();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleSearchStreaming = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setQuery(searchQuery);
    clearResults();
    setIsFinished(false);

    const searchPayload: SearchStreamingPayload = {
      search_text: searchQuery,
      search_target: filters.category ? {
        section_name: filters.category,
        category: filters.subcategories || [],
      } : undefined,
    };

    try {
      // 検索を実行
      documentApi.searchStreamingDocuments(searchPayload,
        {
          updateAnswer,
          updateDoc,
          setIsFinished,
        }
      );
      setError(null);
    } catch (err) {
      console.error('処理中にエラーが発生しました:', err);
      setError(t.SEARCH.ERROR);
      setIsFinished(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="search-streaming-container">
        <h1>{t.SEARCH_STREAMING.TITLE}</h1>
        <SearchStreamingForm
          onSearchStreaming={handleSearchStreaming}
          loading={loading}
        />
        <SearchStreamingFilter
          onFilterChange={setFilters}
        />
        <SearchStreamingResults
          results={{sectionName: "", documents: []}}
          streamingText=""
          query={query}
          loading={loading}
          error={error}
        />
      </div>
    </PageLayout>
  );
}

export default SearchStreaming;
