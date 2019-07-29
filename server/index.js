const Koa = require('koa')
const Next = require('next')
// const Router = require('koa-router')
// const ImapClient = require('emailjs-imap-client').default
// const mimelib = require('mimelib-noiconv')

const router = require('./routes')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = Next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = new Koa()

  /* router.get('/imap', async ctx => {
    console.log(ctx)
    const client = new ImapClient('imap.gmail.com', 993, {
      useSecureTransport: true,
      requireTLS: true,
      auth: {
        user: 'msnake.dubna@gmail.com',
        xoauth2:
          'ya29.GltUB4m1A1SGfcSowApHPYCfx9oUVshMBnZ2BS8FwDMfnMSrJZSv2XHa3QZZdGOyd_UA5rdz9oLNrw5owec0OUkRsvHdYtrVpLzb3yAe2R4fHodfG-bLtZYxzbgD',
      },
    })

    client.onerror = error => console.log(error.message)

    await client.connect()

    console.log(await client.listMailboxes())

    const messages = await client.listMessages('INBOX', '1:10', [
      '(UID X-GM-THRID BODY.PEEK[HEADER.FIELDS (FROM TO CC Date)])',
    ])

    console.log(messages)

    messages.reduce(async (acc, message) => {
      const params = message['body[header.fields (from to cc date)]'].split(
        '\r\n',
      )

      const parsed = {
        from: '',
        to: '',
        date: '',
        threadId: message['x-gm-thrid'],
        cc: '',
      }

      params.forEach(param => {
        if (param.startsWith('From: ')) {
          parsed.from = mimelib.parseAddresses(param.replace('From: ', ''))
        }
        if (param.startsWith('To: ')) {
          parsed.to = mimelib.parseAddresses(param.replace('To: ', ''))
        }
        if (param.startsWith('Cc: ')) {
          parsed.cc = mimelib.parseAddresses(param.replace('Cc: ', ''))
        }
        if (param.startsWith('Date: ')) {
          parsed.date = param.replace('Date: ', '')
        }
      })

      console.log(parsed)

      return acc
    }, new Map())

    client.close()
  }) */

  router.get('*', async ctx => {
    await handle(ctx.req, ctx.res)
    ctx.respond = false
  })

  server.use(async (ctx, next) => {
    ctx.res.statusCode = 200
    await next()
  })

  server.use(router.routes())
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
