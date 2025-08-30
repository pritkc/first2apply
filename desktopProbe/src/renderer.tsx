/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import './index.css';

import { createRoot } from 'react-dom/client';

import App from './app';

console.log('🎨 Renderer process starting...');
console.log('🎨 Checking for electron APIs...');

// Check if electron APIs are available
// @ts-ignore
if (window.electron) {
  console.log('✅ window.electron is available in renderer');
  // @ts-ignore
  console.log('✅ Available methods:', Object.keys(window.electron));
  // @ts-ignore
  console.log('✅ invoke method type:', typeof window.electron.invoke);
} else {
  console.error('❌ window.electron is NOT available in renderer!');
  console.error('❌ This will cause all API calls to fail!');
}

const container = document.getElementById('app') as HTMLElement;
if (!container) {
  console.error('❌ Could not find #app element in DOM!');
  throw new Error('App container not found');
}

const root = createRoot(container);
root.render(<App />);
