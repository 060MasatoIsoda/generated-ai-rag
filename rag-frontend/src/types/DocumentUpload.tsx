import { Section, Category } from './CategoryManagement';

export interface UploadFile {
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface DocumentUploadFormData {
  selectedSection: Section | null;
  selectedCategory: Category | null;
  files: UploadFile[];
}

export interface UploadResponse {
  success: boolean;
  message: string;
  fileKeys?: string[];
  errors?: Record<string, string>;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
}
