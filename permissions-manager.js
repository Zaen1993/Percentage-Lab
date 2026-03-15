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

export {
    checkCameraPermission,
    requestCamera
};        setTimeout(() => {
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
