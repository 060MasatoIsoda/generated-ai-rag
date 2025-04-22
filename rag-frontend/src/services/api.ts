import axios from "axios";
import { SearchPayload } from "../types/Search";
// APIのベースURLを設定
// 開発環境と本番環境で異なる場合は環境変数などで切り替えることができます
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Axiosインスタンスを作成
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 検索APIを呼び出す関数
export const searchDocuments = async (searchPayload: SearchPayload) => {
  try {
    const response = await apiClient.post(
      "/knowledgebase/search",
      searchPayload
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.error("APIリクエストエラー:", error);
    throw error;
  }
};

export const fetchMasterData = async () => {
  try {
    const response = await apiClient.get("/masterdata/sections-categories");
    return response.data;
  } catch (error) {
    console.error("APIリクエストエラー:", error);
    return [];
  }
};

export default {
  searchDocuments,
  fetchMasterData,
};
