import { useLanguage } from "../../contexts/LanguageContext"
import { AppBar, Box, Button, Toolbar, Typography, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { Link } from 'react-router-dom'


interface PageLayoutProps {
    title: string
    children: React.ReactNode
}


function PageLayout({ title, children }: PageLayoutProps) {
    const { setLanguage, t } = useLanguage()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleLanguageChange = (lang: "ja" | "en") => {
        setLanguage(lang)
        handleClose()
    }

    return (
        <Box sx={{ display: "flex", height: "100vh" }}>
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar sx={{ position: "relative" }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>{title}</Link>
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                color="inherit"
                component={Link}
                to="/search"
              >
                {t.COMMON.SEARCH}
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/categories"
              >
                {t.COMMON.CATEGORY_MANAGEMENT}
              </Button>
            </Box>
            <Box marginLeft={"auto"}>
              <Button
                color="inherit"
                onClick={(event) => setAnchorEl(event.currentTarget)}
              >
                {t.COMMON.LANGUAGE_SELECT}
              </Button>

              <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={() => handleLanguageChange("ja")}>
                  {t.COMMON.LANGUAGE_SELECT_JAPANESE}
                </MenuItem>
                <MenuItem onClick={() => handleLanguageChange("en")}>
                  {t.COMMON.LANGUAGE_SELECT_ENGLISH}
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        {children}
      </Box>
    )
}

export default PageLayout
