const { verifyToken } = require('../utils/jwt');

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    try {
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.userId = decoded.userId;
        req.user = { userId: user._id.toString(), role: user.role, email: user.email };
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const roleMiddleware = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const User = require('../models/User');
            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

module.exports = { authMiddleware, roleMiddleware };
