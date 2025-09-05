// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

console.log('🔧 Preload script starting...');
console.log('🔧 Process type:', process.type);
console.log('🔧 Node version:', process.versions.node);
console.log('🔧 Electron version:', process.versions.electron);

const theme = process.argv[process.argv.length - 1];
console.log('🔧 Theme from argv:', theme);

// Check if ipcRenderer is available
if (!ipcRenderer) {
  console.error('❌ ipcRenderer is not available!');
} else {
  console.log('✅ ipcRenderer is available');
  console.log('✅ ipcRenderer.invoke exists:', typeof ipcRenderer.invoke);
}

// Check if contextBridge is available
if (!contextBridge) {
  console.error('❌ contextBridge is not available!');
} else {
  console.log('✅ contextBridge is available');
}

try {
  contextBridge.exposeInMainWorld('electron', {
    invoke: ipcRenderer.invoke,
    on: (channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
      console.log('🔧 Registering listener for channel:', channel);
      ipcRenderer.on(channel, callback);
    },
    theme,
  });
  
  console.log('✅ Successfully exposed electron APIs to renderer');
  console.log('✅ Exposed APIs:', Object.keys({ invoke: ipcRenderer.invoke, on: ipcRenderer.on, theme }));
} catch (error) {
  console.error('❌ Failed to expose electron APIs:', error);
}

console.log('🔧 Preload script finished');
