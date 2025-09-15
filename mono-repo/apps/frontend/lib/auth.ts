export interface User {
  id: string
  email: string
  name: string
}

const AUTH_TOKEN_KEY = "token"
const USER_KEY = "user"

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_CLIENT_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json()
  if (response.ok) {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    }
    return { success: true, user: data.user }
  } else {
    return { success: false, error: data.message || "Login failed" }
  }
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
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
