const fs = require('fs')
const downloader = require('./downloader')
const { queue } = require('./playlist-manager')

// 5 seconds
const TIME_TO_DELETE_MESSAGE_AFTER_SENT = 5 * 1000

const replyAndDelayedDelete = async (ctx, content) => {
  // TODO: add a proper logger to avoid losing the history of calls
  // maybe it could log the username and the message
  const { message_id: messageId } = await ctx.reply(content)

  setTimeout(() => {
    // Delete original message
    ctx.deleteMessage(messageId)

    // Delete user command message
    ctx.deleteMessage(ctx.update.message.message_id)
  }, TIME_TO_DELETE_MESSAGE_AFTER_SENT)
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
    const { message_id: msgId } = await ctx.reply('Hold on...')
    await ctx.reply(await queue())
    ctx.deleteMessage(msgId)
  },

  async '/nowplaying' (ctx) {
    const { message_id: msgId } = await ctx.reply('Hold on...')
    ctx.reply(await queue(true))
    ctx.deleteMessage(msgId)
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
