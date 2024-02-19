import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { PinoWebpackPlugin } = require("pino-webpack-plugin");

const pinoTransports =
  process.env.NODE_ENV === "development"
    ? ["pino-pretty", "pino-logdna"]
    : ["pino-logdna"];

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),
  new webpack.EnvironmentPlugin([
    "APP_BUNDLE_ID",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "MEZMO_API_KEY",
    "AMPLITUDE_API_KEY",
  ]),
  new CopyWebpackPlugin({
    patterns: [{ from: path.join(__dirname, "images"), to: "images" }],
  }),
  new PinoWebpackPlugin({ transports: pinoTransports }),
];
