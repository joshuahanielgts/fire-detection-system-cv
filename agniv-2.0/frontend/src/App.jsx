import React, { createContext, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CameraManagement from './pages/CameraManagement'
import FireStationDashboard from './pages/FireStationDashboard'
import FaceVerification from './pages/FaceVerification'
import AddProperty from './pages/AddProperty'
import './App.css'

export const AuthContext = createContext()

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = window.sessionStorage.getItem('agniva_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    window.sessionStorage.setItem('agniva_user', JSON.stringify(userData))
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.warn('Backend logout failed', error)
    }
    setUser(null)
    setIsAuthenticated(false)
    window.sessionStorage.removeItem('agniva_user')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, handleLogin, handleLogout }}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/camera/:propertyId"
            element={isAuthenticated ? <CameraManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/verify"
            element={isAuthenticated ? <FaceVerification /> : <Navigate to="/login" />}
          />
          <Route
            path="/fire-station"
            element={isAuthenticated ? <FireStationDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/add-property"
            element={isAuthenticated ? <AddProperty /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  )
}
