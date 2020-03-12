import { publicRuntimeConfig } from './config'

export const handleGoToApp = () => {
  window.open(`${publicRuntimeConfig.WEB_URL}/app/individual`, '_self')
}
