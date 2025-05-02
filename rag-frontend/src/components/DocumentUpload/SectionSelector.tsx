import { FormControl, Select, MenuItem, FormHelperText } from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import { Section } from "../../types/CategoryManagement";

interface SectionSelectorProps {
  sections: Section[];
  selectedSectionId: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  error: boolean;
  disabled: boolean;
  labels: {
    section: string;
    selectSection: string;
  };
}

const SectionSelector = ({
  sections,
  selectedSectionId,
  onChange,
  error,
  disabled,
  labels,
}: SectionSelectorProps) => {
  return (
    <FormControl fullWidth error={error}>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{labels.section}</label>
      <Select
        labelId="section-select-label"
        id="section-select"
        value={selectedSectionId}
        label={labels.section}
        onChange={onChange}
        disabled={disabled}
        displayEmpty
      >
        <MenuItem value="" disabled>
          {labels.selectSection}
        </MenuItem>
        {sections.map((section) => (
          <MenuItem key={section.id} value={section.id}>
            {section.sectionName}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{labels.selectSection}</FormHelperText>}
    </FormControl>
  );
};

export default SectionSelector;
