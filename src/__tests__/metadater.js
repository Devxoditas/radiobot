const metadater = require('../metadater')
const ffmetadata = require('ffmetadata')
const ytdl = require('ytdl-core')
const path = require('path')

console.log = jest.fn(() => {})

jest.mock('ffmetadata', () => {
  return {
    write: jest.fn((fullpath, data, opts, callback) => {
      if (fullpath === '/error.mp3') return callback(new Error('true'))
      callback(null)
    })
  }
})

jest.mock('ytdl-core', () => {
  return {
    getInfo: jest.fn(async (videoId, opts) => {
      return {
        videoDetails: {
          author: {
            name: 'Author - Topic'
          },
          title: 'Title'
        }
      }
    })
  }
})

jest.mock('path', () => {
  return {
    resolve: jest.fn(file => file),
    basename: jest.fn((file, ext) => 'file')
  }
})

describe('Metadater', () => {
  it('should insert metadata into file', async () => {
    await metadater('/path/to/file.mp3')
    expect(ffmetadata.write)
      .toHaveBeenCalledWith(
        '/path/to/file.mp3',
        { artist: 'Author', title: 'Title' },
        { 'id3v2.3': true },
        expect.any(Function)
      )
    expect(ytdl.getInfo)
      .toHaveBeenCalledWith('file', { quality: 'highestaudio' })
    expect(path.resolve)
      .toHaveBeenCalledWith('/path/to/file.mp3')
    expect(path.basename)
      .toHaveBeenCalledWith('/path/to/file.mp3', '.mp3')
    expect(console.log)
      .toHaveBeenCalledWith('[INFO] Metadata process', true)
  })
  it('should handle error', async () => {
    await metadater('/error.mp3')
    expect(console.log)
      .toHaveBeenCalledWith('[INFO] Metadata process', false)
  })
})
