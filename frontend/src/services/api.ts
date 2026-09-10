const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const basePath = apiUrl.replace(/\/$/, '')
  const endpointPath = path.startsWith('/') ? path : `/${path}`
  const targetUrl = endpointPath.startsWith('/api')
    ? `${basePath}${endpointPath}`
    : `${basePath}/api${endpointPath}`

  const response = await fetch(targetUrl, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const body: unknown = await response.json()

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : 'Request failed'
    throw new ApiError(message, response.status)
  }

  return body as T
}

export const api = {
  get: async <T>(path: string) => ({ data: await apiRequest<T>(path, { method: 'GET' }) }),
  post: async <T>(path: string, body?: unknown) => ({
    data: await apiRequest<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  }),
  patch: async <T>(path: string, body?: unknown) => ({
    data: await apiRequest<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  }),
  delete: async <T>(path: string) => ({ data: await apiRequest<T>(path, { method: 'DELETE' }) }),
}
