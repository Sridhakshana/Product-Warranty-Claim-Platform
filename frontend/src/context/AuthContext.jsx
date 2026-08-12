import { createContext, useContext, useEffect, useState } from 'react'
import { api, getUser, setAuth, clearAuth } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getUser() && !localStorage.getItem('token')) {
      clearAuth()
      setUser(null)
    }
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await api.login({ email, password })
      setAuth(res.access_token, res.user)
      setUser(res.user)
      return res
    } finally {
      setLoading(false)
    }
  }

  const register = async (data) => {
    setLoading(true)
    try {
      const res = await api.register(data)
      return res
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearAuth()
    setUser(null)
  }

  const is = (role) => user?.role === role

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, is }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
