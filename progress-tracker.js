import { showToast } from './toast-notifications.js';

const trackExerciseStart = (exerciseId) => {
    showToast(`🎯 بدأت "${exerciseId}"`, 'info', 2000);
    return null;
};

const trackAction = () => {};

const trackExerciseEnd = (sessionId, score, timeSpent) => {
    if (score >= 80) {
        showToast(`🏆 ممتاز! ${score}% في ${Math.round(timeSpent/1000)}ث`, 'success');
    } else if (score >= 60) {
        showToast(`👍 جيد! ${score}%`, 'info');
    } else {
        showToast(`💪 حاول مجدداً! ${score}%`, 'warning');
    }
};

const getSessionData = () => null;

const clearOldSessions = () => 0;

const exportProgressData = () => {
    showToast('📭 لا توجد بيانات للتصدير', 'info');
    return false;
};

export {
    trackExerciseStart,
    trackAction,
    trackExerciseEnd,
    getSessionData,
    clearOldSessions,
    exportProgressData
};
