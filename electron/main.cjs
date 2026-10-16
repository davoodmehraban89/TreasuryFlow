const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');
const { isExpectedReadiness } = require('./ready-check.cjs');

let serverProcess;
let serverStartError = null;
const PORT = 3210;

function probeReadiness(url) {
  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const req = http.get(url, res => {
      const parts = [];
      let bytes = 0;
      res.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > 4096) {
          req.destroy();
          finish(false);
        } else {
          parts.push(chunk);
        }
      });
      res.on('end', () => finish(isExpectedReadiness(res.statusCode, Buffer.concat(parts).toString('utf8'))));
      res.on('error', () => finish(false));
    });
    req.on('error', () => finish(false));
    req.setTimeout(1500, () => {
      req.destroy();
      finish(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (serverStartError || !serverProcess ||
        serverProcess.exitCode !== null || serverProcess.signalCode !== null) {
      throw new Error('TreasuryFlow local server exited before readiness');
    }
    if (await probeReadiness(url)) {
      if (serverStartError || serverProcess.exitCode !== null || serverProcess.signalCode !== null) {
        throw new Error('TreasuryFlow local server exited during readiness');
      }
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('TreasuryFlow local server did not reach authenticated application readiness');
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
  serverProcess.on('error', err => { serverStartError = err; });
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
