import Cookies from 'js-cookie'

import get from 'lodash/get'

function getJWT() {
  return JSON.parse(Cookies.get('humanos-jwt') || 'null')
}

export function getAuthHeaders() {
  const headers: { Authorization?: string } = {
    Authorization: undefined,
  }

  const accessToken = get(getJWT(), 'accessToken')

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

export function getRefreshToken() {
  const jwt = getJWT()

  return get(jwt, 'refreshToken')
}

export function setAccessToken(accessToken: string) {
  const jwt = getJWT()

  Cookies.set('humanos-jwt', { ...jwt, accessToken })
}
