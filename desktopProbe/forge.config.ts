import { config as loadEnvVars } from "dotenv";
import path from "path";
// load env vars
loadEnvVars({ path: path.join(__dirname, "..", "desktopProbe", ".env") });

import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, "packagers", "icons", "paper-plane"),
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      authors: "BeastX Industries",
      name: "f2a",
      setupIcon: path.join(__dirname, "packagers", "icons", "paper-plane.ico"),
    }),
    new MakerDMG({
      format: "ULFO",
      background: path.join(__dirname, "packagers", "macos-dmg-background.png"),
      additionalDMGOptions: {
        window: {
          size: {
            width: 658,
            height: 498,
          },
        },
      },
    }),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/index.html",
            js: "./src/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
      port: 3049,
    }),
  ],
};

export default config;
