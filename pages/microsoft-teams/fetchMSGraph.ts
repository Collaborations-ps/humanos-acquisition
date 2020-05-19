export const ENDPOINTS = {
  ME: 'https://graph.microsoft.com/v1.0/me',
  MEMBER_OF: 'https://graph.microsoft.com/v1.0/me/memberOf',
  CHANNELS: (teamId: string) =>
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels`,
  CHANNEL_MESSAGES: (teamId: string, channelId: string) =>
    `https://graph.microsoft.com/beta/teams/${teamId}/channels/${channelId}/messages`,
}
export default async function fetchMSGraph(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return response.json()
}
