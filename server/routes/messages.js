const get = require('lodash/get')

const createImapClient = require('../services/imap')

async function getMessages(ctx) {
  const { client, error } = await createImapClient(
    get(ctx, 'query.email'),
    get(ctx, 'query.accessToken'),
  )

  if (!error && client) {
    const messages = await client.listMessages(
      get(ctx, 'query.mailbox', 'INBOX'),
      get(ctx, 'query.limit', '1:10'),
      ['(UID X-GM-THRID BODY.PEEK[HEADER.FIELDS (FROM TO CC Date)])'],
    )

    client.close()

    ctx.body = messages
  } else {
    ctx.body = { error }
  }
}

module.exports = { getMessages }
