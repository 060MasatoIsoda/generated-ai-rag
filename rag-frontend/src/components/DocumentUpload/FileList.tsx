import { Box, Typography, List, Paper } from "@mui/material";
import { UploadFile } from "../../types/DocumentUpload";
import FileListItem from "./FileListItem";

interface FileListProps {
  files: UploadFile[];
  onRemoveFile: (index: number) => void;
  loading: boolean;
  noFilesMessage: string;
}

const FileList = ({ files, onRemoveFile, loading, noFilesMessage }: FileListProps) => {
  if (files.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {noFilesMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {files.map((file, index) => (
        <FileListItem
          key={`${file.name}-${index}`}
          file={file}
          index={index}
          onRemove={onRemoveFile}
          disabled={loading}
        />
      ))}
    </List>
  );
};

const FileListContainer = (props: FileListProps) => {
  return (
    <Paper variant="outlined" sx={{ maxHeight: "300px", overflow: "auto" }}>
      <FileList {...props} />
    </Paper>
  );
};

export default FileListContainer;
