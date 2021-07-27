const downloader = require('./downloader')
const { queue, skipper, deleter, getSongAt } = require('./playlist-manager')

const MESSAGE_TTL = 5 // in seconds
const TITLE_UPDATE_TTL = 10 // in seconds
const COPYRIGHT_TTL = 60 // in seconds
let lastInteraction = 0

const delayedDelete = (ctx, ids) => {
  ids.forEach(id => {
    ctx.deleteMessage(id)
  })
}

const replyAndDelayedDelete = ctx => async content => {
  const { update: { message: { message_id: userMessage } } } = ctx
  const { message_id: botMessage } = await ctx.reply(content)
  setTimeout(() => {
    delayedDelete(ctx, [botMessage, userMessage])
  }, MESSAGE_TTL * 1000)
}

const notifyAndDelayedDelete = ctx => async (original, replacement) => {
  const { message_id: msgId, chat: { id: chatId } } = original
  const { update: { message: { message_id: userMessage } } } = ctx
  ctx.telegram.editMessageText(chatId, msgId, undefined, replacement)
  setTimeout(() => {
    delayedDelete(ctx, [msgId, userMessage])
  }, MESSAGE_TTL * 1000)
}

const tryUpdateTitle = async (ctx, force = false) => {
  const now = new Date().getTime()
  lastInteraction = force ? 0 : lastInteraction
  if (now - lastInteraction < TITLE_UPDATE_TTL * 1000) return
  lastInteraction = now
  const message = await queue(true)
  return ctx.setChatTitle(`DEVxoditas ${message}`)
    .catch(_err => {
      // console.error('[ERROR] Cannot update title')
    })
}

const commands = {
  '/skipsong' (ctx, response = false) {
    elBot.liveStream.nextSong()
    if (response) ctx.notifyMessage('Skipping')
  },

  async '/skipto' (ctx, [index]) {
    if (!index || ~~index <= 0) return ctx.notifyMessage('Pa donde papaw?')
    ctx.notifyMessage(`Skipping ${index} songs ahead`)
    await skipper(~~index)
    commands['/flush'](ctx, false)
    commands['/skipsong'](ctx, false)
  },

  async '/deletesong' (ctx, [index]) {
    if (!index || ~~index <= 0) return ctx.notifyMessage('Cuál papaw?')
    ctx.notifyMessage('Deleting song from playlist')
    await deleter(~~index)
    commands['/flush'](ctx, false)
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
    const original = await ctx.reply('Hold on...')
    const message = await queue(false, page)
    ctx.editAndNotify(original, message)
  },

  async '/nowplaying' (ctx) {
    const original = await ctx.reply('Hold on...')
    const message = await queue(true)
    ctx.editAndNotify(original, message)
    tryUpdateTitle(ctx, true)
  },

  '/link' (ctx) {
    const linkMessage = [
      'DEVxoditas: http://clients2.zentenoit.com:8000/devxoditas',
      'Guaracha: http://clients2.zentenoit.com:8000/guaracha'
    ]
    ctx.notifyMessage(linkMessage.join('\n'))
  },

  async '/getsong' (ctx, [index]) {
    if (!index || ~~index <= 0) return ctx.notifyMessage('Cuál papaw?')
    ctx.notifyMessage('Shhh')
    const song = await getSongAt(~~index)
    const { message_id: msgId } = await ctx.replyWithAudio({ source: song })
    setTimeout(() => {
      delayedDelete(ctx, [msgId])
    }, COPYRIGHT_TTL * 1000)
  },

  '/help' (ctx) {
    const helpMsg = [
      'Available commands:',
      '\n/help|/h',
      '  Shows this message.',
      '/addsong nameOfTheSongOryoutubeURL',
      '  Adds the song to the queue.',
      '  If not found, returns a failure message.',
      '/deletesong number',
      '  Deletes one song from the playlist',
      '  under the provided index',
      '/skipsong|/s',
      '  Plays next song in queue.',
      '/skipto number',
      '  Skips to desired song in queue',
      '/nowplaying|/np',
      '  Returns the current song playing.',
      '/queue|/q [page number]',
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

  '/s' (ctx, response) {
    return this['/skipsong'](ctx, response)
  },
  '/q' (ctx, response) {
    return this['/queue'](ctx, response)
  },
  '/h' (ctx, response) {
    return this['/help'](ctx, response)
  },
  '/np' (ctx, response) {
    return this['/nowplaying'](ctx, response)
  }
}

const elBot = {
  setStream (liveStream) {
    this.liveStream = liveStream
  },
  dispatchCommand (ctx, command, params) {
    tryUpdateTitle(ctx)
    ctx.notifyMessage = replyAndDelayedDelete(ctx)
    ctx.editAndNotify = notifyAndDelayedDelete(ctx)
    const botUsername = ctx.botInfo.username.toLowerCase()
    const cmd = command.toLowerCase().replace(`@${botUsername}`, '')
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
