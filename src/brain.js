class Brain {
  constructor () {
    this.memory = {}
    this.TTL = 12e4 // 2 minutes
  }

  set (key, value, expirable = false) {
    this.memory[key] = {
      expirable,
      validUntil: new Date().getTime() + this.TTL,
      value
    }
  }

  get (key) {
    const data = this.memory[key]
    if (!data) return false
    if (
      !data.expirable ||
      data.validUntil > new Date().getTime()
    ) return data.value
    return false
  }

  getAll (subsection) {
    return Object.keys(this.memory)
      .filter(name => name.slice(0, subsection.length) === subsection)
      .map(key => this.memory[key].value)
  }

  del (key) {
    delete this.memory[key]
  }
}

module.exports = Brain
