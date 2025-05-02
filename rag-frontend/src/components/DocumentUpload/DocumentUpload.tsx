import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import PageLayout from "../common/Layout";
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Snackbar,
  FormHelperText,
  LinearProgress,
  SelectChangeEvent,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { fetchMasterData, getPresignedUrl, uploadFileToS3 } from "../../services/api";
import { Section } from "../../types/CategoryManagement";
import { UploadFile, DocumentUploadFormData } from "../../types/DocumentUpload";
import Grid from '@mui/material/Grid';
import { MasterDataItem } from "../../types/CategoryManagement";

// 許可されるファイル拡張子
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/plain", // txt
];

const DocumentUpload = () => {
  const { t } = useLanguage();

  // ステート
  const [sections, setSections] = useState<Section[]>([]);
  const [formData, setFormData] = useState<DocumentUploadFormData>({
    selectedSection: null,
    selectedCategory: null,
    files: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    section: false,
    category: false,
    files: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // セクションとカテゴリのデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchMasterData();
        const convertedSections = response.results.map((item: MasterDataItem) => ({
          id: item.id,
          sectionName: item.sectionName,
          categories: item.categories.map((category: string, index: number) => ({
            id: `${item.id}-${index}`,
            categoryName: category,
          })),
        }));
        setSections(convertedSections);
        setLoading(false);
      } catch (error) {
        console.error("マスターデータの取得に失敗しました:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // セクション選択ハンドラ
  const handleSectionChange = (event: SelectChangeEvent<string>) => {
    const sectionId = event.target.value;
    const selectedSection = sections.find((section) => section.id === sectionId) || null;

    setFormData({
      ...formData,
      selectedSection,
      selectedCategory: null, // セクションが変更されたらカテゴリをリセット
    });

    setErrors({
      ...errors,
      section: false,
    });
  };

  // カテゴリ選択ハンドラ
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    if (!formData.selectedSection) return;

    const categoryId = event.target.value;
    const selectedCategory = formData.selectedSection.categories.find(
      (category) => category.id === categoryId
    ) || null;

    setFormData({
      ...formData,
      selectedCategory,
    });

    setErrors({
      ...errors,
      category: false,
    });
  };

  // ファイル選択ハンドラ
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const newFiles: UploadFile[] = Array.from(fileList).map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: "pending",
    }));

    // ファイルタイプのバリデーション
    const invalidFiles = newFiles.filter(
      (file) => !ALLOWED_FILE_TYPES.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setSnackbar({
        open: true,
        message: t.DOCUMENT_UPLOAD.INVALID_FILE_FORMAT,
        severity: "error",
      });

      // 無効なファイルにエラーステータスを設定
      invalidFiles.forEach(file => {
        file.status = "error";
        file.error = t.DOCUMENT_UPLOAD.INVALID_FILE_FORMAT;
      });
    }

    setFormData({
      ...formData,
      files: [...formData.files, ...newFiles],
    });

    setErrors({
      ...errors,
      files: false,
    });

    // ファイル選択後にinput要素をリセット
    event.target.value = "";
  };

  // ファイル削除ハンドラ
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...formData.files];
    updatedFiles.splice(index, 1);

    setFormData({
      ...formData,
      files: updatedFiles,
    });
  };

  // 進捗更新ハンドラ
  const updateFileProgress = useCallback((index: number, progress: number, status: UploadFile['status'], error?: string) => {
    setFormData((prevData) => {
      const updatedFiles = [...prevData.files];
      updatedFiles[index] = {
        ...updatedFiles[index],
        progress,
        status,
        error,
      };
      return {
        ...prevData,
        files: updatedFiles,
      };
    });
  }, []);

  // ファイルアップロード処理
  const uploadFile = async (file: UploadFile, index: number) => {
    if (!formData.selectedSection || !formData.selectedCategory) {
      return { success: false, error: "セクションとカテゴリを選択してください" };
    }

    try {
      updateFileProgress(index, 0, "uploading");

      // プリサインドURLを取得
      const presignedData = await getPresignedUrl(
        file.name,
        file.type,
        formData.selectedSection.sectionName,
        formData.selectedCategory.categoryName
      );

      // S3へのアップロード
      await uploadFileToS3(
        presignedData.uploadUrl,
        file.file,
        (progress) => updateFileProgress(index, progress, "uploading")
      );

      // アップロード完了
      updateFileProgress(index, 100, "success");
      return { success: true, fileKey: presignedData.fileKey };
    } catch (error) {
      console.error(`ファイル「${file.name}」のアップロードに失敗しました:`, error);
      updateFileProgress(index, 0, "error", t.DOCUMENT_UPLOAD.UPLOAD_ERROR);
      return { success: false, error };
    }
  };

  // 一括アップロード処理
  const handleUpload = async () => {
    // バリデーション
    const newErrors = {
      section: !formData.selectedSection,
      category: !formData.selectedCategory,
      files: formData.files.length === 0 || formData.files.every(f => f.status === "error"),
    };

    setErrors(newErrors);

    if (newErrors.section || newErrors.category || newErrors.files) {
      setSnackbar({
        open: true,
        message: t.DOCUMENT_UPLOAD.REQUIRED_FIELDS,
        severity: "error",
      });
      return;
    }

    // アップロード対象のファイル（pendingかerrorのみ）
    const pendingFiles = formData.files.filter(
      (file) => file.status === "pending" || file.status === "error"
    );

    if (pendingFiles.length === 0) {
      setSnackbar({
        open: true,
        message: t.DOCUMENT_UPLOAD.NO_FILES_TO_UPLOAD,
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);

      // 順次アップロード
      const results = await Promise.all(
        pendingFiles.map((file) => {
          const originalIndex = formData.files.findIndex(
            (f) => f.name === file.name && f.size === file.size
          );
          return uploadFile(file, originalIndex);
        })
      );

      const successCount = results.filter((r) => r.success).length;

      setSnackbar({
        open: true,
        message: successCount === pendingFiles.length
          ? t.DOCUMENT_UPLOAD.UPLOAD_SUCCESS
          : t.DOCUMENT_UPLOAD.UPLOAD_PARTIAL_SUCCESS.replace('{success}', successCount.toString()).replace('{total}', pendingFiles.length.toString()),
        severity: successCount === pendingFiles.length ? "success" : "error",
      });

      setLoading(false);
    } catch (error) {
      console.error("アップロード処理に失敗しました:", error);
      setSnackbar({
        open: true,
        message: t.DOCUMENT_UPLOAD.UPLOAD_ERROR,
        severity: "error",
      });
      setLoading(false);
    }
  };

  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // ファイルリストの表示
  const renderFileList = () => {
    if (formData.files.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {t.DOCUMENT_UPLOAD.NO_FILES_SELECTED}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {formData.files.map((file, index) => (
          <ListItem key={`${file.name}-${index}`} secondaryAction={
            file.status !== "uploading" && (
              <IconButton
                edge="end"
                onClick={() => handleRemoveFile(index)}
                disabled={loading}
              >
                <DeleteIcon />
              </IconButton>
            )
          }>
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
        ))}
      </List>
    );
  };

  return (
    <PageLayout title={t.DOCUMENT_UPLOAD.TITLE}>
      <Typography variant="h4" gutterBottom>
        {t.DOCUMENT_UPLOAD.TITLE}
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {/* セクション選択 */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <FormControl fullWidth error={errors.section}>
              <InputLabel id="section-select-label">{t.DOCUMENT_UPLOAD.SECTION}</InputLabel>
              <Select
                labelId="section-select-label"
                id="section-select"
                value={formData.selectedSection?.id || ""}
                label={t.DOCUMENT_UPLOAD.SECTION}
                onChange={handleSectionChange}
                disabled={loading}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  {t.DOCUMENT_UPLOAD.SELECT_SECTION}
                </MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.sectionName}
                  </MenuItem>
                ))}
              </Select>
              {errors.section && (
                <FormHelperText>{t.DOCUMENT_UPLOAD.SELECT_SECTION}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* カテゴリ選択 */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <FormControl
              fullWidth
              disabled={!formData.selectedSection || loading}
              error={errors.category}
            >
              <InputLabel id="category-select-label">{t.DOCUMENT_UPLOAD.CATEGORY}</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={formData.selectedCategory?.id || ""}
                label={t.DOCUMENT_UPLOAD.CATEGORY}
                onChange={handleCategoryChange}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  {t.DOCUMENT_UPLOAD.SELECT_CATEGORY}
                </MenuItem>
                {formData.selectedSection?.categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.categoryName}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && (
                <FormHelperText>{t.DOCUMENT_UPLOAD.SELECT_CATEGORY}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* ファイルアップロード */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Box
              sx={{
                border: "1px dashed",
                borderColor: errors.files ? "error.main" : "divider",
                borderRadius: 1,
                p: 3,
                textAlign: "center",
              }}
            >
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={loading}
              />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  disabled={loading}
                >
                  {t.DOCUMENT_UPLOAD.SELECT_FILES}
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t.DOCUMENT_UPLOAD.SUPPORTED_FORMATS}
              </Typography>
              {errors.files && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {t.DOCUMENT_UPLOAD.NO_FILES_SELECTED}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* ファイルリスト */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Paper
              variant="outlined"
              sx={{ maxHeight: "300px", overflow: "auto" }}
            >
              {renderFileList()}
            </Paper>
          </Grid>

          {/* アップロードボタン */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
              disabled={loading || formData.files.length === 0}
              sx={{ mt: 2 }}
            >
              {loading ? t.DOCUMENT_UPLOAD.UPLOADING : t.DOCUMENT_UPLOAD.UPLOAD}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* スナックバー通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default DocumentUpload;
