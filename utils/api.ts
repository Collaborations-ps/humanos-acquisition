import axios from 'axios'

import get from 'lodash/get'

import { publicRuntimeConfig } from './config'
import { resetTokenAndReattemptRequest } from './resetToken'
import { getAuthHeaders, getRefreshToken } from './auth'

const axiosWithRefresh = axios.create()

function isTokenExpiredError(errorResponse: any): boolean {
  return errorResponse.status === 401 && getRefreshToken()
}

axiosWithRefresh.interceptors.response.use(
  function onFulfilled(response) {
    return response
  },
  function onRejected(error) {
    const errorResponse = error.response
    if (isTokenExpiredError(errorResponse)) {
      return resetTokenAndReattemptRequest(error)
    }

    return Promise.reject(error)
  },
)

async function checkAuthorized(): Promise<boolean> {
  try {
    const response = await axiosWithRefresh.get(
      `${publicRuntimeConfig.API_HOST}/private/checkAuth`,
      {
        headers: getAuthHeaders(),
      },
    )

    const data = get(response, 'data', { ok: false })

    return data.ok
  } catch (e) {
    return false
  }
}

async function getMyEmails(): Promise<boolean | string[]> {
  try {
    const response = await axiosWithRefresh.get(
      `${publicRuntimeConfig.API_HOST}/private/getMyEmails`,
      {
        headers: getAuthHeaders(),
      },
    )

    const data = get(response, 'data', { ok: false })

    if (data.ok) {
      return data.emails
    }

    return false
  } catch (e) {
    return false
  }
}

async function sendNotification(id: string, email: string): Promise<boolean> {
  const response = await axiosWithRefresh.get(
    `${publicRuntimeConfig.API_HOST}/private/gmailPackageUploaded`,
    {
      headers: getAuthHeaders(),
      params: { id, email },
    },
  )

  const data = get(response, 'data', { ok: false })

  return data.ok
}

async function signGmailPackage({
  name,
  contentType,
  size,
  email,
}: {
  name: string
  contentType: string
  size: number
  email: string
}): Promise<{ id: string; s3Url: string } | boolean> {
  const response = await axiosWithRefresh.get(
    `${publicRuntimeConfig.API_HOST}/private/signGmailPackage`,
    {
      headers: getAuthHeaders(),
      params: { name, contentType, size, email },
    },
  )

  const data = get(response, 'data', { ok: false })

  if (data.ok) {
    return {
      id: data.id,
      s3Url: data.s3Url,
    }
  }

  return false
}

export default {
  checkAuthorized,
  signGmailPackage,
  sendNotification,
  getMyEmails,
}
