const ImapClient = require('emailjs-imap-client').default

async function createImapClient(user, xoauth2) {
  let client = null
  try {
    client = new ImapClient('imap.gmail.com', 993, {
      useSecureTransport: true,
      requireTLS: true,
      auth: {
        user,
        xoauth2,
      },
    })

    await client.connect()

    return { client, error: null }
  } catch (e) {
    if (client) {
      client.close()
    }
    return { error: e.message, client: null }
  }
}

module.exports = createImapClient
