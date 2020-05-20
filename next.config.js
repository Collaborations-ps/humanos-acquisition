require('@startupcraft/dotenv-config')
const withImages = require('next-images')

module.exports = withImages({
  publicRuntimeConfig: {
    API_HOST: process.env.API_HOST,
    WEB_URL: process.env.WEB_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    SENTRY_DSN: process.env.SENTRY_DSN,

    MICROSOFT_TEAMS_CLIENT_ID:
      process.env.MICROSOFT_TEAMS_CLIENT_ID ||
      'a534fba4-fa50-48fc-91f9-104352b86625',
    MICROSOFT_TEAMS_AUTHORITY:
      process.env.MICROSOFT_TEAMS_AUTHORITY ||
      'https://login.microsoftonline.com/common',
    MICROSOFT_TEAMS_REDIRECT_URI:
      process.env.MICROSOFT_TEAMS_REDIRECT_URI ||
      'http://localhost:3000/microsoft-teams',
  },
})
