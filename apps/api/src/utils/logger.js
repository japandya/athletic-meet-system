const fs = require('fs');
const path = require('path');
const config = require('../config/env');

// Create logs directory if it doesn't exist
const logsDir = path.dirname(config.logging.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLogLevel = logLevels[config.logging.level] || logLevels.info;

const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    logMessage += ` ${JSON.stringify(data, null, 2)}`;
  }
  
  return logMessage;
};

const writeToFile = (message) => {
  try {
    fs.appendFileSync(config.logging.logFile, message + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

const logger = {
  error: (message, data = null) => {
    if (currentLogLevel >= logLevels.error) {
      const formattedLog = formatLog('error', message, data);
      console.error(formattedLog);
      writeToFile(formattedLog);
    }
  },

  warn: (message, data = null) => {
    if (currentLogLevel >= logLevels.warn) {
      const formattedLog = formatLog('warn', message, data);
      console.warn(formattedLog);
      writeToFile(formattedLog);
    }
  },

  info: (message, data = null) => {
    if (currentLogLevel >= logLevels.info) {
      const formattedLog = formatLog('info', message, data);
      console.log(formattedLog);
      writeToFile(formattedLog);
    }
  },

  debug: (message, data = null) => {
    if (currentLogLevel >= logLevels.debug) {
      const formattedLog = formatLog('debug', message, data);
      console.debug(formattedLog);
      writeToFile(formattedLog);
    }
  }
};

module.exports = logger;
