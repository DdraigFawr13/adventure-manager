// The desktop shell for the engine test (D-110): one 1366×768 window that loads the built
// engine-test page from disk. No Node in the page; saves and Steam come later (PLAN §11b).
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';

const page = fileURLToPath(new URL('../../ui/dist-engine-test/engine-test.html', import.meta.url));

function open(): void {
  const window = new BrowserWindow({
    width: 1366,
    height: 768,
    useContentSize: true,
    backgroundColor: '#2c1f16',
    title: 'Fenn March Engine Test',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window.setMenuBarVisibility(false);
  // Links never open inside the game window.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const tab = process.argv.find((arg) => arg.startsWith('--tab='))?.slice('--tab='.length);
  void window.loadFile(page, tab ? { query: { tab } } : {});
}

void app.whenReady().then(open);
app.on('window-all-closed', () => app.quit());
