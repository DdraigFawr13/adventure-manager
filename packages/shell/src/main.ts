// The desktop shell for the engine test (D-110): one 1366×768 window that loads the built
// engine-test page from disk. No Node in the page; saves and Steam come later (PLAN §11b).
import { app, BrowserWindow, session } from 'electron';
import { fileURLToPath } from 'node:url';

const page = fileURLToPath(new URL('../../ui/dist-engine-test/engine-test.html', import.meta.url));

function open(): void {
  const window = new BrowserWindow({
    width: 1366,
    height: 768,
    useContentSize: true,
    backgroundColor: '#2c1f16',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window.setMenuBarVisibility(false);
  // The page never leaves the game: no new windows, no navigation away from the loaded file.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  const tab = process.argv.find((arg) => arg.startsWith('--tab='))?.slice('--tab='.length);
  void window.loadFile(page, tab === 'ledger' || tab === 'map' ? { query: { tab } } : {});
}

void app.whenReady().then(() => {
  // The game asks for no device permissions (camera, location and the like).
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, answer) =>
    answer(false),
  );
  open();
});
app.on('window-all-closed', () => app.quit());
