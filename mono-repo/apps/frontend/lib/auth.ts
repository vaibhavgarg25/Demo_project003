export interface User {
  id: string
  email: string
  name: string
}

const AUTH_TOKEN_KEY = "kochi_metro_auth_token"
const USER_KEY = "kochi_metro_user"

// Demo credentials
const DEMO_CREDENTIALS = {
  email: "admin@kochimetro.com",
  password: "metro2024",
  user: {
    id: "1",
    email: "admin@kochimetro.com",
    name: "Metro Administrator",
  },
}

export function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        const token = `demo_token_${Date.now()}`
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(DEMO_CREDENTIALS.user))
        resolve({ success: true, user: DEMO_CREDENTIALS.user })
      } else {
        resolve({ success: false, error: "Invalid credentials" })
      }
    }, 1000) // Simulate network delay
  })
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem(USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}
