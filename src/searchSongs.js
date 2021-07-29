const https = require('https')
const token = process.env.YOUTUBE_TOKEN
const param = process.env.YOUTUBE_PARAM

const options = {
  hostname: 'music.youtube.com',
  port: 443,
  path: `/youtubei/v1/search?alt=json&key=${token}`,
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept-Language': 'en',
    origin: 'https://music.youtube.com'
  }
}

const parseData = async body => {
  let contents
  try {
    contents = body.contents.tabbedSearchResultsRenderer.tabs[0]
      .tabRenderer.content.sectionListRenderer.contents[0]
      .musicShelfRenderer.contents
  } catch (e) {
    console.error('[ERROR] content structure is wrong')
    console.log(body)
    return []
  }
  return contents
    .map(content => {
      try {
        return content.musicResponsiveListItemRenderer.playlistItemData.videoId
      } catch (e) {
        return ''
      }
    })
    .filter(id => id !== '')
}

const post = query => {
  const p = new Promise(resolve => {
    const data = JSON.stringify({
      context: {
        capabilities: {},
        client: {
          clientName: 'WEB_REMIX',
          clientVersion: '0.1',
          hl: 'en',
          gl: 'GB'
        }
      },
      params: param,
      query: query.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    })
    const opts = { ...options }
    opts.headers['Content-Length'] = data.length
    const req = https.request(options, resp => {
      const chunks = []
      resp.on('data', chunk => {
        chunks.push(chunk)
      })
      resp.on('end', data => {
        const result = JSON.parse(chunks.join(''))
        resolve(parseData(result))
      })
    })
    req.on('error', e => {
      console.error(`ERROR, ${e}`)
      resolve([])
      console.log(e)
    })
    req.write(data)
    req.end()
  })
  return p
}

module.exports = post
