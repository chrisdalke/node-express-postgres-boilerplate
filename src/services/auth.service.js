import logger from '../config/logger';
import Token from '../models/token';
import { ApiError } from '@fullhex/utils-js';
import crypto from 'crypto';
import httpStatus from 'http-status';

const NO_AUTH_MESSAGE = 'Authentication is required.';
const TOKEN_ERROR_MESSAGE = 'Invalid token.';

// Create and save a token.
const createToken = async () => {
    // Create a random token string
    const tokenString = crypto.randomBytes(16).toString('hex');

    // Save the token to the database
    const tokenDbObj = await Token.create({
        id: tokenString,
    });

    logger.debug(`Created new token: ${tokenString}`);
    return tokenDbObj;
};

// Check that a token is valid.
const checkToken = async (token) => {
    if (token === null || token === undefined) {
        throw new ApiError(httpStatus.UNAUTHORIZED, NO_AUTH_MESSAGE);
    }
    const tokenObj = await Token.getById(token);
    if (!tokenObj) {
        logger.error('Token is invalid!');
        throw new ApiError(httpStatus.UNAUTHORIZED, TOKEN_ERROR_MESSAGE);
    }

    return {
        token,
    };
};

// Delete a token
const deleteToken = async (tokenString) => {
    await Token.deleteById(tokenString);
};

export default { createToken, checkToken, deleteToken };
