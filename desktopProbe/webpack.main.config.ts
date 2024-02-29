import type { Configuration, PathData, AssetInfo } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

const { PinoWebpackPlugin } = require("pino-webpack-plugin");

const pinoTransports =
  process.env.NODE_ENV === "development"
    ? ["pino-pretty", "pino-logdna"]
    : ["pino-logdna"];

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/index.ts",
  output: {
    filename: (pathData: PathData, assetInfo?: AssetInfo) => {
      if (
        pathData.chunk?.name?.includes("pino") ||
        pathData.chunk?.name?.includes("thread-stream")
      ) {
        return "[name].js";
      }

      return "index.js";
    },
  },
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [new PinoWebpackPlugin({ transports: pinoTransports }), ...plugins],
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
  },
};
