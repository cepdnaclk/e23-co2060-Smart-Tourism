const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({ error: 'Server authentication is not configured' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: Number(payload.userId),
            email: payload.email,
            role: payload.role
        };

        if (!Number.isInteger(req.user.id) || !req.user.role) {
            return res.status(401).json({ error: 'Invalid authentication token' });
        }

        next();
    } catch (error) {
        const message = error.name === 'TokenExpiredError'
            ? 'Authentication token has expired'
            : 'Invalid authentication token';
        return res.status(401).json({ error: message });
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'You do not have permission to perform this action' });
        }
        next();
    };
}

function requireSelf(paramName, { allowAdmin = true } = {}) {
    return (req, res, next) => {
        if (allowAdmin && req.user?.role === 'admin') {
            return next();
        }

        const requestedUserId = Number(req.params[paramName]);
        if (!req.user || requestedUserId !== req.user.id) {
            return res.status(403).json({ error: 'You can only access your own account data' });
        }
        next();
    };
}

module.exports = { authenticate, requireRole, requireSelf };
