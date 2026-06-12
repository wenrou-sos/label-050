export const useApi = () => {
  const { token } = useAuth()

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
    }
  }

  const handleResponse = (response: any) => {
    if (response.status === 401) {
      const { logout } = useAuth()
      logout()
      throw new Error('认证令牌已过期，请重新登录')
    }
  }

  const request = async (url: string, options: any = {}) => {
    try {
      const headers = { ...getHeaders(), ...options.headers }
      const result = await $fetch(url, {
        ...options,
        headers
      })
      return result as any
    } catch (error: any) {
      if (error?.response) {
        handleResponse(error.response)
      }
      if (error?.data?.message) {
        throw new Error(error.data.message)
      }
      throw error
    }
  }

  const get = (url: string, params?: any) => {
    let queryUrl = url
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        queryUrl += `?${queryString}`
      }
    }
    return request(queryUrl, { method: 'GET' })
  }

  const post = (url: string, body?: any) => {
    return request(url, { method: 'POST', body })
  }

  const put = (url: string, body?: any) => {
    return request(url, { method: 'PUT', body })
  }

  const del = (url: string) => {
    return request(url, { method: 'DELETE' })
  }

  return {
    request,
    get,
    post,
    put,
    del
  }
}
