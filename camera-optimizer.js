const CameraOptimizer = {
    currentStream: null,
    currentSettings: null,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

    async getOptimizedSettings() {
        const deviceInfo = await this.getDeviceInfo();
        return this.generateConstraints(deviceInfo);
    },

    async getDeviceInfo() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        return {
            isMobile: this.isMobile,
            isLowEnd: this.isLowEndDevice(),
            hasFrontCamera: videoDevices.some(device => device.label.toLowerCase().includes('front')),
            hasBackCamera: videoDevices.some(device => device.label.toLowerCase().includes('back')),
            deviceCount: videoDevices.length,
            screenWidth: screen.width * window.devicePixelRatio,
            screenHeight: screen.height * window.devicePixelRatio,
            memory: navigator.deviceMemory || 'unknown',
            cpuCores: navigator.hardwareConcurrency || 'unknown'
        };
    },

    isLowEndDevice() {
        const userAgent = navigator.userAgent;
        const isOldAndroid = /Android.*[0-3]\./.test(userAgent);
        const isOldIOS = /iOS.*[0-9]_[0-3]_/.test(userAgent);
        const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        return isOldAndroid || isOldIOS || lowMemory || lowCores;
    },

    generateConstraints(deviceInfo) {
        if (deviceInfo.isMobile) {
            if (deviceInfo.isLowEnd) {
                return {
                    video: {
                        width: { ideal: 320, max: 480 },
                        height: { ideal: 240, max: 320 },
                        frameRate: { ideal: 15, max: 20 },
                        facingMode: 'user',
                        aspectRatio: { ideal: 4 / 3 }
                    },
                    audio: false
                };
            } else {
                return {
                    video: {
                        width: { ideal: 640, max: 1280 },
                        height: { ideal: 480, max: 720 },
                        frameRate: { ideal: 24, max: 30 },
                        facingMode: 'user',
                        aspectRatio: { ideal: 16 / 9 }
                    },
                    audio: false
                };
            }
        } else {
            return {
                video: {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 },
                    facingMode: 'user',
                    aspectRatio: { ideal: 16 / 9 }
                },
                audio: false
            };
        }
    },

    async getCameraStream(constraints = null) {
        try {
            if (this.currentStream) this.stopCamera();
            const settings = constraints || await this.getOptimizedSettings();
            this.currentSettings = settings;
            const stream = await navigator.mediaDevices.getUserMedia(settings);
            this.currentStream = stream;
            return stream;
        } catch (error) {
            if (error.name === 'NotAllowedError') throw new Error('Camera permission denied');
            if (error.name === 'NotFoundError') throw new Error('No camera found');
            if (error.name === 'NotReadableError') throw new Error('Camera is already in use');
            throw error;
        }
    },

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    },

    async switchCamera() {
        if (!this.currentStream) return null;
        const currentFacingMode = this.currentSettings.video.facingMode || 'user';
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        const newSettings = {
            ...this.currentSettings,
            video: { ...this.currentSettings.video, facingMode: newFacingMode }
        };
        this.stopCamera();
        return await this.getCameraStream(newSettings);
    },

    async adjustQuality(quality = 'auto') {
        if (!this.currentStream) return null;
        const qualities = {
            low: { width: 320, height: 240, frameRate: 15 },
            medium: { width: 640, height: 480, frameRate: 24 },
            high: { width: 1280, height: 720, frameRate: 30 },
            auto: null
        };
        if (quality === 'auto') {
            const deviceInfo = await this.getDeviceInfo();
            quality = deviceInfo.isLowEnd ? 'low' : deviceInfo.isMobile ? 'medium' : 'high';
        }
        const newSettings = {
            video: {
                width: { ideal: qualities[quality].width },
                height: { ideal: qualities[quality].height },
                frameRate: { ideal: qualities[quality].frameRate },
                facingMode: this.currentSettings.video.facingMode || 'user'
            },
            audio: false
        };
        this.stopCamera();
        return await this.getCameraStream(newSettings);
    },

    getCurrentStreamInfo() {
        if (!this.currentStream) return null;
        const videoTrack = this.currentStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        return {
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            facingMode: settings.facingMode,
            deviceId: settings.deviceId,
            streamActive: videoTrack.readyState === 'live',
            trackLabel: videoTrack.label
        };
    },

    setupVideoElement(videoElement) {
        if (!videoElement) return null;
        videoElement.playsInline = true;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.setAttribute('webkit-playsinline', '');
        videoElement.setAttribute('x5-playsinline', '');
        videoElement.setAttribute('x5-video-player-type', 'h5');
        videoElement.setAttribute('x5-video-player-fullscreen', 'false');
        videoElement.style.transform = 'scaleX(-1)';
        videoElement.style.objectFit = 'cover';
        return videoElement;
    },

    enablePowerSavingMode() {
        if (!this.currentStream) return false;
        const videoTrack = this.currentStream.getVideoTracks()[0];
        if (videoTrack.applyConstraints) {
            videoTrack.applyConstraints({
                width: { ideal: 320 },
                height: { ideal: 240 },
                frameRate: { ideal: 15 }
            });
        }
        return true;
    },

    async checkCameraSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return { supported: false, reason: 'Browser does not support camera access' };
        }
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            if (!hasCamera) return { supported: false, reason: 'No camera found on device' };
            const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
            testStream.getTracks().forEach(track => track.stop());
            return { supported: true, deviceCount: devices.filter(d => d.kind === 'videoinput').length };
        } catch (error) {
            return { supported: false, reason: error.message };
        }
    }
};

export default CameraOptimizer;
