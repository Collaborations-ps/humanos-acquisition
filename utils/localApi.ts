import axios from 'axios'

import get from 'lodash/get'
import find from 'lodash/find'

export interface Mailbox {
  count: number
  path: string
}

function parseMailboxData(mailboxPath: string, mailboxData: any) {
  return {
    count: get(mailboxData, 'exists') as number,
    path: mailboxPath,
  }
}

function getAuth() {
  const googleData = sessionStorage.getItem('google')

  if (googleData) {
    return JSON.parse(googleData)
  }

  return false
}

async function getMailboxes() {
  const auth = getAuth()

  if (auth) {
    return axios.get('/mailboxes', {
      params: auth,
    })
  }

  return null
}

async function getMailbox(mailbox: string): Promise<Mailbox | null> {
  const auth = getAuth()

  if (auth) {
    const mailboxResponse = await axios.get('/mailbox', {
      params: { ...(auth || {}), mailbox },
    })

    if (mailboxResponse.data) {
      return parseMailboxData(mailbox, mailboxResponse.data)
    }

    return null
  }

  return null
}

async function getAllMailbox() {
  const mailboxes = await getMailboxes()

  if (mailboxes) {
    const gmail = find(
      get(mailboxes, 'data.children', []),
      mailbox => mailbox.name === '[Gmail]',
    )

    const allMailbox = find(
      get(gmail, 'children', []),
      mailbox => mailbox.specialUse === '\\All',
    )

    if (allMailbox) {
      return getMailbox(allMailbox.path)
    }

    return null
  }

  return null
}

export default {
  getMailbox,
  getMailboxes,
  getAllMailbox,
}
