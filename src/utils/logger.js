const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

// Formato personalizado
const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    errors({ stack: true }), // Captura stack traces de errores
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(), // Añade colores a los niveles (info, error, etc.)
    customFormat
  ),
  transports: [
    new transports.Console()
  ]
});

module.exports = logger;
