import { Dispatch } from 'react'

import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'

import forEachPromise from '../../forEachPromise'

import { authorize, fetchMSGraph, ENDPOINTS } from '../service'
import { actionTypes, Action } from '../reducer'

async function doFetchMesasges(dispatch: Dispatch<Action>) {
  // TODO: Replace this interaction in future for big amounts of data
  dispatch({ type: actionTypes.FETCH_START })
  dispatch({ type: actionTypes.LOG, payload: 'Waiting for authorization...' })
  const { accessToken } = await authorize()
  dispatch({ type: actionTypes.LOG, payload: 'Authorized!' })
  const groups = await fetchMSGraph(ENDPOINTS.MEMBER_OF, accessToken)
  const groupIds = map(groups.value, 'id')
  dispatch({
    type: actionTypes.LOG,
    payload: `Fetched ${groupIds.length} teams`,
  })

  dispatch({ type: actionTypes.LOG, payload: 'Fetching channels...' })
  let channelIds: string[] = []
  await forEachPromise(groupIds, async groupId => {
    const channels = await fetchMSGraph(
      ENDPOINTS.CHANNELS(groupId),
      accessToken,
    )
    if (!channels || isEmpty(channels.value)) {
      return
    }
    const newChannelIds: string[] = map(channels.value, 'id')
    channelIds = [...channelIds, ...newChannelIds]
    dispatch({
      type: actionTypes.LOG,
      payload: `Fetched ${newChannelIds.length} channels`,
    })
  })
  dispatch({
    type: actionTypes.LOG,
    payload: `Successfully fetched ${channelIds.length} channels!`,
  })

  dispatch({ type: actionTypes.LOG, payload: 'Fetching messages...' })
  await forEachPromise(groupIds, async groupId => {
    await forEachPromise(channelIds, async channelId => {
      const messages = await fetchMSGraph(
        ENDPOINTS.CHANNEL_MESSAGES(groupId, channelId),
        accessToken,
      )
      if (!messages || isEmpty(messages.value)) {
        return
      }
      const messagesData = map(messages.value, message => ({
        id: message.id,
        userId: get(message, 'from.user.id'),
        displayName: get(message, 'from.user.displayName'),
        mentions: map(message.mentions, mention => ({
          id: mention.id,
          userId: get(message, 'mentioned.user.id'),
          displayName: get(message, 'mentioned.user.displayName'),
        })),
      }))
      dispatch({
        type: actionTypes.NEW_MESSAGES,
        payload: messagesData,
      })
      dispatch({
        type: actionTypes.LOG,
        payload: `Fetched ${messages.value.length} messages`,
      })
    })
  })

  dispatch({ type: actionTypes.FETCH_SUCCESS })
}

export default async function fetchMessages(dispatch: Dispatch<Action>) {
  try {
    await doFetchMesasges(dispatch)
  } catch (error) {
    console.error(error)
    dispatch({ type: actionTypes.ERROR, error })
  }
}
