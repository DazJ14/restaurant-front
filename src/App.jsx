import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import MesasPage from './pages/MesasPage'
import PedidosPage from './pages/PedidosPage'
import CocinaPage from './pages/CocinaPage'
import PagosPage from './pages/PagosPage'

function ProtectedRoute({ children, roles }) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.rol_id)) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function RootRedirect() {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  const map = { 1: '/mesas', 2: '/mesas', 3: '/pedidos', 4: '/cocina' }
  return <Navigate to={map[user?.rol_id] || '/mesas'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/mesas" element={
        <ProtectedRoute roles={[1, 2, 3]}><MesasPage /></ProtectedRoute>
      } />
      <Route path="/pedidos" element={
        <ProtectedRoute roles={[1, 3]}><PedidosPage /></ProtectedRoute>
      } />
      <Route path="/cocina" element={
        <ProtectedRoute roles={[1, 4]}><CocinaPage /></ProtectedRoute>
      } />
      <Route path="/pagos" element={
        <ProtectedRoute roles={[1, 2, 3]}><PagosPage /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
