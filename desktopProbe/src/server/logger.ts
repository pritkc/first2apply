import { pino } from "pino";
import { ENV } from "../env";

export const logger = pino({
  ...(ENV.nodeEnv === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  }),
});
