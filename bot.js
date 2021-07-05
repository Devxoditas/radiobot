const fs = require('fs')
const downloader = require('./downloader')

const commands = {
  '/skipsong' (ctx, response = false) {
    elBot.liveStream.nextSong()
    if (response) ctx.reply('Skipping')
  },

  '/addsong' (ctx, query) {
    ctx.reply('Looking for song')
    const song = query.join(' ')
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
