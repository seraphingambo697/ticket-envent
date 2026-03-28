const winston = require('winston');
module.exports = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] [${level.toUpperCase()}] [user-service] ${message}`)
  ),
  transports: [new winston.transports.Console()],
});
