const icy = require('icy')
const mutag = require('mutag')
const fs = require('fs')
const _path = require('path')
const metadater = require('./metadater')

const songsPath = _path.join(__dirname, '../songs/')

const tagGetter = filePath => {
  const file = fs.readFileSync(filePath)
  return mutag.fetch(file)
    .catch(err => {
      console.log('[INFO] file does not have MP3 tags getting them')
      return metadater(filePath).then(result => {
        return tagGetter(filePath)
      })
    })
}

const reader = async url => {
  const metadata = await new Promise(resolve => {
    icy.get(url, response => {
      response.on('metadata', async metadata => {
        const { StreamTitle: id } = icy.parse(metadata)
        const filePath = _path.resolve(songsPath, `${id}.mp3`)
        const tags = await tagGetter(filePath)
        resolve({ id, artist: tags.TPE1, title: tags.TIT2 })
      })
    })
  })
  console.log(metadata)
  return metadata
}

reader(process.env.ICE_URL)
