const icy = require('icy')
const fs = require('fs')
const _path = require('path')
const metadater = require('./metadater')
const { exec } = require('child_process')

const playlist = _path.resolve(__dirname, '../playlist.m3u')

const mutag = filePath => {
  return new Promise((resolve, reject) => {
    exec(`ffprobe ${filePath}`, (_, stderr, stdout) => {
      const lines = stdout.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
      const metadataLocation = lines.indexOf('Metadata:')
      const metadata = lines.slice(metadataLocation, metadataLocation + 10)
        .filter(line =>
          line.includes('artist') || line.includes('title')
        )
        .map(line => line.split(':').map(itm => itm.trim()))
        .map(line => {
          const obj = {}
          obj[line[0]] = line[1]
          return obj
        })
        .reduce((acum, curr) => Object.assign(acum, curr), {})
      if (!metadata.title) return reject(new Error('Error on FFProbe'))
      resolve(metadata)
    })
  })
}

const tagGetter = async filePath => {
  const videoId = _path.basename(filePath, '.mp3')
  return mutag(filePath)
    .catch(_ => {
      console.log('[INFO] file does not have MP3 tags getting them', videoId)
      return metadater(filePath).then(result => {
        return tagGetter(filePath)
      })
    })
    .then(({ title, artist }) => {
      return {
        id: videoId, artist, title
      }
    })
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
    .map(({ artist, title }) => ({ artist, title }))
  return queue
}

const queue = async (nowPlaying = false) => {
  const orderedQueue = (await queueMaker())
  let trimmedQueue = orderedQueue.slice(0, 1)
  if (!nowPlaying) trimmedQueue = orderedQueue.slice(1)
  trimmedQueue = trimmedQueue
    .map((song, index) => {
      return `${index + 1} ${song.title} - ${song.artist}`
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
