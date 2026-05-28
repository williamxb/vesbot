import winston from 'winston';

// Determine if we are in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

const format = isDevelopment
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
            let msg = `[${timestamp}] ${level}: ${message}`;
            if (Object.keys(metadata).length > 0) {
                // Ignore empty metadata objects or splat arguments when printing simple logs
                const { splat, ...meta } = metadata;
                if (Object.keys(meta).length > 0) {
                    msg += ` ${JSON.stringify(meta)}`;
                }
            }
            return msg;
        })
    )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // Strict JSON for Promtail/Docker
    );

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format,
    transports: [
        new winston.transports.Console()
    ],
    // Catch unhandled exceptions and promise rejections
    exceptionHandlers: [
        new winston.transports.Console()
    ],
    rejectionHandlers: [
        new winston.transports.Console()
    ]
});

export default logger;
