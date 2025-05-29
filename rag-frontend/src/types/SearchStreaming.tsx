export type MasterDataItem = {
  id: string;
  updated_at: string;
  sectionName: string;
  categories: string[];
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
  id: string;
  DocumentTitle: string;
  DocumentUrl: string;
  DocumentPage: string;
  Content: string;
  Score: number;
}

// レスポンスのインターフェース
export interface SearchStreamingResponse {
  results: SearchStreamingResult[];
  total: number;
  query?: string;
}

// 検索結果のインターフェース
export interface SearchStreamingResult {
  sectionName: string;
  documents: {
    documentUrl: string;
    pageNumber: number;
    score: number;
  }[];
}

// ストリーミングレスポンスのインターフェース
export interface StreamingResponse {
  type: 'resultText' | 'documents' | 'error';
  sectionName?: string;
  content: string | {
    documentUrl: string;
    pageNumber: number;
    score: number;
  };
}

// 検索リクエストのペイロード
export type SearchStreamingPayload = {
  search_text: string;
  search_target?: {
    section_name: string;
    category: string[];
  };
};

// 生成リクエストのペイロード
export type GenerateStreamingPayload = {
  searchText: string;
  documents: {
    documentUrl: string;
    pageNumber: number;
    score: number;
  }[];
  sectionName: string;
};

export type GeneratedResultActions = {
  updateAnswer: (sectionName: string, text: string) => void;
  updateDoc: (sectionName: string, doc: LocalDocItem) => void;
  setIsFinished: (isFinished: boolean) => void;
};

export type LocalSectionResult = {
  answer: string;
  docs: LocalDocItem[];
};


export type LocalDocItem = {
  similarity: number;
  documentUrl: string;
  pageNumber: string;
};

export type DecodedResponse = {
  type: string;
  sectionName: string;
  content: string;
};

export type DecodedResponseDoc = {
  documentUrl: string;
  pageNumber: string;
  score: string;
};

export type DecodedResponseWithDoc = {
  type: string;
  content: DecodedResponseDoc[];
};

export type MasterDataResponse = {
  query: string;
  results: MasterDataItem[];
  total: number;
};

export type GeneratePayload = {
  searchText: string;
  documents: {
    documentUrl: string;
    pageNumber: number;
    score: number;
  }[];
};
