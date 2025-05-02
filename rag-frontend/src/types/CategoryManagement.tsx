export interface Category {
  id: string;
  categoryName: string;
}

export interface Section {
  id: string;
  sectionName: string;
  categories: Category[];
}

export type MasterDataResponse = {
  query: string;
  results: MasterDataItem[];
  total: number;
};

export type MasterDataItem = {
  id: string;
  updated_at: string;
  sectionName: string;
  categories: string[];
};

export type SavePayload = {
  sections: Section[];
};
