const Ytmp3 = require('youtube-mp3-downloader')
const Url = require('url')
const qs = require('querystring')
const fs = require('fs')
const _path = require('path')
const metadater = require('./metadater')
const ytMusic = require('./searchSongs')

const directory = _path.join(__dirname, '../', 'songs/')

const isCacheSong = id => {
  try {
    return fs.existsSync(`${directory}${id}`)
  } catch (err) {
    console.error(err)
    return false
  }
}

const deleteTmpMsg = (tmpMsg, ctx) => {
  if (tmpMsg) {
    const { message_id: msgId } = tmpMsg
    ctx.deleteMessage(msgId)
  }
  return null
}

const getSong = async (url, ctx = false) => {
  let youtubeId = false
  try {
    youtubeId = qs.parse(new Url.URL(url).search)['?v']
  } catch (_) {
    // this catch is necesary
  }
  if (!youtubeId) {
    console.log('[INFO] no video id found, looking in youtube music')
    const songs = await ytMusic(url)
    if (!songs.length) {
      const errMsg = 'Error: could not find song'
      console.error(errMsg)
      return Promise.reject(errMsg)
    }
    youtubeId = songs[0]
  }

  const songFn = `${youtubeId}.mp3`

  if (isCacheSong(songFn)) {
    return Promise.resolve(`${directory}${songFn}`)
  }

  let tmpMsg
  if (ctx) tmpMsg = await ctx.reply('Looking...')

  const p = new Promise((resolve, reject) => {
    console.log('[INFO] Downloading', youtubeId)
    const yt = new Ytmp3({
      outputPath: directory
    })
    const reporter = {
      value: -10,
      time: new Date().getTime(),
      ttl: 5000
    }
    yt.download(youtubeId, songFn)
    yt.on('finished', (err, response) => {
      if (err) {
        console.error(err)
        tmpMsg = deleteTmpMsg(tmpMsg, ctx)
        return reject(err)
      }
      metadater(`${directory}${songFn}`).then(_ => {
        tmpMsg = deleteTmpMsg(tmpMsg, ctx)
        resolve(`${directory}${songFn}`)
      })
    })
    yt.on('error', error => {
      tmpMsg = deleteTmpMsg(tmpMsg, ctx)
      console.error(error)
      reject('Cannot adquire song') // eslint-disable-line
    })
    yt.on('progress', ({ progress }) => {
      if (tmpMsg) {
        const { message_id: msgId, chat: { id: chatId } } = tmpMsg
        const now = new Date().getTime()
        const process = ~~(~~progress.percentage / 5) * 5
        if (reporter.value === process) return
        if (now - reporter.time < reporter.ttl) return
        reporter.value = process
        ctx.telegram.editMessageText(
          chatId,
          msgId,
          undefined,
          `Adquiring ${reporter.value}%`
        )
      }
    })
  })
  return p
}

if (require.main === module) {
  const [,, ...input] = process.argv
  getSong(input.join(' '))
    .then(response => {
      console.log(response)
      process.exit(0)
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
} else {
  module.exports = getSong
}
