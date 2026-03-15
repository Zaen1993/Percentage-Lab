(function() {
    async function requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            stream.getTracks().forEach(track => track.stop());
        } catch (e) {
            // فشل الحصول على إذن الكاميرا - يمكن تجاهل الخطأ
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', requestCameraPermission);
    } else {
        requestCameraPermission();
    }
})();
