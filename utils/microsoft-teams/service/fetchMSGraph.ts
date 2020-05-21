import qs from 'qs'

interface Options {
  accessToken: string
  select?: string[]
  expand?: string[]
}

export const ENDPOINTS = {
  ME: 'https://graph.microsoft.com/v1.0/me',
  MEMBER_OF: 'https://graph.microsoft.com/v1.0/me/memberOf',
  CHANNELS: (teamId: string) =>
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels`,
  CHANNEL_MESSAGES: (teamId: string, channelId: string) =>
    `https://graph.microsoft.com/beta/teams/${teamId}/channels/${channelId}/messages`,
}

export default async function fetchMSGraph(endpoint: string, options: Options) {
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
