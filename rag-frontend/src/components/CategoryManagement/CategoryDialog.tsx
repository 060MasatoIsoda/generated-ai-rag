import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CategoryIcon from "@mui/icons-material/Category";
import { useLanguage } from "../../contexts/LanguageContext";

interface CategoryDialogProps {
  open: boolean;
  isEditMode: boolean;
  categoryName: string;
  categoryError: boolean;
  onClose: () => void;
  onChangeCategoryName: (name: string) => void;
  onSubmit: () => void;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  isEditMode,
  categoryName,
  categoryError,
  onClose,
  onChangeCategoryName,
  onSubmit,
}) => {
  const { t } = useLanguage();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        elevation: 8,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ bgcolor: "secondary.light", color: "secondary.contrastText" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <CategoryIcon sx={{ mr: 1 }} />
          {isEditMode
            ? t.CATEGORY_MANAGEMENT.EDIT_CATEGORY
            : t.CATEGORY_MANAGEMENT.ADD_CATEGORY}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <TextField
          autoFocus
          margin="dense"
          label={t.CATEGORY_MANAGEMENT.CATEGORY_NAME}
          fullWidth
          value={categoryName}
          onChange={(e) => onChangeCategoryName(e.target.value)}
          error={categoryError}
          helperText={
            categoryError ? t.CATEGORY_MANAGEMENT.CATEGORY_REQUIRED : ""
          }
          variant="outlined"
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
        >
          {t.CATEGORY_MANAGEMENT.CANCEL}
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="secondary"
          startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
        >
          {isEditMode ? t.CATEGORY_MANAGEMENT.SAVE : t.CATEGORY_MANAGEMENT.ADD_CATEGORY}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDialog;
