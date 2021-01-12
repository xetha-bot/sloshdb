import fs from 'fs';
import path from 'path';
import moment from 'moment';
import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, prettyPrint, errors, printf } = winston.format;
const logPath = path.join(__dirname, '..', '..', '..', 'logs');

try {
    fs.unlinkSync(path.join(logPath, 'latest.log'));
    fs.unlinkSync(path.join(logPath, 'latest-error.log'));
} catch (e) { }

const Logger = winston.createLogger({
    level: 'info',
    format: combine(
        errors({ stack: true }),
        prettyPrint(),
        printf(({ level, message }) => {
            return `[${moment().format('YYYY-MM-DD HH:mm:ss')}] [${level.toUpperCase()}]: ${message}`;
        })
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(logPath, 'latest.log') }),
        new winston.transports.File({ filename: path.join(logPath, 'latest-error.log'), level: 'error' }),
        new winston.transports.DailyRotateFile({
            filename: path.join(logPath, '%DATE%.log'),
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new winston.transports.DailyRotateFile({
            level: 'error',
            filename: path.join(logPath, '%DATE%-error.log'),
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        }),
    ],
});

export default Logger;