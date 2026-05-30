import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CameraManagement from './pages/CameraManagement';
import FireStationDashboard from './pages/FireStationDashboard';
import FaceVerification from './pages/FaceVerification';
import AddProperty from './pages/AddProperty';
import Navbar from './components/Navbar';
import { logoutUser } from './services/api';
import './App.css';

// Create AuthContext
export const AuthContext = createContext();

// useAuth hook
export function useAuth() {
  return useContext(AuthContext);
}

// ProtectedRoute: redirect to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default function App() {
  // Read authenticated state and user data from sessionStorage key "agniv_user" on init
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('agniv_user');
  });

  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('agniv_user');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed to parse stored user info', e);
      return null;
    }
  });

  // login(userData)
  const login = (userData) => {
    sessionStorage.setItem('agniv_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  // logout()
  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Backend logout failed:', e);
    }
    sessionStorage.removeItem('agniv_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout,
        // Aliases to maintain compatibility with existing legacy files
        handleLogin: login,
        handleLogout: logout
      }}
    >
      <div className="animated-bg" />
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Landing />} />

          {/* Login route: Redirect if already authenticated */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />

          {/* Protected routes wrapped with Navbar */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/camera/:propertyId" 
            element={
              <ProtectedRoute>
                <CameraManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/verify" 
            element={
              <ProtectedRoute>
                <FaceVerification />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fire-station" 
            element={
              <ProtectedRoute>
                <FireStationDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-property" 
            element={
              <ProtectedRoute>
                <AddProperty />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all navigation */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}
