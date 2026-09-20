export function getMediaUrl(url: string | undefined | null): string {
  if (!url) return ''
  
  // If already an absolute URL, data URL, or blob URL, return as-is
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url
  }

  const backendBaseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000'

  const cleanPath = url.startsWith('/') ? url : `/${url}`
  return `${backendBaseUrl}${cleanPath}`
}
