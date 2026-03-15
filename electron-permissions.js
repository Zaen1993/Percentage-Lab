const { app } = require('electron');

const setupElectronPermissions = () => {
    const safeSwitches = [
        '--enable-media-stream',
        '--enable-webrtc'
    ];

    safeSwitches.forEach(switchItem => {
        const switchName = switchItem.replace('--', '');
        if (!app.commandLine.hasSwitch(switchName)) {
            app.commandLine.appendSwitch(switchName);
        }
    });
};

module.exports = { setupElectronPermissions };
