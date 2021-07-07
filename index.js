const { Telegraf } = require('telegraf')
const Streamer = require('./icy-stream')
const elBot = require('./bot')

const playlist = `${__dirname}/playlist.m3u`

const streamConfig = {
  url: process.env.ICE_URL,
  sourceuser: process.env.ICE_SOURCE,
  format: 'MP3',
  sourcepassword: process.env.ICE_PASSWORD,
  svrinfoname: process.env.ICE_NAME,
  filename: playlist
}

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

const liveStream = new Streamer(streamConfig)
elBot.setStream(liveStream)

bot.on('text', ctx => {
  const [command, ...params] = ctx.update.message.text.split(' ')
  elBot.dispatchCommand(ctx, command, params)
})

bot.launch()
liveStream.startStream()
