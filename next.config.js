// eslint-disable-next-line
const withCSS = require('@zeit/next-css')
require('@startupcraft/dotenv-config')

const prod = process.env.NODE_ENV === 'production'

module.exports = withCSS({
  publicRuntimeConfig: {
    API_HOST: process.env.API_HOST,
  }
})
