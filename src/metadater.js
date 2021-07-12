const ffmetadata = require('ffmetadata')
const ytdl = require('ytdl-core')
const path = require('path')

const metadater = async file => {
  const fullPath = path.resolve(file)
  const videoId = path.basename(file, '.mp3')
  const info = await ytdl.getInfo(videoId, { quality: 'highestaudio' })
  const result = await new Promise(resolve => {
    ffmetadata.write(
      fullPath,
      {
        artist: info.videoDetails.author.name.replace(' - Topic', ''),
        title: info.videoDetails.title
      },
      {
        'id3v2.3': true
      }, err => {
        if (err) return resolve(false)
        resolve(true)
      }
    )
  })
  console.log('[INFO] Metadata process', result)
}

if (require.main === module) {
  const [,, song] = process.argv
  metadater(song)
} else {
  module.exports = metadater
}
