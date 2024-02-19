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
      hostname: ENV.appBundleId.replace(/\./g, "-"),
      app: ENV.nodeEnv,
    },
  });
}

export const logger = pino({
  base: {
    hostname: ENV.appBundleId,
    platform: process.platform,
    arch: process.arch,
  },
  transport: {
    targets: transports,
  },
});

export function flushLogger() {
  return new Promise((resolve) => {
    logger.flush(resolve);
  });
}
