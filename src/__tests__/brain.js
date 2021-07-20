const Brain = require('../brain')

describe('Brain processor', () => {
  it('Should create a new instance of Brain', () => {
    const brain = new Brain()
    expect(brain).toBeInstanceOf(Brain)
  })
  it('Should set and memory', () => {
    const brain = new Brain()
    const theValue = new Date().getTime()
    brain.set('key', theValue)
    expect(brain.memory.key).toEqual({
      expirable: false,
      validUntil: expect.any(Number),
      value: theValue
    })
    const value = brain.get('key')
    expect(value).toBe(theValue)
  })
  it('Should return all items that start with a prefix', () => {
    const brain = new Brain()
    const values = ['one', 'two', 'three', 'four']
    values.forEach(item => brain.set(`items.${item}`, item))
    const results = brain.getAll('items')
    expect(results).toEqual(values)
  })
  it('Should delete a memory entry', () => {
    const brain = new Brain()
    brain.set('key', 'value')
    expect(brain.get('key')).toBe('value')
    brain.del('key')
    expect(brain.get('key')).toBe(undefined)
  })
  it('Should expire element automatically', () => {
    const brain = new Brain()
    brain.TTL = 0
    brain.set('persistent', 'value')
    brain.set('expirable', 'value', true)
    expect(brain.get('persistent')).toBe('value')
    expect(brain.get('expirable')).toBe(undefined)
  })
})
