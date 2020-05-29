import { Dispatch } from 'react'

import get from 'lodash/get'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'

import {
  Application,
  authorize,
  ENDPOINTS,
  fetchMSGraph,
} from '../../../services/microsoft'

import { actionTypes, Action } from '../reducer'

const mapMessage = (message: any) => ({
  from: get(message, 'from.emailAddress'),
  toRecipients: map(get(message, 'toRecipients'), 'emailAddress'),
  ccRecipients: map(get(message, 'ccRecipients'), 'emailAddress'),
  bccRecipients: map(get(message, 'bccRecipients'), 'emailAddress'),
  createdDateTime: get(message, 'createdDateTime'),
})

async function* messagesIterator(accessToken: string) {
  let url = ENDPOINTS.MESSAGES

  while (url) {
    // eslint-disable-next-line no-await-in-loop
    const messages = await fetchMSGraph(url, {
      accessToken,
      select: [
        'from',
        'toRecipients',
        'ccRecipients',
        'bccRecipients',
        'createdDateTime',
      ],
    })
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
    if (!emails || isEmpty(emails)) {
      throw new Error('No emails')
    }
    dispatch({ type: actionTypes.AUTHORIZE_START })
    const { accessToken } = await authorize({
      application: Application.outlook,
      email: emails[0],
    })

    const me = await fetchMSGraph(ENDPOINTS.ME, {
      accessToken,
      select: ['userPrincipalName'],
    })

    if (!includes(emails, me.userPrincipalName)) {
      dispatch({ type: actionTypes.WRONG_EMAIL, payload: me.userPrincipalName })
      return
    }

    dispatch({ type: actionTypes.MESSAGES_FETCH_START })

    const messages: any[] = []
    const iterator = messagesIterator(accessToken)

    for await (const newMessages of iterator) {
      messages.push(...newMessages)
      dispatch({ type: actionTypes.NEW_MESSAGES, payload: newMessages.length })
    }

    console.log('MESSAGES', messages)

    dispatch({ type: actionTypes.FETCH_SUCCESS })
  } catch (error) {
    console.error(error)
    dispatch({ type: actionTypes.ERROR, error })
  }
}
