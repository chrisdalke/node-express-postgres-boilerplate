import app from './app';
import logger from './config/logger';
import DbService from './services/db.service';
import config from 'config';
import http from 'http';

const httpPort = config.get('server.httpPort');
const environment = process.env.NODE_ENV || 'development';

// Write some debug configuration options on initialization
logger.debug('boilerplate API');
logger.debug(`Version: ${process.env.npm_package_version}`);
logger.debug(`Profile: ${environment}`);
logger.debug(`Server Port (HTTP): ${httpPort}\n`);

// Start server, setting up various error handlers
// Log when we receive a SIGTERM or SIGINT signal
let httpServer;

// Stop the server and shut down all services.
const exitHandler = async () => {
    try {
        if (httpServer) {
            httpServer.close(() => {
                logger.info('HTTP Server closed.');
            });
        }

        // Shut down all services here
        await DbService.disconnect();
        process.exit(0);
    } catch (e) {
        logger.warning('Failed to gracefully shutdown.');
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    exitHandler();
});
process.on('SIGINT', () => {
    logger.info('SIGINT received');
    exitHandler();
});

httpServer = http.createServer(app).listen(httpPort, async () => {
    logger.info(`boilerplate API (HTTP) started on Port ${httpPort}`);

    await DbService.connect();

    // Start services here
});
