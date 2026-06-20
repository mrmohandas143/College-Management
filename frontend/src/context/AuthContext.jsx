import { createContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (token) {
      try {
        setUser(jwtDecode(token))
      } catch {
        localStorage.clear()
      }
    }
  }, [])

  const login = (access, refresh) => {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    const decoded = jwtDecode(access)
    setUser(decoded)
    return decoded
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
