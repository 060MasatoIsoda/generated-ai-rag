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
  Chip,
  Card,
  CardContent,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import { Section } from "../../types/CategoryManagement";
import { useLanguage } from "../../contexts/LanguageContext";

interface SectionListProps {
  sections: Section[];
  selectedSection: Section | null;
  onSelectSection: (section: Section) => void;
  onAddSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
}

const SectionList: React.FC<SectionListProps> = ({
  sections,
  selectedSection,
  onSelectSection,
  onAddSection,
  onEditSection,
  onDeleteSection,
}) => {
  const { t } = useLanguage();

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        display: "flex",
        width: "15vw",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            bgcolor: "primary.light",
            color: "primary.contrastText",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FolderIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {t.CATEGORY_MANAGEMENT.SECTIONS}
            </Typography>
          </Box>
          <Tooltip title={t.CATEGORY_MANAGEMENT.ADD_SECTION}>
            <IconButton
              color="inherit"
              onClick={onAddSection}
              size="small"
              sx={{
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider />

        <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: '60vh' }}>
          <List sx={{ p: 0 }}>
            {sections.length > 0 ? (
              sections.map((section) => (
                <Box key={section.id}>
                  <ListItem
                    onClick={() => onSelectSection(section)}
                    sx={{
                      py: 2,
                      bgcolor: selectedSection && selectedSection.id === section.id
                        ? (theme) => alpha(theme.palette.primary.main, 0.1)
                        : 'transparent',
                      borderLeft: selectedSection && selectedSection.id === section.id
                        ? "4px solid" : "4px solid transparent",
                      borderColor: selectedSection && selectedSection.id === section.id
                        ? "primary.main" : "transparent",
                      "&:hover": {
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.05),
                        cursor: 'pointer'
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontWeight:
                              selectedSection &&
                              selectedSection.id === section.id
                                ? "bold"
                                : "normal",
                          }}
                        >
                          {section.sectionName}
                        </Typography>
                      }
                      secondary={
                        <Chip
                          size="small"
                          label={`${section.categories.length} カテゴリ`}
                          sx={{ mt: 0.5 }}
                        />
                      }
                    />
                    <Box>
                      <Tooltip title={t.CATEGORY_MANAGEMENT.EDIT_SECTION}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSection(section);
                          }}
                          sx={{ color: "primary.main", mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.CATEGORY_MANAGEMENT.DELETE_SECTION}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSection(section);
                          }}
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
                <FolderIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
                <Typography align="center">
                  セクションがありません
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={onAddSection}
                  sx={{ mt: 2 }}
                >
                  {t.CATEGORY_MANAGEMENT.ADD_SECTION}
                </Button>
              </Box>
            )}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SectionList;
