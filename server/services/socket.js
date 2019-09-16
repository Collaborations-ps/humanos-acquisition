const pick = require('lodash/pick')

const createImapClient = require('./imap')

function createSocket(io) {
  io.on('connection', async function connection(socket) {
    const { accessToken, email } = pick(socket.handshake.query, [
      'accessToken',
      'email',
    ])

    if (!accessToken || !email) {
      socket.disconnect()
    }

    const { client, error } = await createImapClient(email, accessToken)

    if (error) {
      socket.disconnect()
    } else {
      socket.emit('imapConnected', { success: true })
    }

    socket.on('getMailboxes', async fn => {
      // Fetch all mailboxes from IMAP
      const mailBoxes = await client.listMailboxes()

      fn(mailBoxes)
    })

    socket.on('getMailbox', async (mailbox, fn) => {
      // Get mailbox info from IMAP
      const mailboxInfo = await client.selectMailbox(mailbox)

      fn(mailboxInfo)
    })

    socket.on('getMessages', async (mailbox, start, end, fn) => {
      const limit = start && end ? `${start}:${end}` : '1:10'

      // Fetch messages meta from IMAP
      const messages = await client.listMessages(mailbox || 'INBOX', limit, [
        '(UID X-GM-THRID X-GM-MSGID BODY.PEEK[HEADER.FIELDS (FROM TO CC Date)])',
      ])

      fn(messages)
    })

    socket.on('disconnect', function disconnect() {
      if (client) {
        client.close()
      }
    })
  })
}

module.exports = createSocket
