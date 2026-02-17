// backup-manager.js
const BackupManager = {
    async autoBackup() {
        const results = JSON.parse(localStorage.getItem('percentageLabResults_v1') || '[]');
        const backup = {
            timestamp: Date.now(),
            data: results,
            count: results.length
        };
        localStorage.setItem('backup_' + Date.now(), JSON.stringify(backup));
    },
    
    restoreBackup(backupId) {
        const backup = localStorage.getItem(backupId);
        if (backup) {
            localStorage.setItem('percentageLabResults_v1', backup.data);
        }
    }
};