const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

let serverProcess;
const PORT = 3210;

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, res => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve();
        retry();
      });
      req.on('error', retry);
      req.setTimeout(1500, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) return reject(new Error('TreasuryFlow local server did not start'));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

function serverPath() {
  if (app.isPackaged) return path.join(process.resourcesPath, 'standalone', 'server.js');
  return path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
}

async function startServer() {
  const script = serverPath();
  serverProcess = spawn(process.execPath, [script], {
    cwd: path.dirname(script),
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      HOSTNAME: '127.0.0.1',
      PORT: String(PORT),
      TREASURYFLOW_DESKTOP_LOCAL: '1',
      BANK_ADAPTER_MODE: 'disabled'
    }
  });
  serverProcess.on('exit', code => {
    if (!app.isQuitting && code !== 0) console.error('TreasuryFlow server exited', code);
  });
  await waitForServer(`http://127.0.0.1:${PORT}/api/ready`);
}

async function createWindow() {
  await startServer();
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${PORT}`)) event.preventDefault();
  });
  await win.loadURL(`http://127.0.0.1:${PORT}`);
  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(createWindow).catch(err => {
  console.error(err);
  app.quit();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { app.isQuitting = true; if (serverProcess) serverProcess.kill(); });
