const fs = require('fs')
const downloader = require('./downloader')
const { queue } = require('./playlist-manager')

const commands = {
  '/skipsong' (ctx, response = false) {
    elBot.liveStream.nextSong()
    if (response) ctx.reply('Skipping')
  },

  '/addsong' (ctx, query) {
    const song = query.join(' ')
    if (!song) return ctx.reply('¯\_(ツ)_/¯ seriously?')
    ctx.reply('Looking...')
    downloader(song)
      .then(filename => {
        elBot.liveStream.addSong(filename)
        ctx.reply('Song adquired and added to playlist')
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
    ctx.reply(await queue())
  },

  async '/nowplaying' (ctx) {
    ctx.reply(await queue(true))
  }

}

const elBot = {
  setStream (liveStream) {
    this.liveStream = liveStream
  },
  dispatchCommand (ctx, command, params) {
    const cmd = command.toLowerCase()
    if (commands[cmd])
      return commands[cmd](ctx, params)
    ctx.reply('What?')
  }
}

module.exports = elBot
