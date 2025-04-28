import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import PageLayout from "../common/Layout";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchMasterData, saveCategories } from "../../services/api";
import { MasterDataItem, Section, Category } from "../../types/CategoryManagement";

// MasterDataItemからSectionへの変換関数
const convertToSection = (item: MasterDataItem): Section => {
  return {
    id: item.id,
    sectionName: item.sectionName,
    categories: item.categories.map((category, index) => ({
      id: `${item.sectionName}-${index}`,
      categoryName: category,
    })),
  };
};

const CategoryManagement = () => {
  const { t } = useLanguage();

  // ステート
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [sectionError, setSectionError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [deleteType, setDeleteType] = useState<"section" | "category">(
    "section"
  );
  const [isSaving, setIsSaving] = useState(false);

  // データ取得
  useEffect(() => {
    // APIからデータを取得する処理
    const fetchData = async () => {
      try {
        const response = await fetchMasterData();
        // MasterDataItemからSectionに変換
        const convertedSections = response.results.map(convertToSection);
        setSections(convertedSections);
        if (convertedSections.length > 0) {
          setSelectedSection(convertedSections[0]);
        }
      } catch (error) {
        console.error("マスターデータの取得に失敗しました:", error);
        // エラー時はダミーデータを使用
        const dummyData: Section[] = [
          {
            id: "1",
            sectionName: "人事部",
            categories: [
              { id: "1-1", categoryName: "給与" },
              { id: "1-2", categoryName: "採用" },
            ],
          },
          {
            id: "2",
            sectionName: "営業部",
            categories: [
              { id: "2-1", categoryName: "顧客対応" },
              { id: "2-2", categoryName: "販売実績" },
            ],
          },
        ];
        setSections(dummyData);
        if (dummyData.length > 0) {
          setSelectedSection(dummyData[0]);
        }
      }
    };
    fetchData();
  }, []);

  // セクション選択
  const handleSelectSection = (section: Section) => {
    setSelectedSection(section);
  };

  // セクションダイアログ関連
  const handleOpenSectionDialog = (
    editMode = false,
    section: Section | null = null
  ) => {
    setIsEditMode(editMode);
    setCurrentSection(section);
    setSectionName(section ? section.sectionName : "");
    setSectionError(false);
    setOpenSectionDialog(true);
  };

  const handleCloseSectionDialog = () => {
    setOpenSectionDialog(false);
    setSectionName("");
  };

  const handleSubmitSection = () => {
    if (!sectionName.trim()) {
      setSectionError(true);
      return;
    }

    if (isEditMode && currentSection) {
      // セクション編集
      const updatedSections = sections.map((section) =>
        section.id === currentSection.id
          ? { ...section, name: sectionName }
          : section
      );
      setSections(updatedSections);

      if (selectedSection && selectedSection.id === currentSection.id) {
        setSelectedSection({ ...selectedSection, sectionName: sectionName });
      }

      setSnackbar({
        open: true,
        message: t.CATEGORY_MANAGEMENT.SUCCESS_EDIT_SECTION,
        severity: "success",
      });
    } else {
      // 新規セクション追加
      const newSection: Section = {
        id: "",
        sectionName: sectionName,
        categories: [],
      };
      setSections([...sections, newSection]);
      setSnackbar({
        open: true,
        message: t.CATEGORY_MANAGEMENT.SUCCESS_ADD_SECTION,
        severity: "success",
      });
    }

    handleCloseSectionDialog();
  };

  // カテゴリダイアログ関連
  const handleOpenCategoryDialog = (
    editMode = false,
    category: Category | null = null
  ) => {
    if (!selectedSection) return;

    setIsEditMode(editMode);
    setCurrentCategory(category);
    setCategoryName(category ? category.categoryName : "");
    setCategoryError(false);
    setOpenCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setCategoryName("");
  };

  const handleSubmitCategory = () => {
    if (!categoryName.trim()) {
      setCategoryError(true);
      return;
    }

    if (!selectedSection) return;

    if (isEditMode && currentCategory) {
      // カテゴリ編集
      const updatedSections = sections.map((section) => {
        if (section.id === selectedSection.id) {
          const updatedCategories = section.categories.map((category) =>
            category.id === currentCategory.id
              ? { ...category, name: categoryName }
              : category
          );
          return { ...section, categories: updatedCategories };
        }
        return section;
      });

      setSections(updatedSections);
      setSelectedSection({
        ...selectedSection,
        categories: selectedSection.categories.map((category) =>
          category.id === currentCategory.id
            ? { ...category, name: categoryName }
            : category
        ),
      });

      setSnackbar({
        open: true,
        message: t.CATEGORY_MANAGEMENT.SUCCESS_EDIT_CATEGORY,
        severity: "success",
      });
    } else {
      // 新規カテゴリ追加
      const newCategory: Category = {
        id: Date.now().toString(),
        categoryName: categoryName,
      };

      const updatedSections = sections.map((section) => {
        if (section.id === selectedSection.id) {
          return {
            ...section,
            categories: [...section.categories, newCategory],
          };
        }
        return section;
      });

      setSections(updatedSections);
      setSelectedSection({
        ...selectedSection,
        categories: [...selectedSection.categories, newCategory],
      });

      setSnackbar({
        open: true,
        message: t.CATEGORY_MANAGEMENT.SUCCESS_ADD_CATEGORY,
        severity: "success",
      });
    }

    handleCloseCategoryDialog();
  };

  // 削除ダイアログ関連
  const handleOpenDeleteDialog = (
    type: "section" | "category",
    item: Section | Category
  ) => {
    setDeleteType(type);
    if (type === "section") {
      setCurrentSection(item as Section);
      setCurrentCategory(null);
    } else {
      setCurrentCategory(item as Category);
    }
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleDelete = () => {
    if (deleteType === "section" && currentSection) {
      // セクション削除
      const updatedSections = sections.filter(
        (section) => section.id !== currentSection.id
      );
      setSections(updatedSections);

      if (selectedSection && selectedSection.id === currentSection.id) {
        setSelectedSection(
          updatedSections.length > 0 ? updatedSections[0] : null
        );
      }

      setSnackbar({
        open: true,
        message: t.CATEGORY_MANAGEMENT.SUCCESS_DELETE_SECTION,
        severity: "success",
      });
    } else if (
      deleteType === "category" &&
      currentCategory &&
      selectedSection
    ) {
      // カテゴリ削除
      const updatedSections = sections.map((section) => {
        if (section.id === selectedSection.id) {
          return {
            ...section,
            categories: section.categories.filter(
              (category) => category.id !== currentCategory.id
            ),
          };
        }
        return section;
      });

      setSections(updatedSections);
      setSelectedSection({
        ...selectedSection,
        categories: selectedSection.categories.filter(
          (category) => category.id !== currentCategory.id
        ),
      });

      setSnackbar({
        open: true,
        message: t.CATEGORY_MANAGEMENT.SUCCESS_DELETE_CATEGORY,
        severity: "success",
      });
    }

    handleCloseDeleteDialog();
  };

  // スナックバー閉じる
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // APIで変更を保存する処理
  const saveChangesToAPI = async () => {
    setIsSaving(true);
    try {
      // ここで実際にAPIを呼び出す
      // 例: await api.saveCategories(sections, categories);
      await saveCategories(sections);

      // 成功時の処理
      setSnackbar({
        open: true,
        message: t.CATEGORY_MANAGEMENT.SUCCESS_SAVE_CHANGES,
        severity: "success",
      });
    } catch (error) {
      // エラー時の処理
      setSnackbar({
        open: true,
        message: t.CATEGORY_MANAGEMENT.ERROR_SAVE_CHANGES,
        severity: "error",
      });
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout title={t.CATEGORY_MANAGEMENT.TITLE}>
      {/* ここに保存ボタンを追加 */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={saveChangesToAPI}
          disabled={isSaving}
          sx={{ mt: 2, height: "40px" }}
        >
          {isSaving
            ? t.CATEGORY_MANAGEMENT.SAVING
            : t.CATEGORY_MANAGEMENT.SAVE_CHANGES}
        </Button>
      </Box>

      <Box sx={{ display: "flex", p: 3, mt: 8 }}>
        <Grid container spacing={3}>
          {/* セクション一覧 */}
          <Grid sx={{ gridColumn: "span 4" }}>
            <Paper sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", margin: "0 10px" }}
                >
                  {t.CATEGORY_MANAGEMENT.SECTIONS}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenSectionDialog()}
                >
                  {t.CATEGORY_MANAGEMENT.ADD_SECTION}
                </Button>
              </Box>

              <List>
                {sections.map((section) => (
                  <ListItem
                    key={section.id}
                    onClick={() => handleSelectSection(section)}
                  >
                    <ListItemText primary={section.sectionName} />
                    <Box>
                      <IconButton
                        edge="end"
                        onClick={() => handleOpenSectionDialog(true, section)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() =>
                          handleOpenDeleteDialog("section", section)
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* カテゴリ一覧 */}
          <Grid sx={{ gridColumn: "span 8" }}>
            <Paper sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", margin: "0 10px" }}
                >
                  {selectedSection
                    ? `${t.CATEGORY_MANAGEMENT.CATEGORIES} - ${selectedSection.sectionName}`
                    : t.CATEGORY_MANAGEMENT.CATEGORIES}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={!selectedSection}
                  onClick={() => handleOpenCategoryDialog()}
                >
                  {t.CATEGORY_MANAGEMENT.ADD_CATEGORY}
                </Button>
              </Box>

              {selectedSection ? (
                <List>
                  {selectedSection.categories.map((category) => (
                    <ListItem
                      key={category.id}
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleOpenCategoryDialog(true, category)
                            }
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleOpenDeleteDialog("category", category)
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText primary={category.categoryName} />
                    </ListItem>
                  ))}
                  {selectedSection.categories.length === 0 && (
                    <Typography sx={{ p: 2, color: "text.secondary" }}>
                      カテゴリがありません
                    </Typography>
                  )}
                </List>
              ) : (
                <Typography sx={{ p: 2, color: "text.secondary" }}>
                  セクションを選択してください
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* セクション追加/編集ダイアログ */}
      <Dialog
        open={openSectionDialog}
        onClose={handleCloseSectionDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditMode
            ? t.CATEGORY_MANAGEMENT.EDIT_SECTION
            : t.CATEGORY_MANAGEMENT.ADD_SECTION}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t.CATEGORY_MANAGEMENT.SECTION_NAME}
            fullWidth
            value={sectionName}
            onChange={(e) => {
              setSectionName(e.target.value);
              setSectionError(false);
            }}
            error={sectionError}
            helperText={
              sectionError ? t.CATEGORY_MANAGEMENT.SECTION_REQUIRED : ""
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSectionDialog}>
            {t.CATEGORY_MANAGEMENT.CANCEL}
          </Button>
          <Button onClick={handleSubmitSection}>
            {t.CATEGORY_MANAGEMENT.SAVE}
          </Button>
        </DialogActions>
      </Dialog>

      {/* カテゴリ追加/編集ダイアログ */}
      <Dialog
        open={openCategoryDialog}
        onClose={handleCloseCategoryDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditMode
            ? t.CATEGORY_MANAGEMENT.EDIT_CATEGORY
            : t.CATEGORY_MANAGEMENT.ADD_CATEGORY}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t.CATEGORY_MANAGEMENT.CATEGORY_NAME}
            fullWidth
            value={categoryName}
            onChange={(e) => {
              setCategoryName(e.target.value);
              setCategoryError(false);
            }}
            error={categoryError}
            helperText={
              categoryError ? t.CATEGORY_MANAGEMENT.CATEGORY_REQUIRED : ""
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>
            {t.CATEGORY_MANAGEMENT.CANCEL}
          </Button>
          <Button onClick={handleSubmitCategory}>
            {t.CATEGORY_MANAGEMENT.SAVE}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {deleteType === "section"
            ? t.CATEGORY_MANAGEMENT.DELETE_SECTION
            : t.CATEGORY_MANAGEMENT.DELETE_CATEGORY}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteType === "section"
              ? t.CATEGORY_MANAGEMENT.CONFIRM_DELETE_SECTION
              : t.CATEGORY_MANAGEMENT.CONFIRM_DELETE_CATEGORY}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            {t.CATEGORY_MANAGEMENT.CANCEL}
          </Button>
          <Button onClick={handleDelete} color="error">
            {t.CATEGORY_MANAGEMENT.DELETE}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default CategoryManagement;
