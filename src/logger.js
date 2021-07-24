const https = require('https')
const token = process.env.PAPERTRAIL_AUTH
const environment = process.env.ENVIRONMENT
const devChannel = process.env.TELEGRAM_DEV_CHANNEL

const auth = Buffer.from(`:${token}`).toString('base64')
let bot

const options = {
  hostname: 'logs.collector.solarwinds.com',
  port: 443,
  path: '/v1/log',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    Authorization: `Basic ${auth}`
  }
}

const logger = data => {
  const opts = { ...options }
  opts.headers['Content-Length'] = data.length
  const req = https.request(options)
  req.write(data)
  req.end()
}

const sysLog = console.log
const sysError = console.error
console.log = (...args) => {
  sysLog(...args)
  if (!environment) return
  logger(args.join(' '))
}
console.error = (...args) => {
  sysError(...args)
  if (!environment) return
  logger(`[ERROR] ${JSON.stringify(args)}`)
  bot.telegram.sendMessage(devChannel, JSON.stringify(args))
}

module.exports = outterBot => {
  bot = outterBot
}
