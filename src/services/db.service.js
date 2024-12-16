import logger from '../config/logger';
import { ApiError, toCamelCase } from '@fullhex/utils-js';
import config from 'config';
import moment from 'moment';
import { Pool, types } from 'pg';
import { migrate } from 'postgres-schema-migrations';

// Configure overrides on Postgres serialization between PG and Node.js
// Always convert timestamps into millisecond timestamps
var parseFn = function (val) {
    return val === null ? null : moment(val).valueOf();
};
types.setTypeParser(types.builtins.TIMESTAMPTZ, parseFn);
types.setTypeParser(types.builtins.TIMESTAMP, parseFn);

/**
 * DbService
 * Manages a connection and common database operations to Postgres.
 * Automatically runs database migrations when the service starts.
 */
class DbService {
    constructor() {
        this.connected = false;
        this.clientPool = null;

        this.postgresHost = config.get('postgres.host');
        this.postgresPort = config.get('postgres.port');
        this.postgresDb = config.get('postgres.database');
        this.postgresUsername = config.get('postgres.username');
        this.postgresPassword = config.get('postgres.password');
        this.clientPoolSize = config.get('postgres.clientPoolSize');
        this.enabled = config.get('postgres.enabled');
        this.logQueries = config.get('postgres.logQueries');
        this.logQueryResults = config.get('postgres.logQueryResults');
        this.useSsl = config.get('postgres.ssl');

        // Don't instantiate the database connection in the test environment.
        // This requires unit tests to manually mock any database requests.
        this.isTestEnvironment = process.env.NODE_ENV === 'test';
    }

    async connect(isTest = false) {
        if (this.connected) {
            return;
        }

        // If we are in a test environment, don't actually connect, setup a mock database
        if (this.isTestEnvironment || isTest || !this.enabled) {
            this.isTestEnvironment = true;
            return;
        }

        try {
            // Create a Postgres connection pool
            this.clientPool = new Pool({
                host: this.postgresHost,
                port: this.postgresPort,
                database: this.postgresDb,
                user: this.postgresUsername,
                password: this.postgresPassword,
                max: this.clientPoolSize,
                ssl: this.useSsl
                    ? {
                        rejectUnauthorized: false,
                    }
                    : false,
                application_name: 'vector-charts-portal-backend',
            });

            // Register some callbacks so we get debugging information if the clients disconnect
            this.clientPool.on('connect', () => {
                //logger.debug('Client added to the Postgres connection pool.');
            });

            this.clientPool.on('error', (err) => {
                logger.error(`Client in Postgres connection pool disconnected with an error: ${err.message}`.e);
            });

            this.clientPool.on('remove', () => {
                //logger.debug('Client removed from the Postgres connection pool.');
            });

            this.connected = true;
        } catch (e) {
            this.connected = false;
            logger.error('Failed to connect to Postgres server!', e);
        }

        // Migrate the tables on startup.
        await this.migrate();
    }

    async disconnect() {
        if (this.connected) {
            logger.info('Shutting down Postgres client.');
            this.connected = false;
        }
    }

    // Shortcut interface to run a query in the connection pool.
    // Returns the list of query results, or null if none are received.
    async query(statement, data) {
        try {
            if (this.isTestEnvironment) {
                logger.debug(`Mock SQL query: ${statement}`);
            } else {
                if (!this.connected) {
                    logger.warn(`Postgres client not connected, cannot execute query [statement = ${statement}]`);
                    return;
                }
                if (this.logQueries) {
                    logger.debug(`${statement} ${JSON.stringify(data || [])}`);
                }
                const queryResponse = await this.clientPool.query(statement, data);
                const rows = toCamelCase(queryResponse.rows);
                if (this.logQueryResults) {
                    logger.debug(JSON.stringify(rows, null, 4));
                }
                return rows;
            }
        } catch (e) {
            throw new ApiError(500, `Database error: ${e.message}`);
        }
    }

    // Query a single object. pulls the first object out of the list if one exists.
    async queryOne(statement, data) {
        const rows = await this.query(statement, data);
        if (rows.length > 0) {
            return rows[0];
        } else {
            return null;
        }
    }

    async migrate() {
        if (this.isTestEnvironment) {
            return;
        }
        // Check and run all migrations.
        this._migrateClient = await this.clientPool.connect();
        try {
            logger.info('Checking Postgres database migrations...');
            await migrate({ client: this._migrateClient }, './migrations', {
                schema: 'cloud',
            });
            logger.info('Postgres migration complete.');
        } finally {
            await this._migrateClient.release();
            this._migrateClient = null;
        }
    }
}

export default new DbService();
