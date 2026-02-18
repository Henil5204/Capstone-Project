// Simple request logger middleware
const logger = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
};

module.exports = logger;