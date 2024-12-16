import { ApiError } from '@fullhex/utils-js';
import { UNAUTHORIZED } from 'http-status';
import passport from 'passport';

// Middleware to check if a user is logged in.
// Decode the token and find corresponding user, which will be injected into the request.
// Does not support granular roles yet.
const auth = () => {
    return async (req, res, next) => {
        return new Promise((resolve, reject) => {
            passport.authenticate('custom', { session: false }, verifyCallback(req, resolve, reject))(req, res, next);
        })
            .then(() => next())
            .catch((err) => next(err));
    };
};

// Middleware to validate an auth token
// Injects a 'user' object into the request, and validates that the user has the correct permissions.
const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
    if (err) {
        return reject(new ApiError(UNAUTHORIZED, err.message));
    }
    if (err || info || !user) {
        return reject(new ApiError(UNAUTHORIZED, 'Authentication is required.'));
    }
    req.user = user;
    resolve(user);
};

export default auth;
