import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import PageLayout from '../common/Layout'

function Home() {
  const { t } = useLanguage()

  return (
    <PageLayout title={t.SEARCH.TITLE}>
      <div className="container">
        <Link to="/search"><h1>{t.HOME.TO_SEARCH}</h1></Link>
      </div>
    </PageLayout>
  )
}

export default Home
