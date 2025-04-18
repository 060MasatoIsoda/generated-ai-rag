import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import './SearchFilter.css'

// カテゴリとサブカテゴリの定義
interface CategoryData {
  [key: string]: string[];
}

const CATEGORY_MAP: CategoryData = {
  'technology': ['ai', 'web', 'mobile', 'cloud', 'security'],
  'business': ['marketing', 'finance', 'management', 'startup', 'strategy'],
  'science': ['physics', 'biology', 'chemistry', 'astronomy', 'mathematics'],
  'health': ['fitness', 'nutrition', 'medicine', 'mental-health', 'wellness']
};

// フィルタリングのオプションを定義
export interface FilterOptions {
  category?: string;
  subcategories?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  relevanceThreshold?: number;
  sourceTypes?: string[];
}

interface SearchFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const SearchFilter = ({ onFilterChange }: SearchFilterProps) => {
  const { t } = useLanguage()

  // フィルター状態の初期化
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    subcategories: [],
    dateRange: {
      from: '',
      to: ''
    },
    relevanceThreshold: 0.5,
    sourceTypes: []
  })

  // 現在選択されているサブカテゴリのリスト
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([])

  // カテゴリが変更されたときにサブカテゴリのリストを更新
  useEffect(() => {
    if (filters.category && CATEGORY_MAP[filters.category]) {
      setAvailableSubcategories(CATEGORY_MAP[filters.category]);
      // カテゴリが変更されたら、サブカテゴリの選択をリセット
      setFilters(prev => ({
        ...prev,
        subcategories: []
      }));
    } else {
      setAvailableSubcategories([]);
    }
  }, [filters.category]);

  // カテゴリ変更ハンドラー
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = {
      ...filters,
      category: e.target.value
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // サブカテゴリ変更ハンドラー
  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    let newSubcategories: string[] = [...(filters.subcategories || [])];

    if (checked) {
      newSubcategories.push(value);
    } else {
      newSubcategories = newSubcategories.filter(cat => cat !== value);
    }

    const newFilters = {
      ...filters,
      subcategories: newSubcategories
    };

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // 日付範囲変更ハンドラー
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newDateRange = {
      ...filters.dateRange,
      [name]: value
    }
    const newFilters: FilterOptions = {
      ...filters,
      dateRange: newDateRange as FilterOptions['dateRange']
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // 関連性閾値変更ハンドラー
  const handleRelevanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const newFilters = {
      ...filters,
      relevanceThreshold: value
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // ソースタイプ変更ハンドラー
  const handleSourceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    let newSourceTypes: string[] = [...(filters.sourceTypes || [])]

    if (checked) {
      newSourceTypes.push(value)
    } else {
      newSourceTypes = newSourceTypes.filter(type => type !== value)
    }

    const newFilters = {
      ...filters,
      sourceTypes: newSourceTypes
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // リセットハンドラー
  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      category: '',
      subcategories: [],
      dateRange: {
        from: '',
        to: ''
      },
      relevanceThreshold: 0.5,
      sourceTypes: []
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  // サブカテゴリの翻訳キーを取得する関数
  const getSubcategoryTranslationKey = (category: string, subcategory: string) => {
    return `FILTER_${category.toUpperCase()}_${subcategory.toUpperCase().replace('-', '_')}`;
  };

  // サブカテゴリの表示名を取得
  const getSubcategoryName = (category: string, subcategory: string) => {
    const key = getSubcategoryTranslationKey(category, subcategory) as keyof typeof t.SEARCH;
    // 翻訳キーが存在する場合はそれを使用、なければサブカテゴリIDを整形して表示
    return t.SEARCH[key] || subcategory.charAt(0).toUpperCase() + subcategory.slice(1).replace('-', ' ');
  };

  return (
    <div className="search-filter">
      <h3>{t.SEARCH.FILTER_TITLE}</h3>

      {/* カテゴリフィルター */}
      <div className="filter-group">
        <label htmlFor="category">{t.SEARCH.FILTER_CATEGORY}:</label>
        <select
          id="category"
          value={filters.category}
          onChange={handleCategoryChange}
        >
          <option value="">{t.SEARCH.FILTER_ALL}</option>
          <option value="technology">{t.SEARCH.FILTER_TECHNOLOGY}</option>
          <option value="business">{t.SEARCH.FILTER_BUSINESS}</option>
          <option value="science">{t.SEARCH.FILTER_SCIENCE}</option>
          <option value="health">{t.SEARCH.FILTER_HEALTH}</option>
        </select>
      </div>

      {/* サブカテゴリフィルター - カテゴリが選択されている場合のみ表示 */}
      {filters.category && availableSubcategories.length > 0 && (
        <div className="filter-group">
          <label>{t.SEARCH.FILTER_SUBCATEGORY}:</label>
          <div className="checkbox-group">
            {availableSubcategories.map(subcategory => (
              <div key={subcategory}>
                <input
                  type="checkbox"
                  id={`subcategory-${subcategory}`}
                  value={subcategory}
                  checked={filters.subcategories?.includes(subcategory) || false}
                  onChange={handleSubcategoryChange}
                />
                <label htmlFor={`subcategory-${subcategory}`}>
                  {getSubcategoryName(filters.category || '', subcategory)}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 日付範囲フィルター */}
      <div className="filter-group">
        <label htmlFor="dateFrom">{t.SEARCH.FILTER_DATE_RANGE}:</label>
        <div className="date-range">
          <input
            type="date"
            id="dateFrom"
            name="from"
            value={filters.dateRange?.from}
            onChange={handleDateChange}
          />
          <span>～</span>
          <input
            type="date"
            id="dateTo"
            name="to"
            value={filters.dateRange?.to}
            onChange={handleDateChange}
          />
        </div>
      </div>

      {/* 関連性スライダー */}
      <div className="filter-group">
        <label htmlFor="relevance">
          {t.SEARCH.FILTER_RELEVANCE}: {filters.relevanceThreshold}
        </label>
        <input
          type="range"
          id="relevance"
          min="0"
          max="1"
          step="0.1"
          value={filters.relevanceThreshold}
          onChange={handleRelevanceChange}
        />
      </div>

      {/* ソースタイプチェックボックス */}
      <div className="filter-group">
        <label>{t.SEARCH.FILTER_SOURCE_TYPE}:</label>
        <div className="checkbox-group">
          <div>
            <input
              type="checkbox"
              id="web"
              value="web"
              checked={filters.sourceTypes?.includes('web')}
              onChange={handleSourceTypeChange}
            />
            <label htmlFor="web">Web</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="pdf"
              value="pdf"
              checked={filters.sourceTypes?.includes('pdf')}
              onChange={handleSourceTypeChange}
            />
            <label htmlFor="pdf">PDF</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="document"
              value="document"
              checked={filters.sourceTypes?.includes('document')}
              onChange={handleSourceTypeChange}
            />
            <label htmlFor="document">{t.SEARCH.FILTER_DOCUMENT}</label>
          </div>
        </div>
      </div>

      {/* リセットボタン */}
      <button className="filter-reset" onClick={handleReset}>
        {t.SEARCH.FILTER_RESET}
      </button>
    </div>
  )
}

export default SearchFilter
