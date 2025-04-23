export type MasterDataItem = {
  groupName: string;
  createdAt: string;
  sectionName: string;
  categories: string[];
  updatedAt: string;
};

// コンテンツの型定義
export interface DocumentContent {
  text: string;
  type: string;
}

// S3ロケーションの型定義
export interface S3Location {
  uri: string;
}

// ドキュメントロケーションの型定義
export interface DocumentLocation {
  s3Location: S3Location;
  type: string;
}

// メタデータの型定義
export interface DocumentMetadata {
  "x-amz-bedrock-kb-source-uri": string;
  "x-amz-bedrock-kb-document-page-number": number;
  "x-amz-bedrock-kb-chunk-id": string;
  "x-amz-bedrock-kb-data-source-id": string;
}

// ドキュメント単体の型定義
export interface Document {
  content: DocumentContent;
  location: DocumentLocation;
  metadata: DocumentMetadata;
  score: number;
}

// レスポンスのインターフェース
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query?: string;
}

// 検索結果のインターフェース
export interface SearchResult {
  category_name: string;
  documents: Document[];
  section_name: string;
  highest_score_text: string;
}

export type SearchPayload = {
  search_text: string;
  search_target: {
    section_name: string;
    category: string[];
  }[];
};
