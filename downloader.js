const ytMusic = require('node-youtube-music').default
const Ytmp3 = require('youtube-mp3-downloader')
const Url = require('url')
const qs = require('querystring')
const fs = require('fs')

const directory = `${__dirname}/songs/`

const isCacheSong = id => {
  try {
    return fs.existsSync(`${directory}${id}`)
  } catch (_) {
    return false
  }
}

const getSong = async url => {
  let youtubeId = qs.parse(Url.parse(url).query).v
  if (!youtubeId) {
    const songs = await ytMusic.searchMusics(url)
    if (!songs.length) {
      return Promise.reject('Error: could not find song')
    }
    youtubeId = songs[0].youtubeId
  }

  const songFn = `${youtubeId}.mp3`

  if (isCacheSong(songFn)) {
    return Promise.resolve(`${directory}${songFn}`)
  }

  const p = new Promise((resolve, reject) => {
    const yt = new Ytmp3({
      outputPath: directory
    })
    yt.download(youtubeId, songFn)
    yt.on('finished', (err, response) => {
      if (err) return reject(err)
      resolve(`${directory}${songFn}`)
    })
    yt.on('error', _ => {
      reject('Cannot adquire song')
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
