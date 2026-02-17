// permissions-manager.js
import { showToast } from './toast-notifications.js';

const checkCameraPermission = async () => {
    try {
        if (navigator.permissions && navigator.permissions.query) {
            const permission = await navigator.permissions.query({ name: 'camera' });
            return permission.state;
        }
        return 'prompt';
    } catch {
        return 'unknown';
    }
};

const checkMicrophonePermission = async () => {
    try {
        if (navigator.permissions && navigator.permissions.query) {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            return permission.state;
        }
        return 'prompt';
    } catch {
        return 'unknown';
    }
};

const checkStoragePermission = async () => {
    try {
        if (navigator.permissions && navigator.permissions.query) {
            const permission = await navigator.permissions.query({ name: 'persistent-storage' });
            return permission.state;
        }
        return 'prompt';
    } catch {
        return 'unknown';
    }
};

const requestCamera = async () => {
    showToast('📷 جاري طلب إذن الكاميرا...', 'camera', 2000);
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        
        setTimeout(() => {
            showToast('✅ تم تفعيل الكاميرا بنجاح', 'success');
        }, 500);
        
        return 'granted';
    } catch (err) {
        console.error('❌ Camera permission denied:', err);
        
        setTimeout(() => {
            showToast('❌ تم رفض إذن الكاميرا', 'error');
        }, 500);
        
        return 'denied';
    }
};

const requestMicrophone = async () => {
    showToast('🎤 جاري طلب إذن الميكروفون...', 'info', 2000);
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        setTimeout(() => {
            showToast('✅ تم تفعيل الميكروفون بنجاح', 'success');
        }, 500);
        
        return 'granted';
    } catch (err) {
        console.error('❌ Microphone permission denied:', err);
        
        setTimeout(() => {
            showToast('❌ تم رفض إذن الميكروفون', 'error');
        }, 500);
        
        return 'denied';
    }
};

const checkAllPermissions = async () => {
    showToast('🔍 جاري فحص الأذونات...', 'info', 1500);
    
    const results = {
        camera: await checkCameraPermission(),
        microphone: await checkMicrophonePermission(),
        storage: await checkStoragePermission(),
        geolocation: 'not-required',
        notifications: 'not-required'
    };
    
    const missing = Object.entries(results)
        .filter(([perm, status]) => status === 'denied' || status === 'prompt')
        .map(([perm]) => perm);
    
    if (missing.length > 0) {
        setTimeout(() => {
            showToast(`⚠️ ${missing.length} أذونات مفقودة`, 'warning');
        }, 1000);
    }
    
    return results;
};

export {
    checkCameraPermission,
    checkMicrophonePermission,
    checkStoragePermission,
    requestCamera,
    requestMicrophone,
    checkAllPermissions
};