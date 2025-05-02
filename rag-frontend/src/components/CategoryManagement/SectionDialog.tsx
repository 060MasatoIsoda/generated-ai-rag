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
import FolderIcon from "@mui/icons-material/Folder";
import { useLanguage } from "../../contexts/LanguageContext";

interface SectionDialogProps {
  open: boolean;
  isEditMode: boolean;
  sectionName: string;
  sectionError: boolean;
  onClose: () => void;
  onChangeSectionName: (name: string) => void;
  onSubmit: () => void;
}

const SectionDialog: React.FC<SectionDialogProps> = ({
  open,
  isEditMode,
  sectionName,
  sectionError,
  onClose,
  onChangeSectionName,
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
      <DialogTitle sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FolderIcon sx={{ mr: 1 }} />
          {isEditMode
            ? t.CATEGORY_MANAGEMENT.EDIT_SECTION
            : t.CATEGORY_MANAGEMENT.ADD_SECTION}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <TextField
          autoFocus
          margin="dense"
          label={t.CATEGORY_MANAGEMENT.SECTION_NAME}
          fullWidth
          value={sectionName}
          onChange={(e) => onChangeSectionName(e.target.value)}
          error={sectionError}
          helperText={
            sectionError ? t.CATEGORY_MANAGEMENT.SECTION_REQUIRED : ""
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
          startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
        >
          {isEditMode ? t.CATEGORY_MANAGEMENT.SAVE : t.CATEGORY_MANAGEMENT.ADD_SECTION}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionDialog;
