const downloader = require('./downloader')
const { queue, skipper } = require('./playlist-manager')

const MESSAGE_TTL = 5 // in seconds

const replyAndDelayedDelete = ctx => async content => {
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
    if (response) ctx.notifyMessage('Skipping')
  },

  async '/skipto' (ctx, [index]) {
    if (!index || ~~index <= 0) return ctx.notifyMessage('Pa donde papaw?')
    ctx.notifyMessage(`Skipping ${index} songs ahead`)
    await skipper(index)
    commands['/flush'](ctx, false)
    commands['/skipsong'](ctx, false)
  },

  async '/addsong' (ctx, query) {
    const song = query.join(' ')
    if (!song) return ctx.notifyMessage('¯\\_(ツ)_/¯ seriously?')
    downloader(song, ctx)
      .then(filename => {
        elBot.liveStream.addSong(filename)
        ctx.notifyMessage('Song adquired and added to playlist')
      })
      .catch(response => {
        ctx.reply(response)
      })
  },

  '/flush' (ctx, response = false) {
    if (response) ctx.notifyMessage('Flusing Playlist')
    elBot.liveStream.flushPlayList()
  },

  '/startstream' (ctx) {
    ctx.notifyMessage('Stream started')
    elBot.liveStream.startStream()
  },

  '/stop' (ctx) {
    elBot.liveStream.killStream()
    ctx.notifyMessage('Stopping stream')
  },

  async '/queue' (ctx, [page = 1]) {
    const { message_id: msgId, chat: { id: chatId } } = await ctx.reply('Hold on...')
    ctx.telegram.editMessageText(chatId, msgId, undefined, await queue(false, page))
  },

  async '/nowplaying' (ctx) {
    const { message_id: msgId, chat: { id: chatId } } = await ctx.reply('Hold on...')
    ctx.telegram.editMessageText(chatId, msgId, undefined, await queue(true))
  },

  '/help' (ctx) {
    const helpMsg = [
      'Available commands:',
      '\n/help',
      '  Shows this message.',
      '/addsong nameOfTheSongOryoutubeURL',
      '  Adds the song to the queue.',
      '  If not found, returns a failure message.',
      '/skipsong',
      '  Plays next song in queue.',
      '/skipto number',
      '  Skips to desired song in queue',
      '/nowplaying',
      '  Returns the current song playing.',
      '/queue [page number]',
      '  Shows the q\'ed songs paginated',
      '/startstream',
      '  Starts playing the songs in queue.',
      '/stop',
      '  Stops the music. Use wisely.',
      '/link',
      '  Shows URL to Radio Music'
    ]
    ctx.reply(helpMsg.join('\n'))
  },

  '/link' (ctx) {
    const linkMessage = [
      'DEVxoditas: http://clients2.zentenoit.com:8000/devxoditas',
      'Guaracha: http://clients2.zentenoit.com:8000/guaracha'
    ]
    ctx.notifyMessage(linkMessage.join('\n'))
  }
}

const elBot = {
  setStream (liveStream) {
    this.liveStream = liveStream
  },
  dispatchCommand (ctx, command, params) {
    ctx.notifyMessage = replyAndDelayedDelete(ctx)
    const cmd = command.toLowerCase()
    if (cmd[0] === '/') {
      if (commands[cmd]) return commands[cmd](ctx, params)
      ctx.notifyMessage('What?')
    }
    const msg = `${cmd} ${params.join(' ')}`.split(' ').join('')
    const pos = msg.toLowerCase().indexOf('softs')
    if (pos !== -1) ctx.reply('OHQUELA')
  }
}

module.exports = elBot
