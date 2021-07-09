const fs = require('fs')
const downloader = require('./downloader')
const { queue } = require('./playlist-manager')

const commands = {
  '/skipsong' (ctx, response = false) {
    elBot.liveStream.nextSong()
    if (response) ctx.reply('Skipping')
  },

  async '/addsong' (ctx, query) {
    const song = query.join(' ')
    if (!song) return ctx.reply('¯\_(ツ)_/¯ seriously?')
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
    if (response) ctx.reply('Flusing Playlist')
    elBot.liveStream.flushPlayList()
  },

  '/startstream' (ctx) {
    ctx.reply('Stream started')
    elBot.liveStream.startStream()
  },

  '/stop' (ctx) {
    const clearPl = '#EXTM3U\n'
    fs.writeFileSync(elBot.liveStream.configuration.filename, clearPl)
    commands['/flush'](ctx, false)
    commands['/skipsong'](ctx, false)
    ctx.reply('Stopping stream')
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
    ctx.reply("Available commands:\n" +
      "\n/help \nShows this message.\n" +
      "\n/addsong nameOfTheSongORyoutubeURL \nAdds the song to the queue. " +
      "If not found, returns a failure message.\n" +
      "\n/skipsong \nPlays next song in queue.\n" +
      "\n/nowplaying \nReturns the current song playing.\n" +
      "\n/queue \nShows the next 10 songs information, plus the remaining"+
      " songs on queue.\n" +
      "\n/startstream \nTarts playing the songs in queue.\n" +
      "\n/flush \nClears the playlist.\n" +
      "\n/stop \nStops the music. Use wisely.\n")
  }
}

const elBot = {
  setStream(liveStream) {
    this.liveStream = liveStream
  },
  dispatchCommand(ctx, command, params) {
    const cmd = command.toLowerCase()
    if (commands[cmd])
      return commands[cmd](ctx, params)
    ctx.reply('What?')
  }
}

module.exports = elBot
