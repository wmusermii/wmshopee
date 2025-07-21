import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import path from "path";

// CommonJS-style __dirname support
const __dirname = path.resolve();

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

const transportConsole = new transports.Console();
const transportFile = new transports.DailyRotateFile({
  filename: path.join(__dirname, "logs/app-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "10m",
  maxFiles: "14d",
  zippedArchive: true,
});

const logger = createLogger({
  level: "info",
  format: logFormat,
  transports: [transportConsole, transportFile],
});

export const logInfo = (...args: any[]) =>
  logger.info(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '));
export const logWarn = (...args: any[]) =>
  logger.warn(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '));
export const logError = (...args: any[]) =>
  logger.error(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '));

export default logger;
