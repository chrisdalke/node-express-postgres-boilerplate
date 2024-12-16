import config from 'config';
import morgan from 'morgan';
import { createLogger, format, transports } from 'winston';

const showStackTraces = config.get('logging.showStackTraces');

// Configure Winston logging
const enumerateErrorFormat = format((info) => {
    return info;
});

const logger = createLogger({
    level: config.get('logging.level'),
    format: format.combine(
        enumerateErrorFormat(),
        config.get('logging.color') ? format.colorize() : format.uncolorize(),
        format.splat(),
        format.printf((info) => {
            const { level, message } = info;
            if (info instanceof Error && showStackTraces) {
                return `${level}: ${info.stack}`;
            }
            return `${level}: ${message}`;
        })
    ),
    transports: [
        new transports.Console({
            stderrLevels: ['error'],
        }),
    ],
});

// Configure Morgan HTTP logging
morgan.token('message', (req, res) => res.locals.errorMessage || '');

const environment = process.env.NODE_ENV || 'development';
const getIpFormat = () => (environment === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
    skip: (req, res) => res.statusCode >= 400,
    stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
    skip: (req, res) => res.statusCode < 400,
    stream: { write: (message) => logger.error(message.trim()) },
});

export default logger;
export { successHandler, errorHandler };
