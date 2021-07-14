class Brain {
  constructor () {
    this.memory = {}
    this.TTL = 12e4 // 2 minutes
  }

  set (key, value) {
    this.memory[key] = {
      validUntil: new Date().getTime() + this.TTL,
      value
    }
  }

  get (key) {
    const data = this.memory[key]
    if (data?.validUntil > new Date().getTime()) return data.value
    return false
  }

  del (key) {
    delete this.memory[key]
  }
}

module.exports = Brain
