const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false
        },
        icon: path.join(__dirname, 'resources/desktop-icon.ico'),
        show: false,
        autoHideMenuBar: true,
        title: 'مختبر النسبة المئوية'
    });

    mainWindow.loadFile('الرئيسية.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.commandLine.appendSwitch('enable-media-stream');
app.commandLine.appendSwitch('enable-webrtc');

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
