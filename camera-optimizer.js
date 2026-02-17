// camera-optimizer.js
const CameraOptimizer = {
    currentStream: null,
    currentSettings: null,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    
    async getOptimizedSettings() {
        const deviceInfo = await this.getDeviceInfo();
        const constraints = this.generateConstraints(deviceInfo);
        
        console.log('📸 Camera settings:', constraints);
        return constraints;
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
                        aspectRatio: { ideal: 4/3 }
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
                        aspectRatio: { ideal: 16/9 }
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
                    aspectRatio: { ideal: 16/9 }
                },
                audio: false
            };
        }
    },
    
    async getCameraStream(constraints = null) {
        try {
            if (this.currentStream) {
                this.stopCamera();
            }
            
            const settings = constraints || await this.getOptimizedSettings();
            this.currentSettings = settings;
            
            const stream = await navigator.mediaDevices.getUserMedia(settings);
            this.currentStream = stream;
            
            console.log('✅ Camera stream started with settings:', settings);
            return stream;
        } catch (error) {
            console.error('❌ Camera error:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('تم رفض إذن الكاميرا');
            } else if (error.name === 'NotFoundError') {
                throw new Error('لم يتم العثور على كاميرا');
            } else if (error.name === 'NotReadableError') {
                throw new Error('الكاميرا قيد الاستخدام');
            } else {
                throw error;
            }
        }
    },
    
    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
            });
            this.currentStream = null;
            console.log('🛑 Camera stopped');
        }
    },
    
    async switchCamera() {
        if (!this.currentStream) return null;
        
        const currentSettings = this.currentSettings;
        const currentFacingMode = currentSettings.video.facingMode || 'user';
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        
        const newSettings = {
            ...currentSettings,
            video: {
                ...currentSettings.video,
                facingMode: newFacingMode
            }
        };
        
        this.stopCamera();
        return await this.getCameraStream(newSettings);
    },
    
    async adjustQuality(quality = 'auto') {
        if (!this.currentStream) return null;
        
        const qualities = {
            'low': { width: 320, height: 240, frameRate: 15 },
            'medium': { width: 640, height: 480, frameRate: 24 },
            'high': { width: 1280, height: 720, frameRate: 30 },
            'auto': null
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
    
    async testCameraPerformance() {
        if (!this.currentStream) return null;
        
        const startTime = performance.now();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const video = document.createElement('video');
        
        video.srcObject = this.currentStream;
        await video.play();
        
        canvas.width = 100;
        canvas.height = 75;
        
        const frames = 30;
        const frameTimes = [];
        
        for (let i = 0; i < frames; i++) {
            const frameStart = performance.now();
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frameTimes.push(performance.now() - frameStart);
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        video.pause();
        video.srcObject = null;
        
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frames;
        const fps = 1000 / avgFrameTime;
        
        return {
            averageFrameTime: avgFrameTime.toFixed(2) + 'ms',
            estimatedFPS: fps.toFixed(1),
            performance: fps > 25 ? 'excellent' : fps > 15 ? 'good' : 'poor',
            testDuration: (performance.now() - startTime).toFixed(2) + 'ms',
            frameTimes: frameTimes
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
    
    async captureFrame(quality = 0.7) {
        if (!this.currentStream) return null;
        
        const canvas = document.createElement('canvas');
        const video = document.createElement('video');
        
        video.srcObject = this.currentStream;
        await video.play();
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        video.pause();
        video.srcObject = null;
        
        return canvas.toDataURL('image/jpeg', quality);
    },
    
    async checkCameraSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return {
                supported: false,
                reason: 'المتصفح لا يدخص الوصول للكاميرا'
            };
        }
        
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            
            if (!hasCamera) {
                return {
                    supported: false,
                    reason: 'لم يتم العثور على كاميرا في الجهاز'
                };
            }
            
            const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
            testStream.getTracks().forEach(track => track.stop());
            
            return {
                supported: true,
                deviceCount: devices.filter(d => d.kind === 'videoinput').length,
                hasMicrophone: devices.some(d => d.kind === 'audioinput'),
                permissions: 'available'
            };
        } catch (error) {
            return {
                supported: false,
                reason: error.message,
                errorName: error.name
            };
        }
    },
    
    enablePowerSavingMode() {
        if (!this.currentStream) return false;
        
        const videoTrack = this.currentStream.getVideoTracks()[0];
        
        if (videoTrack.applyConstraints) {
            videoTrack.applyConstraints({
                width: { ideal: 320 },
                height: { ideal: 240 },
                frameRate: { ideal: 15 }
            }).then(() => {
                console.log('🔋 Power saving mode enabled');
            }).catch(error => {
                console.error('❌ Error enabling power saving:', error);
            });
        }
        
        return true;
    }
};

export default CameraOptimizer;