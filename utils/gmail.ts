import axios from 'axios'
import nanoid from 'nanoid'

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
}

interface Action {
  action: ACTIONS
  value?: any
}

type ActionCallback = (action: Action) => void

function parseMessage(message: any) {
  const headers = keyBy(get(message, 'payload.headers'), 'name')

  return {
    id: get(message, 'id'),
    threadId: get(message, 'threadId'),
    from: get(headers, 'From.value'),
    to: get(headers, 'To.value'),
    date: get(headers, 'Date.value'),
    cc: get(headers, 'Cc.value'),
    bcc: get(headers, 'Bcc.value'),
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

      callback({
        action: ACTIONS.LIST_LOADED,
        value: listsCount += 1,
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

export default async function startFetchingMessages(
  token: string,
  callback: ActionCallback,
) {
  try {
    callback({ action: ACTIONS.START })
    listsCount = 0
    const allMessageIds = await getList(callback, token, [])

    callback({ action: ACTIONS.TOTAL_MESSAGES, value: allMessageIds.length })
    const chunks = chunk(allMessageIds, 50)

    const allMessages: any[] = []
    let loaded = 0

    await forEachPromise(chunks, async (messageIds: string[]) => {
      const messages = map(
        await getMessagesChunk(messageIds, token),
        parseMessage,
      )
      await delay(1000)

      loaded += messages.length

      callback({ action: ACTIONS.MESSAGES_LOADED, value: loaded })

      allMessages.push(...messages)
    })

    callback({ action: ACTIONS.DONE, value: allMessages })
  } catch (error) {
    callback({ action: ACTIONS.ERROR, value: error })
  }
}
