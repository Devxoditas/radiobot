const icy = require('icy')
const mutag = require('mutag')
const fs = require('fs')
const _path = require('path')

const reader = async url => {
  const metadata = await new Promise(resolve => {
    icy.get(url, response => {
      response.on('metadata', async metadata => {
        const { StreamTitle: id } = icy.parse(metadata)
        const file = fs.readFileSync(_path.resolve(__dirname, '../', 'songs/', `${id}.mp3`))
        const tags = await mutag.fetch(file)
        resolve({ id, artist: tags.TPE1, title: tags.TIT2 })
      })
    })
  })
  console.log(metadata)
  return metadata
}

reader(process.env.ICE_URL)
