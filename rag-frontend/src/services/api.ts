import axios from "axios";
import { SearchPayload } from "../types/Search";
import { SavePayload } from "../types/CategoryManagement";
import { PresignedUrlResponse } from "../types/DocumentUpload";
import {
  SearchStreamingPayload,
  GeneratedResultActions,
  LocalDocItem,
  DecodedResponse,
  DecodedResponseDoc,
} from "../types/SearchStreaming";

// APIのベースURLを設定
// 開発環境と本番環境で異なる場合は環境変数などで切り替えることができます
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL_STREAMING =
  import.meta.env.VITE_KNOWLEDGEBASE_GENERATE_LAMBDA_URL ||
  "http://localhost:8000";

// Axiosインスタンスを作成
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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

export const documentApi = {
  searchStreamingDocuments: async (
    payload: SearchStreamingPayload,
    actions: GeneratedResultActions
  ): Promise<void> => {
    const generateResult = async (payload: SearchStreamingPayload) => {
      const response = await fetch(API_BASE_URL_STREAMING, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("検索中にエラーが発生しました");
      }

      const data = response.body?.getReader() as ReadableStreamDefaultReader;
      if (!data) {
        throw new Error("レスポンスの読み取りに失敗しました");
      }
      processStreamingResponse(data);
    };

    const processStreamingResponse = async (
      reader: ReadableStreamDefaultReader
    ) => {
      const decoder = new TextDecoder();

      let buffer = "";
      let currentSectionName = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (buffer.length > 0)
              actions.updateAnswer(currentSectionName, buffer);
            actions.setIsFinished(true);
            break;
          }

          const decodedValue = decoder.decode(value, { stream: true });
          const lines = decodedValue.split("\n");
          for (const line of lines) {
            if (!line.trim() || !line.startsWith("data: ")) continue;

            const jsonString = line.replace(/^data: /, "").trim();
            const parsedValue = JSON.parse(jsonString) as DecodedResponse;
            if (
              currentSectionName !== parsedValue.sectionName &&
              buffer !== ""
            ) {
              actions.updateAnswer(currentSectionName, buffer);
              buffer = "";
            }
            currentSectionName = parsedValue.sectionName;

            switch (parsedValue.type) {
              case "resultText":
                buffer += parsedValue.content;
                break;
              case "documents": {
                const document = JSON.parse(
                  JSON.stringify(parsedValue.content)
                ) as DecodedResponseDoc;
                const convertedDoc = {
                  documentUrl: document.documentUrl,
                  pageNumber: document.pageNumber,
                  similarity: Number(document.score) * 100,
                };
                actions.updateDoc(
                  currentSectionName,
                  convertedDoc as LocalDocItem
                );
                break;
              }
            }

            if (buffer.length > 10) {
              actions.updateAnswer(currentSectionName, buffer);
              buffer = "";
            }
          }
        }
      } catch (error) {
        console.error("Stream processing error:", error);
        throw error;
      }
    };

    try {
      const response = await apiClient.post("/knowledgebase/search", payload);
      const generatePayload = {
        search_text: payload.search_text,
        retrievedResults: response.data.results,
      };
      generateResult(generatePayload);
    } catch (error) {
      console.error("Error retrieving documents:", error);
      throw error;
    }
  },
};

export default {
  searchDocuments,
  fetchMasterData,
  saveCategories,
  getPresignedUrl,
  uploadFileToS3,
  documentApi,
};
