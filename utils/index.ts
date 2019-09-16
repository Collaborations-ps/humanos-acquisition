import addressparser from 'addressparser'

import get from 'lodash/get'
import find from 'lodash/find'

export function parseMessages(messages: [any]) {
  const parsedMessages = messages.reduce((acc, message) => {
    const params = message['body[header.fields (from to cc date)]'].split(
      '\r\n',
    )

    const parsed = {
      id: message['x-gm-msgid'],
      threadId: message['x-gm-thrid'],
      from: [],
      to: [],
      date: '',
      cc: [],
    }

    params.forEach((param: string) => {
      if (param.startsWith('From: ')) {
        parsed.from = addressparser(param.replace('From: ', ''))
      }
      if (param.startsWith('To: ')) {
        parsed.to = addressparser(param.replace('To: ', ''))
      }
      if (param.startsWith('Cc: ')) {
        parsed.cc = addressparser(param.replace('Cc: ', ''))
      }
      if (param.startsWith('Date: ')) {
        parsed.date = param.replace('Date: ', '')
      }
    })

    acc.push(parsed)

    return acc
  }, [])

  return parsedMessages
}

export function getAllMailboxPath(mailboxes: any) {
  if (mailboxes) {
    const gmail = find(
      get(mailboxes, 'children', []),
      mailbox => mailbox.name === '[Gmail]',
    )

    const allMailbox = find(
      get(gmail, 'children', []),
      mailbox => mailbox.specialUse === '\\All',
    )

    if (allMailbox) {
      return allMailbox.path
    }

    return null
  }

  return null
}

export function parseMailboxData(mailboxPath: string, mailboxData: any) {
  return {
    count: get(mailboxData, 'exists') as number,
    path: mailboxPath,
  }
}
