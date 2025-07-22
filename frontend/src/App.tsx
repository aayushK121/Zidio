import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import FilesPage from './pages/FilesPage'
import ChartsPage from './pages/ChartsPage'
import SettingsPage from './pages/SettingsPage'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {!user ? (
          // Public routes
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          // Protected routes
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </div>
  )
}

export default App
