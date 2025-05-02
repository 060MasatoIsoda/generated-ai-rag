import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLanguage } from "../../contexts/LanguageContext";

interface DeleteConfirmDialogProps {
  open: boolean;
  deleteType: 'section' | 'category';
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  deleteType,
  onClose,
  onConfirm,
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
      <DialogTitle sx={{ bgcolor: "error.light", color: "error.contrastText" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <DeleteIcon sx={{ mr: 1 }} />
          {deleteType === "section"
            ? t.CATEGORY_MANAGEMENT.DELETE_SECTION
            : t.CATEGORY_MANAGEMENT.DELETE_CATEGORY}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <DialogContentText>
          {deleteType === "section"
            ? t.CATEGORY_MANAGEMENT.CONFIRM_DELETE_SECTION
            : t.CATEGORY_MANAGEMENT.CONFIRM_DELETE_CATEGORY}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
        >
          {t.CATEGORY_MANAGEMENT.CANCEL}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
        >
          {t.CATEGORY_MANAGEMENT.DELETE}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
