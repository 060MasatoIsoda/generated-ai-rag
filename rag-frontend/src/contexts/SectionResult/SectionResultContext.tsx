import { createContext } from 'react';
import { LocalSectionResult, LocalDocItem } from '../../types/SearchStreaming';

interface SectionResultContextType {
  results: { [sectionName: string]: LocalSectionResult | undefined };
  isFinished: boolean;
  setIsFinished: (isFinished: boolean) => void;
  hasResults: () => boolean;
  updateAnswer: (sectionName: string, text: string) => void;
  updateDoc: (sectionName: string, doc: LocalDocItem) => void;
  clearResults: () => void;
}

export const SectionResultContext = createContext<SectionResultContextType | undefined>(undefined);
