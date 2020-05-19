import React, { Fragment, useEffect, useReducer } from 'react'
import Router, { useRouter } from 'next/router'
import { Box, Button, Text } from 'rebass'

import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'

import forEachPromise from '../../utils/forEachPromise'

// import useHash from '../../hooks/useHash'
import { authorize } from './actions'
import { reducer, initialState, actionTypes } from './reducer'

import fetchMSGraph, { ENDPOINTS } from './fetchMSGraph'

export default function MicrosoftTeamsPage() {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    // TODO: Do we need something?
  }, [])

  const fetchMessages = async () => {
    try {
      dispatch({ type: actionTypes.FETCH_START })
      const { accessToken } = await authorize()
      const groups = await fetchMSGraph(ENDPOINTS.MEMBER_OF, accessToken)
      const groupIds = map(groups.value, 'id')
      console.log('Groups', groups)
      // TODO: Replace this interaction in future for big amounts of data
      await forEachPromise(groupIds, async groupId => {
        const channels = await fetchMSGraph(ENDPOINTS.CHANNELS(groupId), accessToken)
        console.log('Channels', channels)
        const channelIds = map(channels.value, 'id')
        await forEachPromise(channelIds, async channelId => {
          const messages = await fetchMSGraph(ENDPOINTS.CHANNEL_MESSAGES(groupId, channelId), accessToken)
          console.log('Messages', messages)
          dispatch({ type: actionTypes.NEW_MESSAGES, payload: messages.value })
        })
      })
      dispatch({ type: actionTypes.FETCH_SUCCESS })
    } catch (error) {
      dispatch({ type: actionTypes.ERROR, error })
    }
  }

  if (state.error) {
    return <Box>Error occured!</Box>
  }

  return (
    <Fragment>
      <Button
        bg="#449aff"
        color="#ffffff"
        mx={2}
        my={0}
        type="button"
        onClick={fetchMessages}
      >
        Fetch Messages
      </Button>
      <Text>{state.notice}</Text>
      {map(state.messages, message => (
        <Box key={message.id} sx={{ marginBottom: 2 }}>
          <Text>From:</Text>
          <Text>{get(message, 'from.user.displayName')}({get(message, 'from.user.id')})</Text>
          {!isEmpty(message.mentions) ? (
            <Fragment>
              <Text>Mentions:</Text>
              {map(message.mentions, mention => (
                <Box key={mention.id}>
                  <Text>{get(mention, 'mentioned.user.displayName')}({get(mention, 'mentioned.user.id')})</Text>
                </Box>
              ))}
            </Fragment>
          ) : null}
        </Box>
      ))}
    </Fragment>
  );
}
