const icy = require('icy')
const fs = require('fs')
const _path = require('path')
const metadater = require('./metadater')
const { exec } = require('child_process')
const Brain = require('./brain')

const playlist = _path.resolve(__dirname, '../playlist.m3u')
const brain = new Brain()

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

const plReader = _ => {
  const pl = fs.readFileSync(playlist, 'utf8')
  const [, ...songs] = pl.split('\n').filter(line => line !== '')
  return songs
}

const queueMaker = async _ => {
  const brainQueue = brain.get('queue')
  if (brainQueue) return brainQueue
  console.log('[INFO] populating brain queue')
  const songs = plReader()
  const songsPromises = songs.map(tagGetter)
  const songList = await Promise.all(songsPromises)
  const np = await nowPlaying()
  const position = songList.map(({ id }) => id).indexOf(np)
  const queue = [...songList.slice(position), ...songList.slice(0, position)]
    .map(({ artist, title }) => ({ artist, title }))
  brain.set('queue', queue)
  return queue
}

const queue = async (nowPlaying = false, page = 1) => {
  const orderedQueue = await queueMaker()
  let trimmedQueue = orderedQueue.slice(0, 1)
  if (!nowPlaying) trimmedQueue = orderedQueue.slice(1)
  trimmedQueue = trimmedQueue
    .map((song, index) => {
      return `${index + 1} - ${song.title} - ${song.artist}`
    })
  if (trimmedQueue.length > 10) {
    const initial = (page - 1) * 10
    const end = page * 10
    const trimmedQueue2 = trimmedQueue.slice(initial, end)
    trimmedQueue2.push(`page ${page} of ${Math.ceil(trimmedQueue.length / 10)}`)
    trimmedQueue = trimmedQueue2
  }
  return trimmedQueue.join('\n')
}

const skipper = async skipSize => {
  const songs = plReader()
  const np = await nowPlaying()
  console.log('now playing', np)
  const position = songs
    .map(song => _path.basename(song, '.mp3'))
    .indexOf(np)
  const newHead = position + skipSize
  const newSongs = [songs[position], ...songs.slice(newHead), ...songs.slice(0, newHead)]
  newSongs.unshift('#EXTM3U')
  fs.writeFileSync(playlist, newSongs.join('\n'))
  setTimeout(() => {
    const trimmed = newSongs.slice(2)
    trimmed.unshift('#EXTM3U')
    fs.writeFileSync(playlist, trimmed.join('\n'))
  }, 2000)
}

if (require.main === module) {
  queueMaker().then(console.log)
} else {
  module.exports = {
    queue,
    skipper
  }
}
