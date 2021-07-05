require('./logger')
const icyStreamer = require('icy-streamer')
const { Telegraf } = require('telegraf')
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

const liveStream = icyStreamer(streamConfig)
elBot.setStream(liveStream)


liveStream.nextSong = () => {
  console.log('[INFO]Skipping song')
  liveStream.Stream.kill('SIGUSR1')
}

const parseCommand = (ctx, cb) => {
  ctx.params = ctx.update.message.text.split(' ')
  cb(ctx)
}

bot.start(ctx => ctx.reply('Welcome, human. It is I, music bot player'))
bot.on('text', _ctx => parseCommand(_ctx, ctx => {
  const [command, ...params] = ctx.params
  elBot.dispatchCommand(ctx, command, params)
}))

liveStream.startStream()
bot.launch()

