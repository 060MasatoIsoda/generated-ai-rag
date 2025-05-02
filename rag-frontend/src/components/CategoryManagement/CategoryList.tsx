import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Card,
  CardContent,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";
import { Section, Category } from "../../types/CategoryManagement";
import { useLanguage } from "../../contexts/LanguageContext";

interface CategoryListProps {
  selectedSection: Section | null;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  selectedSection,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const { t } = useLanguage();

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        display: "flex",
        flexDirection: "column",
        width: "15vw",
      }}
    >
      <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            bgcolor: "secondary.light",
            color: "secondary.contrastText",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CategoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {selectedSection
                ? `${t.CATEGORY_MANAGEMENT.CATEGORIES} - ${selectedSection.sectionName}`
                : t.CATEGORY_MANAGEMENT.CATEGORIES}
            </Typography>
          </Box>
          <Tooltip
            title={
              !selectedSection
                ? t.CATEGORY_MANAGEMENT.SELECT_SECTION
                : t.CATEGORY_MANAGEMENT.ADD_CATEGORY
            }
          >
            <span>
              <IconButton
                color="inherit"
                onClick={onAddCategory}
                disabled={!selectedSection}
                size="small"
                sx={{
                  bgcolor: "secondary.main",
                  "&:hover": { bgcolor: "secondary.dark" },
                  "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
                }}
              >
                <AddIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Divider />

        <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: '60vh' }}>
          {selectedSection ? (
            <List sx={{ p: 0 }}>
              {selectedSection.categories.length > 0 ? (
                selectedSection.categories.map((category) => (
                  <Box key={category.id}>
                    <ListItem
                      sx={{
                        py: 2,
                        "&:hover": {
                          bgcolor: (theme) =>
                            alpha(theme.palette.secondary.main, 0.05),
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography>{category.categoryName}</Typography>
                        }
                      />
                      <Box>
                        <Tooltip title={t.CATEGORY_MANAGEMENT.EDIT_CATEGORY}>
                          <IconButton
                            size="small"
                            onClick={() => onEditCategory(category)}
                            sx={{ color: "secondary.main", mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.CATEGORY_MANAGEMENT.DELETE_CATEGORY}>
                          <IconButton
                            size="small"
                            onClick={() => onDeleteCategory(category)}
                            sx={{ color: "error.main" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    <Divider />
                  </Box>
                ))
              ) : (
                <Box
                  sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "300px",
                    color: "text.secondary",
                  }}
                >
                  <CategoryIcon
                    sx={{ fontSize: 60, opacity: 0.3, mb: 2 }}
                  />
                  <Typography align="center">
                    {t.CATEGORY_MANAGEMENT.NO_CATEGORIES}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={onAddCategory}
                    sx={{ mt: 2 }}
                  >
                    {t.CATEGORY_MANAGEMENT.ADD_CATEGORY}
                  </Button>
                </Box>
              )}
            </List>
          ) : (
            <Box
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "300px",
                color: "text.secondary",
              }}
            >
              <CategoryIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
              <Typography align="center">
                {t.CATEGORY_MANAGEMENT.SELECT_SECTION}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryList;
