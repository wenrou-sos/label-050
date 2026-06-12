export const useAuth = () => {
  const token = useState<string | null>('auth_token', () => {
    if (process.client) {
      return localStorage.getItem('auth_token')
    }
    return null
  })

  const user = useState<any>('auth_user', () => null)

  const isLoggedIn = computed(() => !!token.value)

  const login = async (username: string, password: string) => {
    const result = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    }) as any

    if (result?.success) {
      token.value = result.data.token
      user.value = result.data.user
      if (process.client) {
        localStorage.setItem('auth_token', result.data.token)
        localStorage.setItem('auth_user', JSON.stringify(result.data.user))
      }
    }

    return result
  }

  const logout = () => {
    token.value = null
    user.value = null
    if (process.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
    navigateTo('/login')
  }

  const fetchUser = async () => {
    if (!token.value) return null

    try {
      const result = await $fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      }) as any

      if (result?.success) {
        user.value = result.data
        if (process.client) {
          localStorage.setItem('auth_user', JSON.stringify(result.data))
        }
      }

      return result?.data
    } catch {
      logout()
      return null
    }
  }

  const initAuth = () => {
    if (process.client) {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('auth_user')
      if (savedToken) {
        token.value = savedToken
      }
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
        } catch {
          console.error('Failed to parse saved user')
        }
      }
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    logout,
    fetchUser,
    initAuth
  }
}
