const xml2js = require('xml2js')
const fs = require('fs')
const { spawn, exec } = require('child_process')
const _path = require('path')

class Streamer {
  constructor (conf) {
    this.xmlFile = _path.resolve(__dirname, '../', 'ezstream-conf.xml')
    this.killerFile = _path.resolve(__dirname, 'killer.sh')
    const defaults = {
      url: 'http://localhost:8000/stream',
      sourceuser: 'source',
      format: 'MP3',
      sourcepassword: 'hackme',
      filename: _path.resolve(__dirname, '../', 'playlist.m3u'),
      svrinfoname: 'My Stream',
      svrinfourl: '',
      svrinfogenre: 'RockNRoll',
      svrinfodescription: 'This is a stream description',
      svrinfobitrate: 128,
      svrinfochannels: 2,
      svrinfosamplerate: 44100,
      svrinfopublic: 0
    }
    this.conf = Object.assign(JSON.parse(JSON.stringify(defaults)), conf)
    this.createConfigFile()
    if (!fs.existsSync(this.conf.filename)) this.resetPlaylist()
  }

  createConfigFile () {
    const builder = new xml2js.Builder()
    fs.writeFileSync(this.xmlFile, builder.buildObject(this.conf))
    console.log('[INFO] XML Config file created')
  }

  log (callback, type = 'data') {
    return data => {
      console.log('[INFO]', type, data.toString())
      callback(data.toString())
    }
  }

  async subProcess (command) {
    let sub
    const response = await new Promise(resolve => {
      sub = exec(command, (err, stdout) => {
        if (err) console.log('[ERROR]', err)
        this.log(resolve, command)(stdout)
      })
    })
    sub.kill()
    return response
  }

  async spyProcess () {
    console.log('[INFO] Getting PID')
    const pid = await new Promise(resolve => {
      exec('pidof ezstream', (err, stdout) => {
        if (err) {
          console.log('[INFO] No process currently running')
          return resolve(false)
        }
        return resolve(stdout.trim())
      })
    })
    if (pid) console.log(`[INFO] ezstream on PID ${pid}`)
    this.pid = pid
  }

  resetPlaylist () {
    fs.writeFileSync(this.conf.filename, '#EXTM3U\n')
  }

  addSong (filename) {
    fs.appendFileSync(this.conf.filename, filename + '\n')
    if (this.Stream) this.flushPlayList()
  }

  async nextSong () {
    console.log('[INFO] Skipping song')
    await this.spyProcess()
    if (!this.pid) return
    this.subProcess(`${this.killerFile} SIGUSR1 ${this.pid}`)
  }

  async flushPlayList () {
    console.log('[INFO] Flushing playlist')
    await this.spyProcess()
    if (!this.pid) return
    this.subProcess(`${this.killerFile} SIGHUP ${this.pid}`)
  }

  async killStream () {
    await this.spyProcess()
    if (!this.pid) return
    console.log(`[INFO] Killing process ${this.pid}`)
    await this.subProcess(`kill ${this.pid}`)
  }

  async startStream () {
    if (!fs.existsSync(this.conf.filename)) return
    const songs = fs.readFileSync(this.conf.filename, 'utf8').split('\n')
    if (songs.length < 3) return console.log('[INFO] No Songs in playlist')
    await this.killStream()
    this.Stream = spawn('ezstream', ['-c', this.xmlFile])
    await this.spyProcess()
  }
}

module.exports = Streamer
