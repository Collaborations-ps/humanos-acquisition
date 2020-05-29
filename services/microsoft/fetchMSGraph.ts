import qs from 'qs'

interface FetchOptions {
  accessToken: string
  select?: string[]
  expand?: string[]
}

export default async function fetchMSGraph(
  endpoint: string,
  options: FetchOptions,
) {
  const select = (options.select || []).join(',')
  const expand = (options.expand || []).join(',')

  const query =
    select || expand ? qs.stringify({ $select: select, $expand: expand }) : ''

  const url =
    endpoint.indexOf('?') > -1
      ? endpoint
      : `${endpoint}${query ? '?' : ''}${query}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
    },
  })
  return response.json()
}
