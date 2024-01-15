import { Tray, Menu, nativeImage } from "electron";
import path from "path";

export class TrayMenu {
  private _tray: Tray;
  private _iconPath = "/images/tray_icon.png";

  constructor({
    onQuit,
    onNavigate,
  }: {
    onQuit: () => void;
    onNavigate: (_: { path: string }) => void;
  }) {
    const iconPath = path.join(__dirname, this._iconPath);
    console.log(`Tray icon path: ${iconPath}`);
    const image = nativeImage.createFromPath(iconPath);
    image.setTemplateImage(true);

    this._tray = new Tray(image);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Jobs",
        type: "normal",
        click: () => {
          onNavigate({ path: "/" });
        },
      },
      {
        label: "Sites",
        type: "normal",
        click: () => {
          onNavigate({ path: "/links" });
        },
      },
      {
        label: "Settings",
        type: "normal",
        click: () => {
          onNavigate({ path: "/settings" });
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        type: "normal",
        click: () => onQuit(),
      },
    ]);

    this._tray.setContextMenu(contextMenu);
    this._tray.setToolTip("First2Apply");
    console.log("Tray menu initialized");
  }

  /**
   * Destroy the tray menu.
   */
  close() {
    this._tray.destroy();
  }
}
