import axios from 'axios';

// APIのベースURLを設定
// 開発環境と本番環境で異なる場合は環境変数などで切り替えることができます
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Axiosインスタンスを作成
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// レスポンスのインターフェース
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

// 検索結果のインターフェース
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  url?: string;
  metadata?: Record<string, unknown>;
}

// 検索APIを呼び出す関数
export const searchDocuments = async (query: string): Promise<SearchResponse> => {
  try {
    const response = await apiClient.get<SearchResponse>('/api/search', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('APIリクエストエラー:', error);
    throw error;
  }
};

export default {
  searchDocuments,
};
