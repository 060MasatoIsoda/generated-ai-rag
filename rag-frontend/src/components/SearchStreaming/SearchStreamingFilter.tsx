import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import './SearchStreamingFilter.css'
import { MasterDataItem } from '../../types/SearchStreaming'
import { fetchMasterData } from '../../services/api'

// フィルタリングのオプションを定義
export interface FilterOptions {
  category?: string;
  subcategories?: string[];
  selectedSubcategories?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  relevanceThreshold?: number;
  sourceTypes?: string[];
}

interface SearchStreamingFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const SearchStreamingFilter = ({ onFilterChange }: SearchStreamingFilterProps) => {
  const { t } = useLanguage()
  const [masterData, setMasterData] = useState<MasterDataItem[]>([]);
  const [sectionNameList, setSectionNameList] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchMasterData();
        setMasterData(response.results);
        const uniqueSectionNames = [...new Set(response.results.map((item: MasterDataItem) => item.sectionName))];
        setSectionNameList(uniqueSectionNames as string[]);
      } catch (error) {
        console.error("マスターデータの取得に失敗しました:", error);
      }
    };
    fetchData();
  }, []);

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

  // カテゴリ変更ハンドラー
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSectionName = e.target.value;

    // 選択されたsectionNameに対応するすべてのカテゴリを取得
    const categoriesForSelectedGroup = masterData
      .filter(item => item.sectionName === selectedSectionName)
      .flatMap(item => item.categories);

    // 重複を取り除く
    const uniqueCategories = [...new Set(categoriesForSelectedGroup)];

    const newFilters = {
      ...filters,
      category: selectedSectionName,
      subcategories: uniqueCategories // 選択されたグループに関連するカテゴリをセット
    };

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // サブカテゴリ変更ハンドラー
  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    let newSelectedSubcategories: string[] = [...(filters.selectedSubcategories || [])];

    if (checked) {
      newSelectedSubcategories.push(value);
    } else {
      newSelectedSubcategories = newSelectedSubcategories.filter(cat => cat !== value);
    }

    const newFilters = {
      ...filters,
      selectedSubcategories: newSelectedSubcategories
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
          {sectionNameList.map(sectionName => (
            <option key={sectionName} value={sectionName}>
              {sectionName}
            </option>
          ))}
        </select>
      </div>

      {/* サブカテゴリフィルター - カテゴリが選択されている場合のみ表示 */}
      {filters.category && filters.subcategories && filters.subcategories.length > 0 && (
        <div className="filter-group">
          <label>{t.SEARCH.FILTER_SUBCATEGORY}:</label>
          <div className="checkbox-group">
            {filters.subcategories.map(category => (
              <div key={category}>
                <input
                  type="checkbox"
                  id={`subcategory-${category}`}
                  value={category}
                  checked={filters.selectedSubcategories?.includes(category) || false}
                  onChange={handleSubcategoryChange}
                />
                <label htmlFor={`subcategory-${category}`}>
                  {category}
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

export default SearchStreamingFilter
