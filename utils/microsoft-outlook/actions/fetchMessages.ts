import { Dispatch } from 'react'
import axios from 'axios'

import get from 'lodash/get'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'

import {
  Application,
  authorize,
  ENDPOINTS,
  fetchMSGraph,
  logout,
} from '../../../services/microsoft'

import api from '../../api'
import objToFile from '../../objToFile'

import { actionTypes, Action } from '../reducer'

const mapMessage = (message: any) => ({
  id: get(message, 'id'),
  date: get(message, 'createdDateTime'),
  from: [get(message, 'from.emailAddress')],
  to: map(get(message, 'toRecipients'), 'emailAddress'),
  cc: map(get(message, 'ccRecipients'), 'emailAddress'),
})

async function* messagesIterator(accessToken: string) {
  let url = ENDPOINTS.MESSAGES

  while (url) {
    // eslint-disable-next-line no-await-in-loop
    const messages = await fetchMSGraph(url, {
      accessToken,
      select: ['from', 'toRecipients', 'ccRecipients', 'createdDateTime'],
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

    dispatch({ type: actionTypes.SIGN_FILE_START })

    const file = objToFile(messages)

    const s3Data = await api.signOutlookPackage({
      name: file.name,
      contentType: 'application/json',
      size: file.size,
      email: me.userPrincipalName,
    })

    const s3Url = get(s3Data, 's3Url')
    const s3Id = get(s3Data, 'id')

    if (typeof s3Url === 'string') {
      dispatch({ type: actionTypes.UPLOAD_FILE_START })
      await axios.put(s3Url, file, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      dispatch({ type: actionTypes.NOTIFICATION_START })
      await api.sendOutlookNotification(s3Id, me.userPrincipalName)
    }

    await logout(Application.outlook)

    dispatch({ type: actionTypes.FETCH_SUCCESS })
  } catch (error) {
    console.error(error)
    dispatch({ type: actionTypes.ERROR, error })
  }
}
