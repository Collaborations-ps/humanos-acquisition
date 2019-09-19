const Router = require('koa-router')

const router = new Router()

router.get('/health', ctx => {
  ctx.body = { ok: true }
})

module.exports = router
