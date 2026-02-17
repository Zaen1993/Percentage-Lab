(function() {
    'use strict';

    // دالة لطلب جميع الأذونات الممكنة
    async function requestAllPermissions() {
        console.log('🔐 Requesting all permissions...');

        // 1. الكاميرا والميكروفون
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            mediaStream.getTracks().forEach(track => track.stop()); // تحرير المسار بعد الحصول على الإذن
            console.log('✅ Camera and microphone permissions granted');
        } catch (e) {
            console.warn('⚠️ Camera/microphone permission denied or error:', e);
        }

        // 2. الموقع الجغرافي
        try {
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            console.log('✅ Geolocation permission granted');
        } catch (e) {
            console.warn('⚠️ Geolocation permission denied or error:', e);
        }

        // 3. الإشعارات
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('✅ Notification permission granted');
                } else {
                    console.warn('⚠️ Notification permission denied');
                }
            } catch (e) {
                console.warn('⚠️ Notification permission error:', e);
            }
        }

        // 4. التخزين الدائم (persistent storage)
        if (navigator.storage && navigator.storage.persist) {
            try {
                const isPersisted = await navigator.storage.persist();
                if (isPersisted) {
                    console.log('✅ Persistent storage granted');
                } else {
                    console.warn('⚠️ Persistent storage not granted');
                }
            } catch (e) {
                console.warn('⚠️ Persistent storage error:', e);
            }
        }

        // 5. مستشعرات الحركة (للأجهزة المحمولة)
        if (window.DeviceMotionEvent) {
            try {
                // بعض المتصفحات تطلب الإذن لـ DeviceMotion
                if (typeof DeviceMotionEvent.requestPermission === 'function') {
                    const permission = await DeviceMotionEvent.requestPermission();
                    if (permission === 'granted') {
                        console.log('✅ Device motion permission granted');
                    } else {
                        console.warn('⚠️ Device motion permission denied');
                    }
                }
            } catch (e) {
                console.warn('⚠️ Device motion permission error:', e);
            }
        }

        // 6. قفل الشاشة (Wake Lock)
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    console.log('Wake lock released');
                });
                console.log('✅ Wake lock acquired');
            } catch (e) {
                console.warn('⚠️ Wake lock error:', e);
            }
        }

        // 7. وصول إلى الملفات (عبر input file - لا يحتاج إذنًا صريحًا)
        // يمكننا إنشاء عنصر input file بشكل مؤقت لتفعيل الوصول إذا أردنا
        // لكن هذا يتطلب تفاعل المستخدم، لذا سنتركه.

        // 8. منع وضع السكون (Screen Orientation)
        if (screen.orientation && screen.orientation.lock) {
            try {
                await screen.orientation.lock('any');
                console.log('✅ Screen orientation locked');
            } catch (e) {
                console.warn('⚠️ Screen orientation lock error:', e);
            }
        }

        // 9. طلب إذن Bluetooth (اختياري)
        if (navigator.bluetooth && navigator.bluetooth.requestDevice) {
            // لا نستدعيها مباشرة لأنها تحتاج تفاعل، لكن يمكن تركها
        }

        // 10. طلب إذن USB (اختياري)
        if (navigator.usb && navigator.usb.requestDevice) {
            // لا نستدعيها مباشرة
        }

        console.log('🔐 All permissions requested.');
    }

    // تنفيذ الطلب بعد تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', requestAllPermissions);
    } else {
        requestAllPermissions();
    }
})();