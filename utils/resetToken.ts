import axios from 'axios'

import get from 'lodash/get'

import { publicRuntimeConfig } from './config'
import { getAuthHeaders, getRefreshToken, setAccessToken } from './auth'

let isAlreadyFetchingAccessToken = false

// This is the list of waiting requests that will retry after the JWT refresh complete
let subscribers: any[] = []

function onAccessTokenFetched(accessToken: string) {
  // When the refresh is successful, we start retrying the requests one by one and empty the queue
  subscribers.forEach(callback => callback(accessToken))
  subscribers = []
}

function addSubscriber(callback: any) {
  subscribers.push(callback)
}

export async function resetTokenAndReattemptRequest(error: any) {
  try {
    const { response: errorResponse } = error

    const resetToken = getRefreshToken()

    if (!resetToken) {
      return Promise.reject(error)
    }

    const retryOriginalRequest = new Promise(resolve => {
      addSubscriber((accessToken: string) => {
        errorResponse.config.headers.Authorization = `Bearer ${accessToken}`
        resolve(axios(errorResponse.config))
      })
    })

    if (!isAlreadyFetchingAccessToken) {
      isAlreadyFetchingAccessToken = true

      const response = await axios.get(
        `${publicRuntimeConfig.API_HOST}/auth/refresh-token`,
        {
          headers: getAuthHeaders(),
          params: {
            refreshToken: getRefreshToken(),
          },
        },
      )

      if (!response.data) {
        return Promise.reject(error)
      }

      const newToken = get(response, 'data.refreshed.accessToken')

      setAccessToken(newToken)

      isAlreadyFetchingAccessToken = false

      onAccessTokenFetched(newToken)
    }

    return retryOriginalRequest
  } catch (err) {
    return Promise.reject(err)
  }
}

export default {}
