import { pino } from "pino";
import "pino-logdna";
import { ENV } from "../env";

const transports = [];
if (ENV.nodeEnv === "development") {
  transports.push({
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  });
}
if (ENV.mezmoApiKey) {
  transports.push({
    target: "pino-logdna",
    options: {
      key: ENV.mezmoApiKey,
    },
  });
}

export const logger = pino(
  pino.transport({
    targets: transports,
  })
);
logger.setBindings({
  platform: process.platform,
  arch: process.arch,
});

export function flushLogger() {
  return new Promise((resolve) => {
    logger.flush(resolve);
  });
}
