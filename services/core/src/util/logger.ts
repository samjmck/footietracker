import * as winston from 'winston';

export const logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: `${process.cwd()}/logs/core.log`,
            handleExceptions: true,
            maxsize: 5242880, // 5MB
        }),
        new winston.transports.Console({
            handleExceptions: true,
        }),
    ],
    exitOnError: true,
});


