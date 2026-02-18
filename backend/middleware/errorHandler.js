// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for dev
  if (process.env.NODE_ENV === "development") {
    console.error("🔥 Error:", err);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error.message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ success: false, message: error.message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return res.status(400).json({ success: false, message: error.message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join(", ");
    return res.status(400).json({ success: false, message: error.message });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ success: false, message: "Token has expired" });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};

module.exports = errorHandler;