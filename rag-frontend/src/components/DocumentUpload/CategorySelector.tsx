import { FormControl, Select, MenuItem, FormHelperText } from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import { Category } from "../../types/CategoryManagement";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  error: boolean;
  disabled: boolean;
  labels: {
    category: string;
    selectCategory: string;
  };
}

const CategorySelector = ({
  categories,
  selectedCategoryId,
  onChange,
  error,
  disabled,
  labels,
}: CategorySelectorProps) => {
  return (
    <FormControl fullWidth disabled={disabled} error={error}>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{labels.category}</label>
      <Select
        id="category-select"
        value={selectedCategoryId}
        onChange={onChange}
        displayEmpty
      >
        <MenuItem value="" disabled>
          {labels.selectCategory}
        </MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.categoryName}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{labels.selectCategory}</FormHelperText>}
    </FormControl>
  );
};

export default CategorySelector;
