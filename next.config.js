// eslint-disable-next-line
const withCSS = require('@zeit/next-css')
const withImages = require('next-images')
require('@startupcraft/dotenv-config')

module.exports = withImages(
  withCSS({
    publicRuntimeConfig: {
      API_HOST: process.env.API_HOST,
      WEB_URL: process.env.WEB_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    },
  }),
)
