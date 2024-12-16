import passportCustom from 'passport-custom';
const CustomStrategy = passportCustom.Strategy;
import authService from '../../services/auth.service';

// Create a passport strategy that verifies a login token for requests where authentication
// has been turned on.
const AuthStrategy = new CustomStrategy(async (req, callback) => {
    try {
        const token = req.headers['authorization']?.replace('Bearer ', '') || null;
        if (!token) {
            return callback(null, false);
        }

        await authService.checkToken(token);

        // Inject token string into the request
        req.tokenString = token;
        req.user = {};

        callback(null, req.user);
    } catch (error) {
        callback(error, false);
    }
});

export default AuthStrategy;
