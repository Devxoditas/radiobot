const winston = require('winston')
const logConfiguration = {
  transports: [
    new winston.transports.Console()
  ]
}
const logger = winston.createLogger(logConfiguration)

console.log = (...params) => logger.info(params)
console.error = (...params) => logger.error(params)
console.warn = (...params) => logger.warn(params)
