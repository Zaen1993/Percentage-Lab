// progress-tracker.js
import { showToast } from './toast-notifications.js';

const TRACKER_KEY = 'progressTracker_v2';
const BACKUP_KEY = 'progressBackup_v1';

const trackExerciseStart = (exerciseId, userId = 'anonymous') => {
    showToast(`🎯 بدأت "${exerciseId}"`, 'info', 2000);
    
    const timestamp = Date.now();
    const session = {
        id: `session_${timestamp}_${Math.random().toString(36).substr(2, 6)}`,
        exerciseId: exerciseId,
        userId: userId,
        startTime: timestamp,
        actions: [],
        events: [],
        completed: false,
        deviceInfo: {
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            online: navigator.onLine
        }
    };
    
    const sessions = JSON.parse(sessionStorage.getItem(TRACKER_KEY) || '[]');
    sessions.push(session);
    sessionStorage.setItem(TRACKER_KEY, JSON.stringify(sessions));
    
    this.backupSessions();
    
    return session.id;
};

const trackAction = (sessionId, actionType, data = {}) => {
    const sessions = JSON.parse(sessionStorage.getItem(TRACKER_KEY) || '[]');
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
        sessions[sessionIndex].actions.push({
            time: Date.now(),
            type: actionType,
            data: data,
            relativeTime: Date.now() - sessions[sessionIndex].startTime
        });
        
        sessionStorage.setItem(TRACKER_KEY, JSON.stringify(sessions));
        
        if (Math.random() > 0.8) {
            this.backupSessions();
        }
    }
};

const trackExerciseEnd = (sessionId, score, timeSpent) => {
    const sessions = JSON.parse(sessionStorage.getItem(TRACKER_KEY) || '[]');
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
        sessions[sessionIndex].endTime = Date.now();
        sessions[sessionIndex].score = score;
        sessions[sessionIndex].timeSpent = timeSpent;
        sessions[sessionIndex].completed = true;
        sessions[sessionIndex].duration = sessions[sessionIndex].endTime - sessions[sessionIndex].startTime;
        
        sessionStorage.setItem(TRACKER_KEY, JSON.stringify(sessions));
        
        const session = sessions[sessionIndex];
        this.saveToBackup(session);
        
        if (score >= 80) {
            showToast(`🏆 ممتاز! ${score}% في ${Math.round(timeSpent/1000)}ث`, 'success');
        } else if (score >= 60) {
            showToast(`👍 جيد! ${score}%`, 'info');
        } else {
            showToast(`💪 حاول مجدداً! ${score}%`, 'warning');
        }
    }
};

const getSessionData = (sessionId) => {
    const sessions = JSON.parse(sessionStorage.getItem(TRACKER_KEY) || '[]');
    return sessions.find(s => s.id === sessionId) || null;
};

const backupSessions = () => {
    try {
        const sessions = JSON.parse(sessionStorage.getItem(TRACKER_KEY) || '[]');
        const completedSessions = sessions.filter(s => s.completed);
        
        if (completedSessions.length > 0) {
            const backups = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
            backups.push({
                timestamp: Date.now(),
                sessions: completedSessions,
                count: completedSessions.length
            });
            
            if (backups.length > 10) {
                backups.shift();
            }
            
            localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
        }
    } catch (error) {
        console.error('❌ Backup error:', error);
    }
};

const saveToBackup = (session) => {
    try {
        const backup = {
            id: session.id,
            exerciseId: session.exerciseId,
            score: session.score,
            timeSpent: session.timeSpent,
            duration: session.duration,
            startTime: session.startTime,
            endTime: session.endTime,
            actionsCount: session.actions?.length || 0
        };
        
        const sessionBackups = JSON.parse(localStorage.getItem('session_backups') || '[]');
        sessionBackups.push(backup);
        
        if (sessionBackups.length > 50) {
            sessionBackups.shift();
        }
        
        localStorage.setItem('session_backups', JSON.stringify(sessionBackups));
    } catch (error) {
        console.error('❌ Session backup error:', error);
    }
};

const clearOldSessions = () => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const sessions = JSON.parse(sessionStorage.getItem(TRACKER_KEY) || '[]');
    const filtered = sessions.filter(s => s.startTime > oneWeekAgo);
    
    const removedCount = sessions.length - filtered.length;
    
    if (removedCount > 0) {
        sessionStorage.setItem(TRACKER_KEY, JSON.stringify(filtered));
        showToast(`🧹 تم مسح ${removedCount} جلسة قديمة`, 'info');
    }
    
    return removedCount;
};

const exportProgressData = () => {
    try {
        const sessions = JSON.parse(sessionStorage.getItem(TRACKER_KEY) || '[]');
        const backups = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
        const sessionBackups = JSON.parse(localStorage.getItem('session_backups') || '[]');
        
        const data = {
            exportDate: new Date().toISOString(),
            activeSessions: sessions.length,
            completedSessions: sessions.filter(s => s.completed).length,
            backups: backups.length,
            sessionBackups: sessionBackups.length,
            data: {
                sessions: sessions,
                backups: backups,
                sessionBackups: sessionBackups
            }
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progress-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('📥 تم تصدير بيانات التقدم', 'export');
        return true;
    } catch (error) {
        console.error('❌ Export error:', error);
        showToast('❌ فشل تصدير بيانات التقدم', 'error');
        return false;
    }
};

export {
    trackExerciseStart,
    trackAction,
    trackExerciseEnd,
    getSessionData,
    clearOldSessions,
    exportProgressData,
    backupSessions,
    saveToBackup
};