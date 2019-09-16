require('@startupcraft/dotenv-config')
const withImages = require('next-images')

module.exports = withImages({
    publicRuntimeConfig: {
      API_HOST: process.env.API_HOST,
      WEB_URL: process.env.WEB_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    },
  },
)
