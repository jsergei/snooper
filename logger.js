const config = require('./config');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors } = format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
        format: combine(
            errors({ stack: true }),
            timestamp(),
        myFormat
    ),
    transports: [new transports.File({ filename: config.logFileName })]
});

module.exports = logger;
