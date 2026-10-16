// Small in-memory fixed-window rate limiter for the auth endpoints (no extra dependency).
// Best-effort only: on serverless platforms each instance keeps its own counters, so this slows down guessing
// rather than guaranteeing a global limit. Use a shared store (e.g. Redis) if you need a hard guarantee.
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 20, now = () => Date.now() } = {}) => {
    const hits = new Map();

    const middleware = (req, res, next) => {
        const key = req.ip || 'unknown';
        const time = now();
        const entry = hits.get(key);

        if (!entry || time - entry.start >= windowMs) {
            hits.set(key, { start: time, count: 1 });
        } else {
            entry.count += 1;
            if (entry.count > max) {
                res.set('Retry-After', String(Math.ceil((entry.start + windowMs - time) / 1000)));
                return res.status(429).json({ success: false, message: 'Too many attempts. Please try again later.' });
            }
        }

        // Keep the map from growing forever.
        if (hits.size > 5000) {
            for (const [k, v] of hits) if (time - v.start >= windowMs) hits.delete(k);
        }
        return next();
    };

    middleware.reset = () => hits.clear();
    return middleware;
};

module.exports = { createRateLimiter };
