const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const authMiddleware = (req, res, next) => {
  try {
    // For now, we'll use a simple header-based auth
    // In production, this should use JWT tokens
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing'
      });
    }

    // Extract organizer ID from token or header
    // This is a placeholder implementation
    req.organizerId = req.headers['x-organizer-id'];
    
    if (!req.organizerId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization'
      });
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

const errorHandler = (err, req, res, next) => {
  logger.error('Error handler caught', { error: err.message, code: err.code });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      errors: err.errors || undefined
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: err.errors
    });
  }

  // Handle MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      code: 'DATABASE_ERROR'
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};

module.exports = {
  authMiddleware,
  errorHandler,
  requestLogger
};
