// system-helper.js
(function() {
    try {
        if (!window.SYSTEM_CONFIG) {
            console.warn('System helper: Config not loaded');
            return;
        }
        
        // تنفيذ نظام المساعدة
        setTimeout(() => {
            if (window.SystemAssistant) {
                new window.SystemAssistant().initialize();
            }
        }, 3000);
        
    } catch (e) {
        // Silent error
    }
})();