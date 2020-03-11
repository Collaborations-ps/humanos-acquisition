import axios from 'axios'
import nanoid from 'nanoid'

import get from 'lodash/get'
import map from 'lodash/map'
import keyBy from 'lodash/keyBy'
import chunk from 'lodash/chunk'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'

import { publicRuntimeConfig } from './config'
import { resetTokenAndReattemptRequest } from './resetToken'
import { getAuthHeaders, getRefreshToken } from './auth'
import { parseMultipart } from './multipart'
import forEachPromise from './forEachPromise'
import delay from './delay'

export enum ACTIONS {
  TOTAL_MESSAGES,
  LIST_LOADED,
  MESSAGES_LOADED,
  DONE,
}

interface Action {
  action: ACTIONS
  value?: any
}

type ActionCallback = (action: Action) => void

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
}: {
  name: string
  contentType: string
  size: number
}): Promise<{ id: string; s3Url: string } | boolean> {
  const response = await axiosWithRefresh.get(
    `${publicRuntimeConfig.API_HOST}/private/signGmailPackage`,
    {
      headers: getAuthHeaders(),
      params: { name, contentType, size },
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

function parseMessage(message: any) {
  const headers = keyBy(get(message, 'payload.headers'), 'name')

  return {
    id: get(message, 'id'),
    threadId: get(message, 'threadId'),
    from: get(headers, 'From.value'),
    to: get(headers, 'To.value'),
    date: get(headers, 'Date.value'),
    cc: get(headers, 'Cc.value'),
  }
}

export function makeBatchMessagesBody({
  boundary,
  messageIds,
}: {
  boundary: string
  messageIds: string[]
}) {
  const batchContent = []

  batchContent.push('')

  forEach(messageIds, messageId => {
    batchContent.push(`--batch_${boundary}`)
    batchContent.push('Content-Type: application/http')
    batchContent.push(`Content-ID: <item:${messageId}>`)

    batchContent.push('')

    batchContent.push(
      `GET https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata`,
    )

    batchContent.push('')
  })

  batchContent.push(`--batch_${boundary}--`)

  return batchContent.join('\r\n')
}

let listsCount = 0

async function getList(
  callback: ActionCallback,
  token: string,
  allMessages: any[],
  pageToken?: string,
): Promise<any[]> {
  return axios
    .get('https://www.googleapis.com/gmail/v1/users/me/messages', {
      headers: {
        Authorization: token,
      },
      params: {
        maxResults: 5000,
        pageToken,
      },
    })
    .then(response => {
      const list = {
        messages: map(get(response, 'data.messages'), 'id'),
        nextPageToken: get(response, 'data.nextPageToken'),
        estimatedSize: get(response, 'data.resultSizeEstimate'),
      }

      console.log(`Loaded ${(listsCount += 1)} pages of message ids`)
      callback({
        action: ACTIONS.LIST_LOADED,
        value: { fetched: listsCount += 1, estimatedSize: list.estimatedSize },
      })

      if (list.nextPageToken) {
        return getList(
          callback,
          token,
          [...allMessages, ...list.messages],
          list.nextPageToken,
        )
      }

      return [...allMessages, ...list.messages]
    })
}

async function getMessagesChunk(messageIds: string[], token: string) {
  const authHeaders = {
    Authorization: token,
  }

  const boundary = nanoid()

  const response = await axios.post(
    `https://www.googleapis.com/batch/gmail/v1`,
    makeBatchMessagesBody({
      boundary,
      messageIds,
    }),
    {
      headers: {
        ...authHeaders,
        'Content-Type': `multipart/mixed; boundary=batch_${boundary}`,
      },
      transformResponse: (data, headers) => {
        try {
          return parseMultipart(data, get(headers, 'content-type'))
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e)
          return null
        }
      },
    },
  )

  return get(response, 'data') || {}
}

async function startFetchingMessages(token: string, callback: ActionCallback) {
  listsCount = 0
  console.time('LoadLists')
  const allMessageIds = await getList(callback, token, [])
  console.timeEnd('LoadLists')

  console.log(`Total ${allMessageIds.length} messages`)
  callback({ action: ACTIONS.TOTAL_MESSAGES, value: allMessageIds.length })
  const chunks = chunk(allMessageIds, 50)

  const allMessages: any[] = []
  let loaded = 0

  console.time('LoadMessages')
  await forEachPromise(chunks, async (messageIds: string[]) => {
    const messages = map(
      await getMessagesChunk(messageIds, token),
      parseMessage,
    )
    await delay(1000)

    loaded += messages.length

    callback({ action: ACTIONS.MESSAGES_LOADED, value: loaded })
    console.log(`Loaded ${loaded} of ${allMessageIds.length} messages`)

    allMessages.push(...messages)
  })

  console.timeEnd('LoadMessages')

  console.log({ allMessages, withCC: filter(allMessages, item => item.cc) })
  callback({ action: ACTIONS.DONE, value: allMessages })
}

export default {
  checkAuthorized,
  signGmailPackage,
  sendNotification,
  getList,
  getMessagesChunk,
  startFetchingMessages,
}
