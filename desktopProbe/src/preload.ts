// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer, contextBridge } from "electron";

const theme = process.argv[process.argv.length - 1];
contextBridge.exposeInMainWorld("electron", {
  invoke: ipcRenderer.invoke,
  theme,
});
