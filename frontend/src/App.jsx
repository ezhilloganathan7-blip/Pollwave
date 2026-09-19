import { Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/Auth.jsx'
import CreatePoll from './pages/CreatePoll.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Vote from './pages/Vote.jsx'
import Results from './pages/Results.jsx'
import { isLoggedIn } from './components'

function Protected({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={isLoggedIn() ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/create" element={<Protected><CreatePoll /></Protected>} />
      <Route path="/vote/:slug" element={<Vote />} />
      <Route path="/results/:slug" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
