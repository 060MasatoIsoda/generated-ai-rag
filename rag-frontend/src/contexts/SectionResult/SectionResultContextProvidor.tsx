import { ReactNode, useState } from 'react';
import { LocalDocItem, LocalSectionResult } from '../../types/SearchStreaming';
import { SectionResultContext } from './SectionResultContext';

export function SectionResultProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<{
    [sectionName: string]: LocalSectionResult | undefined
  }>({});

  const hasResults = () => results && Object.keys(results).length > 0

  const [isFinished, setIsFinished] = useState(true)

  const updateAnswer = (sectionName: string, text: string) => {
    setResults(prevResults => {
      const currentResults = { ...prevResults };
      if (!currentResults[sectionName]) {
        currentResults[sectionName] = {
          answer: '',
          docs: []
        };
      }

      currentResults[sectionName] = {
        ...currentResults[sectionName]!,
        answer: currentResults[sectionName]!.answer + text
      };

      return currentResults;
    });
  };

  const updateDoc = (sectionName: string, doc: LocalDocItem) => {
    setResults(prevResults => {
      const currentResults = { ...prevResults };
      if (!currentResults[sectionName]) {
        currentResults[sectionName] = {
          answer: '',
          docs: []
        };
      }

      currentResults[sectionName] = {
        ...currentResults[sectionName]!,
        docs: [...currentResults[sectionName]!.docs, doc]
      };

      currentResults[sectionName]!.docs.sort((a, b) => b.similarity - a.similarity);

      return currentResults;
    });
  };

  const clearResults = () => {
    setResults({});
    setIsFinished(false);
  };

  return (
    <SectionResultContext.Provider
      value={{
        results,
        isFinished,
        setIsFinished,
        hasResults,
        updateAnswer,
        updateDoc,
        clearResults
      }}
    >
      {children}
    </SectionResultContext.Provider>
  );
}
