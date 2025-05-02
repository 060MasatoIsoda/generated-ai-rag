import {
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  LinearProgress,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { UploadFile } from "../../types/DocumentUpload";

interface FileListItemProps {
  file: UploadFile;
  index: number;
  onRemove: (index: number) => void;
  disabled: boolean;
}

const FileListItem = ({ file, index, onRemove, disabled }: FileListItemProps) => {
  return (
    <ListItem
      key={`${file.name}-${index}`}
      secondaryAction={
        file.status !== "uploading" && (
          <IconButton edge="end" onClick={() => onRemove(index)} disabled={disabled}>
            <DeleteIcon />
          </IconButton>
        )
      }
    >
      <ListItemIcon>
        {file.status === "success" ? (
          <CheckIcon color="success" />
        ) : file.status === "error" ? (
          <ErrorIcon color="error" />
        ) : (
          <DescriptionIcon />
        )}
      </ListItemIcon>
      <ListItemText
        primary={file.name}
        secondary={
          <>
            {file.error ? (
              <Typography variant="body2" color="error">
                {file.error}
              </Typography>
            ) : (
              `${(file.size / 1024).toFixed(2)} KB`
            )}
            {file.status === "uploading" && (
              <LinearProgress
                variant="determinate"
                value={file.progress}
                sx={{ mt: 1 }}
              />
            )}
          </>
        }
      />
    </ListItem>
  );
};

export default FileListItem;
