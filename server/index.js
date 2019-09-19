const Koa = require('koa')
const compress = require('koa-compress')
const Next = require('next')
const { createServer } = require('http')
const IO = require('socket.io')

const router = require('./routes')

const createSocket = require('./services/socket')
const Sentry = require('./services/sentry')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = Next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const koa = new Koa()
  const server = createServer(koa.callback())
  const io = IO(server)

  koa.use(compress())

  createSocket(io)

  router.get('*', async ctx => {
    await handle(ctx.req, ctx.res)
    ctx.respond = false
  })

  koa.use(async (ctx, next) => {
    ctx.res.statusCode = 200
    await next()
  })

  koa.use(router.routes())

  koa.on('error', err => {
    Sentry.captureException(err)
  })

  server
    .listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`)
    })
    .setTimeout(30 * 60 * 1000)
})
