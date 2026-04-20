import winston from "winston";

const format =
  process.env.LOG_FORMAT === "json"
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
          return `${timestamp} [${level}] ${message}${meta}`;
        })
      );

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format,
  transports: [new winston.transports.Console()],
});
