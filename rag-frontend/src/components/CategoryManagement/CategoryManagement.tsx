import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import PageLayout from "../common/Layout";
import { Box, Grid, Snackbar, Alert } from "@mui/material";
import { fetchMasterData, saveCategories } from "../../services/api";
import {
  MasterDataItem,
  Section,
  Category,
  SavePayload,
  MasterDataResponse,
} from "../../types/CategoryManagement";

import SectionList from "./SectionList";
import CategoryList from "./CategoryList";
import SectionDialog from "./SectionDialog";
import CategoryDialog from "./CategoryDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import CategorySaveButton from "./CategorySaveButton";

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
  const [deleteType, setDeleteType] = useState<"section" | "category">("section");
  const [isSaving, setIsSaving] = useState(false);

  const responseToSections = (response: MasterDataResponse) => {
    const convertedSections = response.results.map(convertToSection);
    setSections(convertedSections);
    if (convertedSections.length > 0) {
      setSelectedSection(convertedSections[0]);
    }
  };

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

  // データ取得
  useEffect(() => {
    // APIからデータを取得する処理
    const fetchData = async () => {
      try {
        const response = await fetchMasterData();
        // MasterDataItemからSectionに変換
        responseToSections(response);
      } catch (error) {
        console.error("マスターデータの取得に失敗しました:", error);
        // エラー時はダミーデータを使用
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

  const handleChangeSectionName = (name: string) => {
    setSectionName(name);
    setSectionError(false);
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
        id: Date.now().toString(),
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

  const handleChangeCategoryName = (name: string) => {
    setCategoryName(name);
    setCategoryError(false);
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
              ? { ...category, categoryName: categoryName }
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
            ? { ...category, categoryName: categoryName }
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
      const savePayload: SavePayload = {
        sections: sections,
      };
      const response = await saveCategories(savePayload);
      responseToSections(response);
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
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <CategorySaveButton
            isSaving={isSaving}
            onClick={saveChangesToAPI}
          />
        </Box>

        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* セクション一覧 */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <SectionList
              sections={sections}
              selectedSection={selectedSection}
              onSelectSection={handleSelectSection}
              onAddSection={() => handleOpenSectionDialog()}
              onEditSection={(section) => handleOpenSectionDialog(true, section)}
              onDeleteSection={(section) => handleOpenDeleteDialog("section", section)}
            />
          </Grid>

          {/* カテゴリ一覧 */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <CategoryList
              selectedSection={selectedSection}
              onAddCategory={() => handleOpenCategoryDialog()}
              onEditCategory={(category) => handleOpenCategoryDialog(true, category)}
              onDeleteCategory={(category) => handleOpenDeleteDialog("category", category)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* セクション追加/編集ダイアログ */}
      <SectionDialog
        open={openSectionDialog}
        isEditMode={isEditMode}
        sectionName={sectionName}
        sectionError={sectionError}
        onClose={handleCloseSectionDialog}
        onChangeSectionName={handleChangeSectionName}
        onSubmit={handleSubmitSection}
      />

      {/* カテゴリ追加/編集ダイアログ */}
      <CategoryDialog
        open={openCategoryDialog}
        isEditMode={isEditMode}
        categoryName={categoryName}
        categoryError={categoryError}
        onClose={handleCloseCategoryDialog}
        onChangeCategoryName={handleChangeCategoryName}
        onSubmit={handleSubmitCategory}
      />

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        deleteType={deleteType}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDelete}
      />

      {/* 通知スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default CategoryManagement;
