import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Box, Button, Container, Typography, Grid, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PageLayout from '../common/Layout';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNavigateToSearch = () => {
    navigate('/search');
  };

  const handleNavigateToCategories = () => {
    navigate('/categories');
  };

  const handleNavigateToUpload = () => {
    navigate('/upload');
  };

  return (
    <PageLayout>
      <Container maxWidth="md">
        <Typography variant="h3" align="center" gutterBottom>
          {t.HOME.TITLE}
        </Typography>
        <Typography variant="h5" align="center" color="textSecondary" paragraph>
          {t.HOME.SUBTITLE}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={4} justifyContent="center">
            <Grid sx={{ gridColumn: 'span 12' }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  },
                }}
                onClick={handleNavigateToSearch}
              >
                <SearchIcon fontSize="large" color="primary" />
                <Typography variant="h6" align="center" sx={{ mt: 2 }}>
                  {t.HOME.SEARCH_TITLE}
                </Typography>
                <Typography variant="body2" align="center" sx={{ mt: 1, flexGrow: 1 }}>
                  {t.HOME.SEARCH_DESCRIPTION}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                  sx={{ mt: 2 }}
                  onClick={handleNavigateToSearch}
                >
                  {t.HOME.SEARCH_BUTTON}
                </Button>
              </Paper>
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  },
                }}
                onClick={handleNavigateToCategories}
              >
                <CategoryIcon fontSize="large" color="primary" />
                <Typography variant="h6" align="center" sx={{ mt: 2 }}>
                  {t.HOME.CATEGORY_TITLE}
                </Typography>
                <Typography variant="body2" align="center" sx={{ mt: 1, flexGrow: 1 }}>
                  {t.HOME.CATEGORY_DESCRIPTION}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CategoryIcon />}
                  sx={{ mt: 2 }}
                  onClick={handleNavigateToCategories}
                >
                  {t.HOME.CATEGORY_BUTTON}
                </Button>
              </Paper>
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  },
                }}
                onClick={handleNavigateToUpload}
              >
                <CloudUploadIcon fontSize="large" color="primary" />
                <Typography variant="h6" align="center" sx={{ mt: 2 }}>
                  {t.HOME.UPLOAD_TITLE}
                </Typography>
                <Typography variant="body2" align="center" sx={{ mt: 1, flexGrow: 1 }}>
                  {t.HOME.UPLOAD_DESCRIPTION}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mt: 2 }}
                  onClick={handleNavigateToUpload}
                >
                  {t.HOME.UPLOAD_BUTTON}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </PageLayout>
  );
};

export default Home;
