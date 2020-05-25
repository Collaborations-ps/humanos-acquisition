import { Dispatch } from 'react'

import get from 'lodash/get'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'

import forEachPromise from '../../forEachPromise'

import { authorize, fetchMSGraph, ENDPOINTS } from '../service'
import { actionTypes, Action } from '../reducer'

function mapMessage(message: any) {
  return {
    id: message.id,
    userId: get(message, 'from.user.id'),
    displayName: get(message, 'from.user.displayName'),
    createdDateTime: get(message, 'createdDateTime'),
    mentions: map(message.mentions, mention => ({
      id: mention.id,
      userId: get(mention, 'mentioned.user.id'),
      displayName: get(mention, 'mentioned.user.displayName'),
    })),
  }
}

async function* messagesIterator(
  groupId: string,
  channelId: string,
  accessToken: string,
) {
  let url = ENDPOINTS.CHANNEL_MESSAGES(groupId, channelId)

  while (url) {
    // eslint-disable-next-line no-await-in-loop
    const messages = await fetchMSGraph(
      url,
      {
        accessToken /* select: ['id', 'from', 'createdDateTime', 'mentions']  */,
      },
      // Currently select is not supported for messages
      // https://docs.microsoft.com/en-us/graph/api/channel-list-messages?view=graph-rest-beta&tabs=http#optional-query-parameters
    )
    if (!messages || isEmpty(messages.value)) {
      return
    }
    yield map(messages.value, mapMessage)
    url = messages['@odata.nextLink']
  }
}

interface FetchMessagesParams {
  dispatch: Dispatch<Action>
  emails?: string[]
}

export default async function fetchMessages({
  dispatch,
  emails,
}: FetchMessagesParams) {
  try {
    dispatch({ type: actionTypes.AUTHORIZE_START })
    const { accessToken } = await authorize()

    const me = await fetchMSGraph(ENDPOINTS.ME, {
      accessToken,
      select: ['userPrincipalName'],
    })

    if (!includes(emails, me.userPrincipalName)) {
      dispatch({ type: actionTypes.WRONG_EMAIL, payload: me.userPrincipalName })
      return
    }

    dispatch({ type: actionTypes.GROUPS_FETCH_START })
    const groups = await fetchMSGraph(ENDPOINTS.MEMBER_OF, {
      accessToken,
      select: ['id'],
    })
    const groupIds = map(groups.value, 'id')

    dispatch({
      type: actionTypes.GROUPS_FETCH_SUCCESS,
      payload: groupIds.length,
    })

    dispatch({ type: actionTypes.CHANNELS_FETCH_START })
    const channelIds: string[] = []
    await forEachPromise(groupIds, async groupId => {
      const channels = await fetchMSGraph(ENDPOINTS.CHANNELS(groupId), {
        accessToken,
        select: ['id'],
      })
      channelIds.push(...map(channels.value, 'id'))
    })

    dispatch({
      type: actionTypes.CHANNELS_FETCH_SUCCESS,
      payload: channelIds.length,
    })

    dispatch({ type: actionTypes.MESSAGES_FETCH_START })

    const messages: any[] = []
    await forEachPromise(groupIds, async groupId => {
      await forEachPromise(channelIds, async channelId => {
        const iterator = messagesIterator(groupId, channelId, accessToken)

        for await (const newMessages of iterator) {
          messages.push(...newMessages)
        }
      })
    })

    console.log('MESSAGES', messages)

    dispatch({ type: actionTypes.FETCH_SUCCESS })
  } catch (error) {
    console.error(error)
    dispatch({ type: actionTypes.ERROR, error })
  }
}
