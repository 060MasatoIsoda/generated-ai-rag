import { Box, Button, Typography } from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";

interface FileUploadAreaProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  hasError: boolean;
  labels: {
    selectFiles: string;
    supportedFormats: string;
    noFilesSelected: string;
  };
}

const FileUploadArea = ({
  onFileChange,
  disabled,
  hasError,
  labels,
}: FileUploadAreaProps) => {
  return (
    <Box
      sx={{
        border: "1px dashed",
        borderColor: hasError ? "error.main" : "divider",
        borderRadius: 1,
        p: 3,
        textAlign: "center",
      }}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        onChange={onFileChange}
        style={{ display: "none" }}
        disabled={disabled}
      />
      <label htmlFor="file-upload">
        <Button
          component="span"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          disabled={disabled}
        >
          {labels.selectFiles}
        </Button>
      </label>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {labels.supportedFormats}
      </Typography>
      {hasError && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {labels.noFilesSelected}
        </Typography>
      )}
    </Box>
  );
};

export default FileUploadArea;
