const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET'
];

const checkRequiredEnvVars = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please check your .env file.`
    );
  }
};

const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'testing',

  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/athletic-meet-system',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/athletic-meet-system-test'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  // Authentication
  auth: {
    defaultUser: process.env.ORGANIZER_USER || 'organizer',
    defaultPassword: process.env.ORGANIZER_PASSWORD || 'meetdesk2026',
    setupKey: process.env.ORGANIZER_SETUP_KEY || 'SETUP2026'
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@athleticmeet.com'
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || './logs/app.log'
  },

  // API
  api: {
    version: process.env.API_VERSION || '1.0.0',
    title: process.env.API_TITLE || 'Athletic Meet System API',
    prefix: '/api/v1'
  }
};

// Validate required environment variables
if (config.isProduction) {
  checkRequiredEnvVars();
}

module.exports = config;
