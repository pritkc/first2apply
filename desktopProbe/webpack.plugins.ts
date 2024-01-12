import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require(
  "fork-ts-checker-webpack-plugin",
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),
  new webpack.EnvironmentPlugin(["SUPABASE_URL", "SUPABASE_KEY"]),
];
