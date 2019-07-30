const Router = require('koa-router')

const { getMailBoxes, getMailBox } = require('./mailboxes')
const { getMessages } = require('./messages')

const router = new Router()

router.get('/mailboxes', getMailBoxes)
router.get('/mailbox', getMailBox)
router.get('/messages', getMessages)

router.get('/health', ctx => {
  ctx.body = null
})

module.exports = router
