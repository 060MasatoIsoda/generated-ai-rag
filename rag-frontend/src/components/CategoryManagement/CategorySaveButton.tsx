import React from 'react';
import { Button, CircularProgress } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useLanguage } from "../../contexts/LanguageContext";

interface CategorySaveButtonProps {
  isSaving: boolean;
  onClick: () => void;
}

const CategorySaveButton: React.FC<CategorySaveButtonProps> = ({
  isSaving,
  onClick,
}) => {
  const { t } = useLanguage();

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={isSaving ? null : <SaveIcon />}
      onClick={onClick}
      disabled={isSaving}
      sx={{ mr: 1 }}
    >
      {isSaving ? (
        <>
          <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
          {t.CATEGORY_MANAGEMENT.SAVING}
        </>
      ) : (
        t.CATEGORY_MANAGEMENT.SAVE_CHANGES
      )}
    </Button>
  );
};

export default CategorySaveButton;
