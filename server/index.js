const Koa = require('koa')
const compress = require('koa-compress')
const Next = require('next')
const { createServer } = require('http')
const IO = require('socket.io')
const pick = require('lodash/pick')

const router = require('./routes')

const createImapClient = require('./services/imap')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = Next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const koa = new Koa()
  const server = createServer(koa.callback())
  const io = IO(server)

  server.use(compress())

  router.get('*', async ctx => {
    await handle(ctx.req, ctx.res)
    ctx.respond = false
  })

  koa.use(async (ctx, next) => {
    ctx.res.statusCode = 200
    await next()
  })

  io.on('connection', async function connection(socket) {
    console.log('user connected')
    const { accessToken, email } = pick(socket.handshake.query, [
      'accessToken',
      'email',
    ])

    if (!accessToken || !email) {
      socket.disconnect()
    }

    const { client, error } = await createImapClient(email, accessToken)
    console.log('imap connection opened')

    if (error) {
      socket.disconnect()
    }

    socket.on('mailboxes', console.log)

    socket.on('disconnect', function disconnect() {
      console.log('user disconnected')
      if (client) {
        client.close()
        console.log('imap connection closed')
      }
    })
  })

  koa.use(router.routes())

  server
    .listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`)
    })
    .setTimeout(30 * 60 * 1000)
})
