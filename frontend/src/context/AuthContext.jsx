import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u && token) setUser(JSON.parse(u))
    setReady(true)
  }, [])

  const login = (userData, accessToken, refreshToken) => {
    setUser(userData); setToken(accessToken)
    localStorage.setItem('token',        accessToken)
    localStorage.setItem('refresh_token',refreshToken)
    localStorage.setItem('user',         JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null); setToken(null)
    localStorage.clear()
  }

  return <Ctx.Provider value={{ user, token, login, logout, ready }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
