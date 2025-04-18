import './App.css'
import { Route, BrowserRouter as Router, Routes }from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import Search from './components/Search/Search'
import Home from './components/Home/Home'

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Router>
    </LanguageProvider>
  )
}

export default App
