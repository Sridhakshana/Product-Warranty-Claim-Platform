import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Chatbot from './components/Chatbot'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Claims from './pages/Claims'
import Notifications from './pages/Notifications'
import QRVerify from './pages/QRVerify'

import AdminClaims from './pages/admin/AdminClaims'
import ServiceCenters from './pages/admin/ServiceCenters'
import Reports from './pages/admin/Reports'

import ServiceClaims from './pages/service/ServiceClaims'

function AppLayout({ children }) {
  return (
    <>
      <Layout>{children}</Layout>
      <Chatbot />
    </>
  )
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/qr-verify" element={<QRVerify />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute roles={['customer']}>
            <AppLayout><Products /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/claims"
        element={
          <ProtectedRoute roles={['customer']}>
            <AppLayout><Claims /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AppLayout><Notifications /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/claims"
        element={
          <ProtectedRoute roles={['admin']}>
            <AppLayout><AdminClaims /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/service-centers"
        element={
          <ProtectedRoute roles={['admin']}>
            <AppLayout><ServiceCenters /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute roles={['admin']}>
            <AppLayout><Reports /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/service/claims"
        element={
          <ProtectedRoute roles={['service_center']}>
            <AppLayout><ServiceClaims /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
