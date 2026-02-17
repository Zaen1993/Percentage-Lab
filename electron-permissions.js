const { session, app } = require('electron');

const setupElectronPermissions = () => {
    if (!session.defaultSession) return;
    
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(true);
    });
    
    session.defaultSession.setPermissionCheckHandler(() => true);

    const switches = [
        '--disable-features=PermissionsHeader',
        '--unsafely-treat-insecure-origin-as-secure=http://localhost,file://',
        '--allow-file-access-from-files',
        '--allow-file-access',
        '--allow-running-insecure-content',
        '--disable-web-security',
        '--enable-experimental-web-platform-features',
        '--enable-features=WebBluetooth,WebNfc,WebUsb',
        '--enable-media-stream',
        '--enable-webrtc',
        '--use-fake-ui-for-media-stream',
        '--ignore-certificate-errors',
        '--disable-site-isolation-trials',
        '--autoplay-policy=no-user-gesture-required',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling'
    ];
    
    switches.forEach(switchItem => {
        app.commandLine.appendSwitch(switchItem.replace('--', ''), switchItem.includes('=') ? switchItem.split('=')[1] : '');
    });
};

module.exports = { setupElectronPermissions };