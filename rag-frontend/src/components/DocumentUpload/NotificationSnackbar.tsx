import { Snackbar, Alert } from "@mui/material";

interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
  onClose: () => void;
  autoHideDuration?: number;
}

const NotificationSnackbar = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
}: NotificationSnackbarProps) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
