import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock } from 'lucide-react'
import { AuthContext } from '../App'
import { login as apiLogin } from '../services/api'
import '../styles/Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const { handleLogin, isAuthenticated } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiLogin(email, password)
      const user = response.data.user
      handleLogin(user)
      navigate('/dashboard')
    } catch (error) {
      const message = error?.response?.data?.error || 'Login failed. Please try again.'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-orb orb-1"></div>
      <div className="auth-orb orb-2"></div>

      <div className="auth-card glass-card">
        <div className="auth-header">
          <Shield className="auth-icon" />
          <h1>Agniv2.0</h1>
          <p>Fire Detection & Emergency Response System</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Demo credentials: use any email and password to login</p>
        </div>
      </div>
    </div>
  )
}
