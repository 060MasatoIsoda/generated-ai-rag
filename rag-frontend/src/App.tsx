import './App.css'
import { Route, BrowserRouter as Router, Routes }from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { SectionResultProvider } from './contexts/SectionResult/SectionResultContextProvidor'
import Search from './components/Search/Search'
import Home from './components/Home/Home'
import CategoryManagement from './components/CategoryManagement/CategoryManagement'
import DocumentUpload from './components/DocumentUpload/DocumentUpload'
import SearchStreaming from './components/SearchStreaming/SearchStreaming'
function App() {
  return (
    <LanguageProvider>
      <SectionResultProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/upload" element={<DocumentUpload />} />
            <Route path="/search-streaming" element={<SearchStreaming />} />
          </Routes>
        </Router>
      </SectionResultProvider>
    </LanguageProvider>
  )
}

export default App
