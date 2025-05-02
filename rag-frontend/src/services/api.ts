import axios from "axios";
import { SearchPayload } from "../types/Search";
import { SavePayload } from "../types/CategoryManagement";
import { PresignedUrlResponse } from "../types/DocumentUpload";

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

export const saveCategories = async (savePayload: SavePayload) => {
  try {
    const response = await apiClient.post(
      "/masterdata/sections-categories",
      savePayload
    );
    return response.data;
  } catch (error) {
    console.error("APIリクエストエラー:", error);
    throw error;
  }
};

// プリサインドURLを取得する関数
export const getPresignedUrl = async (
  fileName: string,
  contentType: string,
  sectionName: string,
  categoryName: string
): Promise<PresignedUrlResponse> => {
  try {
    const response = await apiClient.post("/document/presigned-url", {
      fileName,
      contentType,
      sectionName,
      categoryName,
    });
    return response.data;
  } catch (error) {
    console.error("プリサインドURL取得エラー:", error);
    throw error;
  }
};

// S3にファイルを直接アップロードする関数
export const uploadFileToS3 = async (
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    await axios.put(presignedUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  } catch (error) {
    console.error("S3アップロードエラー:", error);
    throw error;
  }
};

export default {
  searchDocuments,
  fetchMasterData,
  saveCategories,
  getPresignedUrl,
  uploadFileToS3,
};
