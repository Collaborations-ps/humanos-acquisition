import axios, { Canceler, CancelToken } from 'axios'
import { nanoid } from 'nanoid'
import addressparser from 'addressparser'

import map from 'lodash/map'
import get from 'lodash/get'
import chunk from 'lodash/chunk'
import keyBy from 'lodash/keyBy'
import forEach from 'lodash/forEach'

import { parseMultipart } from './multipart'
import forEachPromise from './forEachPromise'
import delay from './delay'

export enum ACTIONS {
  START,
  TOTAL_MESSAGES,
  LIST_LOADED,
  MESSAGES_LOADED,
  DONE,
  ERROR,
  CANCELED,
  CANCELED_ON_ERROR,
}

const MAX_RESULTS = 5000
// TODO: q not available for metadata scope
// const q = 'newer_than:6m'

interface Action {
  action: ACTIONS
  value?: any
}

interface ActionCallback {
  onAction: (action: Action) => void
  cancel: Canceler
}

function parseMessage(message: any) {
  const headers = keyBy(get(message, 'payload.headers'), 'name')

  return {
    id: get(message, 'id'),
    threadId: get(message, 'threadId'),
    date: get(headers, 'Date.value'),
    from: addressparser(get(headers, 'From.value') || ''),
    to: addressparser(get(headers, 'To.value') || ''),
    cc: addressparser(get(headers, 'Cc.value') || ''),
    bcc: addressparser(get(headers, 'Bcc.value') || ''),
  }
}

interface MakeBatchMessagesBody {
  boundary: string
  messageIds: string[]
}
export function makeBatchMessagesBody({
  boundary,
  messageIds,
}: MakeBatchMessagesBody) {
  const batchContent = []

  batchContent.push('')

  forEach(messageIds, messageId => {
    batchContent.push(`--batch_${boundary}`)
    batchContent.push(`Content-Type: application/http`)
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

interface GetList {
  callback: ActionCallback
  cancelToken: CancelToken
  token: string
  allMessages: any[]
  pageToken?: string
}
async function getList({
  callback,
  cancelToken,
  token,
  allMessages,
  pageToken,
}: GetList): Promise<any[]> {
  return axios
    .get('https://www.googleapis.com/gmail/v1/users/me/messages', {
      cancelToken,
      headers: {
        Authorization: token,
      },
      params: {
        maxResults: MAX_RESULTS,
        pageToken,
      },
    })
    .then(async response => {
      const list = {
        messages: map(get(response, 'data.messages'), 'id'),
        nextPageToken: get(response, 'data.nextPageToken'),
        estimatedSize: get(response, 'data.resultSizeEstimate'),
      }

      callback.onAction({
        action: ACTIONS.LIST_LOADED,
        value: listsCount += 1,
      })

      if (list.nextPageToken) {
        return getList({
          callback,
          cancelToken,
          token,
          allMessages: [...allMessages, ...list.messages],
          pageToken: list.nextPageToken,
        })
      }

      return [...allMessages, ...list.messages]
    })
}

interface GetMessagesChunk {
  cancelToken: CancelToken
  messageIds: string[]
  token: string
}

async function getMessagesChunk({
  cancelToken,
  messageIds,
  token,
}: GetMessagesChunk) {
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
      cancelToken,
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

interface StartFetchingMessages {
  token: string
  callback: ActionCallback
}
export default async function startFetchingMessages({
  token,
  callback,
}: StartFetchingMessages) {
  const source = axios.CancelToken.source()

  // eslint-disable-next-line no-param-reassign
  callback.cancel = source.cancel

  source.token.promise.then(({ message }: any) => {
    callback.onAction({ action: message })
  })

  try {
    callback.onAction({ action: ACTIONS.START })

    listsCount = 0
    const allMessageIds = await getList({
      callback,
      cancelToken: source.token,
      token,
      allMessages: [],
    })

    callback.onAction({
      action: ACTIONS.TOTAL_MESSAGES,
      value: allMessageIds.length,
    })

    const chunks = chunk(allMessageIds, 50)

    const allMessages: any[] = []
    let loaded = 0

    await forEachPromise(chunks, async (messageIds: string[]) => {
      const messages = map(
        await getMessagesChunk({
          cancelToken: source.token,
          messageIds,
          token,
        }),
        parseMessage,
      )
      await delay(1000)

      loaded += messages.length

      callback.onAction({ action: ACTIONS.MESSAGES_LOADED, value: loaded })

      allMessages.push(...messages)
    })

    callback.onAction({ action: ACTIONS.DONE, value: allMessages })
  } catch (error) {
    if (error.message !== ACTIONS.CANCELED) {
      callback.onAction({ action: ACTIONS.ERROR, value: error.message })
    }
  }
}
