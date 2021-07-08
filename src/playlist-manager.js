const icy = require('icy')
const mutag = require('mutag')
const fs = require('fs')
const _path = require('path')
const metadater = require('./metadater')

const songsPath = _path.join(__dirname, '../songs/')
const playlist = _path.resolve(__dirname, '../playlist.m3u')

const tagGetter = filePath => {
  const file = fs.readFileSync(filePath)
  const videoId = _path.basename(filePath, '.mp3')
  return mutag.fetch(file)
    .catch(err => {
      console.log('[INFO] file does not have MP3 tags getting them')
      return metadater(filePath).then(result => {
        return tagGetter(filePath)
      })
    })
    .then(({TPE1, TIT2}) => ({
      id: videoId , Artist: TPE1, Title: TIT2
    }))
}

const nowPlaying = async _ => {
  const id = await new Promise(resolve => {
    icy.get(process.env.ICE_URL, response => {
      response.on('metadata', async metadata => {
        const { StreamTitle: id } = icy.parse(metadata)
        resolve(id)
      })
    })
  })
  return id
}

const queueMaker = async _ => {
  const pl = fs.readFileSync(playlist, 'utf8')
  const [, ...songs] = pl.split('\n').filter(line => line !== '')
  const songsPromises = songs.map(tagGetter)
  const songList = await Promise.all(songsPromises)
  const np = await nowPlaying()
  const position = songList.map(({ id }) => id).indexOf(np)
  const queue = [...songList.slice(position), ...songList.slice(0, position)]
    .map(({ Artist, Title }) => ({ Artist, Title }))
  return queue
}

const queue = async (nowPlaying = false) => {
  const orderedQueue = (await queueMaker())
  let trimmedQueue = orderedQueue.slice(0, 1)
  if (!nowPlaying) trimmedQueue = orderedQueue.slice(1)
  trimmedQueue = trimmedQueue
    .map((song, index) => {
      return `${index + 1} ${song.Title} - ${song.Artist}`
    })
  if (trimmedQueue.length > 10) {
    const trimmedQueue2 = trimmedQueue.slice(0, 10)
    trimmedQueue2.push(`+ ${trimmedQueue.length - 10} more songs`)
    trimmedQueue = trimmedQueue2
  }
  return trimmedQueue.join('\n')
}

if (require.main === module) {
  queueMaker().then(console.log)
} else {
  module.exports = {
    queue
  }
}
