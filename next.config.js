require('@startupcraft/dotenv-config')

const withImages = require('next-images')

module.exports = withImages({
  publicRuntimeConfig: {
    API_HOST: process.env.API_HOST,
    WEB_URL: process.env.WEB_URL,
    PUBLIC_HOST: process.env.PUBLIC_HOST,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    SENTRY_DSN: process.env.SENTRY_DSN,
    MICROSOFT_TEAMS_CLIENT_ID: process.env.MICROSOFT_TEAMS_CLIENT_ID,
    MICROSOFT_TEAMS_AUTHORITY: process.env.MICROSOFT_TEAMS_AUTHORITY,
    MICROSOFT_TEAMS_REDIRECT_URI: process.env.MICROSOFT_TEAMS_REDIRECT_URI,
    REPO_URL: 'https://github.com/Collaborations-ps/humanos-acquisition/',
    EMAIL: 'info@collaboration.ai',
    PHONE: '+16517607717',
    TERMS_URL: 'https://www.collaboration.ai/terms.html',
  },
  serverRuntimeConfig: {
    ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
    ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
  },
})
