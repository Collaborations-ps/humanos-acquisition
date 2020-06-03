import qs from 'qs'

interface FetchZoomAPIOptions {
  token: string
}

export default async function fetchZoomAPI(
  endpoint: string,
  options: FetchZoomAPIOptions,
) {
  const query = qs.stringify({
    endpoint,
    token: options.token,
  })
  const response = await fetch(`/api/zoom/call?${query}`)
  const data = await response.json()
  return data
}
