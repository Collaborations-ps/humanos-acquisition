import { publicRuntimeConfig } from './config'

export const handleGoToApp = () => {
  window.open(`${publicRuntimeConfig.WEB_URL}/app/individual`, '_self')
}

export const handleGoToSettings = () => {
  window.open(`${publicRuntimeConfig.WEB_URL}/app/settings`, '_self')
}
