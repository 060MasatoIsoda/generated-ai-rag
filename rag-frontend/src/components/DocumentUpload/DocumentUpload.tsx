import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import PageLayout from "../common/Layout";
import {
  Typography,
  SelectChangeEvent,
  Grid,
  Paper,
  Container,
  Box,
  CardContent,
} from "@mui/material";
import {
  fetchMasterData,
  getPresignedUrl,
  uploadFileToS3,
} from "../../services/api";
import { Section } from "../../types/CategoryManagement";
import { UploadFile, DocumentUploadFormData } from "../../types/DocumentUpload";
import { MasterDataItem } from "../../types/CategoryManagement";
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Storage as DatabaseIcon,
  FolderOpen as FolderIcon,
} from "@mui/icons-material";
// Components
import SectionSelector from "./SectionSelector";
import CategorySelector from "./CategorySelector";
import FileUploadArea from "./FileUploadArea";
import FileList from "./FileList";
import UploadButton from "./UploadButton";
import NotificationSnackbar from "./NotificationSnackbar";

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
        const convertedSections = response.results.map(
          (item: MasterDataItem) => ({
            id: item.id,
            sectionName: item.sectionName,
            categories: item.categories.map(
              (category: string, index: number) => ({
                id: `${item.id}-${index}`,
                categoryName: category,
              })
            ),
          })
        );
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
    const selectedSection =
      sections.find((section) => section.id === sectionId) || null;

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
    const selectedCategory =
      formData.selectedSection.categories.find(
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
      invalidFiles.forEach((file) => {
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
  const updateFileProgress = useCallback(
    (
      index: number,
      progress: number,
      status: UploadFile["status"],
      error?: string
    ) => {
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
    },
    []
  );

  // ファイルアップロード処理
  const uploadFile = async (file: UploadFile, index: number) => {
    if (!formData.selectedSection || !formData.selectedCategory) {
      return {
        success: false,
        error: "セクションとカテゴリを選択してください",
      };
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
      await uploadFileToS3(presignedData.uploadUrl, file.file, (progress) =>
        updateFileProgress(index, progress, "uploading")
      );

      // アップロード完了
      updateFileProgress(index, 100, "success");
      return { success: true, fileKey: presignedData.fileKey };
    } catch (error) {
      console.error(
        `ファイル「${file.name}」のアップロードに失敗しました:`,
        error
      );
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
      files:
        formData.files.length === 0 ||
        formData.files.every((f) => f.status === "error"),
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
        message:
          successCount === pendingFiles.length
            ? t.DOCUMENT_UPLOAD.UPLOAD_SUCCESS
            : t.DOCUMENT_UPLOAD.UPLOAD_PARTIAL_SUCCESS.replace(
                "{success}",
                successCount.toString()
              ).replace("{total}", pendingFiles.length.toString()),
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

  return (
    <PageLayout title={t.DOCUMENT_UPLOAD.TITLE}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper
          elevation={3}
          sx={{ p: 3, mx: "auto", mb: 4, maxWidth: "800px", borderRadius: 2 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <DatabaseIcon color="primary" />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom={false}
              fontWeight="bold"
            >
              {t.DOCUMENT_UPLOAD.TITLE}
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            {t.DOCUMENT_UPLOAD.DESCRIPTION}
          </Typography>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* セクション選択 */}
              <Grid size={6}>
                <SectionSelector
                  sections={sections}
                  selectedSectionId={formData.selectedSection?.id || ""}
                  onChange={handleSectionChange}
                  error={errors.section}
                  disabled={loading}
                  labels={{
                    section: t.DOCUMENT_UPLOAD.SECTION,
                    selectSection: t.DOCUMENT_UPLOAD.SELECT_SECTION,
                  }}
                />
              </Grid>

              {/* カテゴリ選択 */}
              <Grid size={6}>
                <CategorySelector
                  categories={formData.selectedSection?.categories || []}
                  selectedCategoryId={formData.selectedCategory?.id || ""}
                  onChange={handleCategoryChange}
                  error={errors.category}
                  disabled={!formData.selectedSection || loading}
                  labels={{
                    category: t.DOCUMENT_UPLOAD.CATEGORY,
                    selectCategory: t.DOCUMENT_UPLOAD.SELECT_CATEGORY,
                  }}
                />
              </Grid>

              {/* ファイルアップロード */}
              <Grid size={12}>
                <FileUploadArea
                  onFileChange={handleFileChange}
                  disabled={loading}
                  hasError={errors.files}
                  labels={{
                    selectFiles: t.DOCUMENT_UPLOAD.SELECT_FILES,
                    supportedFormats: t.DOCUMENT_UPLOAD.SUPPORTED_FORMATS,
                    noFilesSelected: t.DOCUMENT_UPLOAD.NO_FILES_SELECTED,
                  }}
                />

                {/* ファイルリスト */}
                  <FileList
                    files={formData.files}
                    onRemoveFile={handleRemoveFile}
                    loading={loading}
                    noFilesMessage={t.DOCUMENT_UPLOAD.NO_FILES_SELECTED}
                  />

                {/* アップロードボタン */}
                  <UploadButton
                    onClick={handleUpload}
                    loading={loading}
                    disabled={formData.files.length === 0}
                    labels={{
                      uploading: t.DOCUMENT_UPLOAD.UPLOADING,
                      upload: t.DOCUMENT_UPLOAD.UPLOAD,
                    }}
                  />
              </Grid>
            </Grid>
          </CardContent>
        </Paper>

        {/* スナックバー通知 */}
        <NotificationSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        />
      </Container>
    </PageLayout>
  );
};

export default DocumentUpload;
