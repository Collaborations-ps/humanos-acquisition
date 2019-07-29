const get = require('lodash/get')

const createImapClient = require('../services/imap')

async function getMailBoxes(ctx) {
  const { client, error } = await createImapClient(
    get(ctx, 'query.email'),
    get(ctx, 'query.accessToken'),
  )

  if (!error && client) {
    const allMailBoxes = await client.listMailboxes()

    client.close()

    ctx.body = allMailBoxes
  } else {
    ctx.body = { error }
  }
}

async function getMailBox(ctx) {
  const { client, error } = await createImapClient(
    get(ctx, 'query.email'),
    get(ctx, 'query.accessToken'),
  )

  if (!error && client) {
    const mailBoxInfo = await client.selectMailbox(
      get(ctx, 'query.mailbox', 'INBOX'),
    )

    client.close()

    ctx.body = mailBoxInfo
  } else {
    ctx.body = { error }
  }
}

module.exports = { getMailBoxes, getMailBox }
