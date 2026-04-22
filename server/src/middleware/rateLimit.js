function createRateLimiter({ windowMs, max }) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const key = String(req.rateLimitKey || req.ip || req.connection?.remoteAddress || "unknown");
    const now = Date.now();
    const windowStart = now - windowMs;

    const arr = hits.get(key) || [];
    const recent = arr.filter((t) => t > windowStart);
    recent.push(now);
    hits.set(key, recent);

    if (recent.length > max) {
      return res.status(429).json({ error: { message: "Too many requests. Try again later." } });
    }
    return next();
  };
}

module.exports = { createRateLimiter };
