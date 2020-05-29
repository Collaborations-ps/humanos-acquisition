const baseURL = 'https://graph.microsoft.com'

export default {
  CHANNELS: (teamId: string) => `${baseURL}/v1.0/teams/${teamId}/channels`,
  CHANNEL_MESSAGES: (teamId: string, channelId: string) =>
    `${baseURL}/beta/teams/${teamId}/channels/${channelId}/messages`,
  ME: `${baseURL}/v1.0/me`,
  MEMBER_OF: `${baseURL}/v1.0/me/memberOf`,
  MESSAGES: `${baseURL}/v1.0/me/messages`,
}
