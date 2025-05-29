import { useContext } from "react";
import { SectionResultContext } from "../SectionResult/SectionResultContext";

export function useSectionResult() {
  const context = useContext(SectionResultContext);
  if (context === undefined) {
    throw new Error(
      "useSectionResult must be used within a SectionResultProvider"
    );
  }
  return context;
}
