import { Button, CircularProgress } from "@mui/material";

interface UploadButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  labels: {
    uploading: string;
    upload: string;
  };
}

const UploadButton = ({
  onClick,
  loading,
  disabled,
  labels,
}: UploadButtonProps) => {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      startIcon={loading ? <CircularProgress size={20} /> : undefined}
      disabled={disabled || loading}
      sx={{ mt: 2 }}
    >
      {loading ? labels.uploading : labels.upload}
    </Button>
  );
};

export default UploadButton;
