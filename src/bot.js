const fs = require('fs')
const downloader = require('./downloader')
const { queue } = require('./playlist-manager')

const MESSAGE_TTL = 5 // in seconds

const replyAndDelayedDelete = async (ctx, content) => {
  const { update: { message: { message_id: userMessage } } } = ctx
  const { message_id: botMessage } = await ctx.reply(content)
  setTimeout(() => {
    ctx.deleteMessage(botMessage)
    ctx.deleteMessage(userMessage)
  }, MESSAGE_TTL * 1000)
}

const commands = {
  '/skipsong' (ctx, response = false) {
    elBot.liveStream.nextSong()
    if (response) replyAndDelayedDelete(ctx, 'Skipping')
  },

  async '/addsong' (ctx, query) {
    const song = query.join(' ')
    if (!song) return replyAndDelayedDelete(ctx, '¯\\_(ツ)_/¯ seriously?')
    const { message_id: msgId } = await ctx.reply('Looking...')
    downloader(song)
      .then(filename => {
        elBot.liveStream.addSong(filename)
        ctx.reply('Song adquired and added to playlist')
        ctx.deleteMessage(msgId)
      })
      .catch(response => {
        ctx.reply(response)
      })
  },

  '/flush' (ctx, response = false) {
    if (response) replyAndDelayedDelete(ctx, 'Flusing Playlist')
    elBot.liveStream.flushPlayList()
  },

  '/startstream' (ctx) {
    replyAndDelayedDelete(ctx, 'Stream started')
    elBot.liveStream.startStream()
  },

  '/stop' (ctx) {
    const clearPl = '#EXTM3U\n'
    fs.writeFileSync(elBot.liveStream.configuration.filename, clearPl)
    commands['/flush'](ctx, false)
    commands['/skipsong'](ctx, false)
    replyAndDelayedDelete(ctx, 'Stopping stream')
  },

  async '/queue' (ctx) {
    const { message_id: msgId, chat: { id: chatId } } = await ctx.reply('Hold on...')
    ctx.telegram.editMessageText(chatId, msgId, undefined, await queue())
  },

  async '/nowplaying' (ctx) {
    const { message_id: msgId, chat: { id: chatId } } = await ctx.reply('Hold on...')
    ctx.telegram.editMessageText(chatId, msgId, undefined, await queue(true))
  },

  '/help' (ctx) {
    const helpMsg = [
      'Available commands:',
      '\n/Help',
      '  Shows this message.',
      '/addsong nameOfTheSongOryoutubeURL',
      '  Adds the song to the queue.',
      '  If not found, returns a failure message.',
      '/skipsong',
      '  Plays next song in queue.',
      '/nowplaying',
      '  Returns the current song playing.',
      '/queue',
      '  Shows the next 10 songs information',
      '  plus the remaining songs the queue.',
      '/startstream',
      '  Starts playing the songs in queue.',
      '/stop',
      '  Stops the music. Use wisely.'
    ]
    ctx.reply(helpMsg.join('\n'))
  }
}

const elBot = {
  setStream (liveStream) {
    this.liveStream = liveStream
  },
  dispatchCommand (ctx, command, params) {
    const cmd = command.toLowerCase()
    if (commands[cmd]) return commands[cmd](ctx, params)
    replyAndDelayedDelete(ctx, 'What?')
  }
}

module.exports = elBot
