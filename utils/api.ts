import axios from 'axios'
import Cookies from 'js-cookie'

import get from 'lodash/get'

import { publicRuntimeConfig } from './config'

function getAuthHeaders() {
  const jwt = JSON.parse(Cookies.get('humanos-jwt') || 'null')

  const headers: { Authorization?: string } = {
    Authorization: undefined,
  }

  if (jwt) {
    headers.Authorization = `Bearer ${get(jwt, 'accessToken')}`
  }

  return headers
}

async function checkAuthorized(): Promise<boolean> {
  const response = await axios.get(
    `${publicRuntimeConfig.API_HOST}/private/checkAuth`,
    {
      headers: getAuthHeaders(),
    },
  )

  const data = get(response, 'data', { ok: false })

  return data.ok
}

async function sendNotification(): Promise<boolean> {
  const response = await axios.get(
    `${publicRuntimeConfig.API_HOST}/private/gmailPackageUploaded`,
    {
      headers: getAuthHeaders(),
    },
  )

  const data = get(response, 'data', { ok: false })

  return data.ok
}

async function signGmailPackage({
  name,
  contentType,
  size,
}: {
  name: string
  contentType: string
  size: number
}): Promise<string | boolean> {
  const response = await axios.get(
    `${publicRuntimeConfig.API_HOST}/private/signGmailPackage`,
    {
      headers: getAuthHeaders(),
      params: { name, contentType, size },
    },
  )

  const data = get(response, 'data', { ok: false })

  if (data.ok) {
    return data.s3Url
  }

  return false
}

export default {
  checkAuthorized,
  signGmailPackage,
  sendNotification,
}
