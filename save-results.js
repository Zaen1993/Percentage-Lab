import { showToast } from './toast-notifications.js';

const saveLocalResults = async (exercise, score, time, details = {}) => {
    if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
        showToast('❌ نتيجة غير صالحة', 'error');
        return null;
    }

    if (typeof time !== 'number' || isNaN(time) || time < 0) {
        showToast('❌ وقت غير صالح', 'error');
        return null;
    }

    if (score >= 80) {
        showToast(`🏆 ممتاز! ${score}% في ${Math.round(time)}ث`, 'success', 3000);
    } else if (score >= 60) {
        showToast(`👍 جيد! ${score}%`, 'info', 3000);
    } else {
        showToast(`💪 حاول مجدداً! ${score}%`, 'warning', 3000);
    }

    return 'result_dummy_id';
};

const getLocalResults = () => [];
const clearLocalResults = () => false;
const exportResults = () => {
    showToast('📭 لا توجد نتائج للتصدير', 'info');
    return false;
};
const getStatistics = () => ({
    total: 0,
    averageScore: 0,
    averageTime: 0,
    bestScore: 0,
    exercises: {}
});
const syncResultsWithBackend = async () => ({ success: true, synced: 0 });
const getLatestResult = () => null;
const getExerciseHistory = () => [];
const deleteResultById = () => false;
const RESULTS_KEY = null;

export {
    saveLocalResults,
    getLocalResults,
    clearLocalResults,
    exportResults,
    getStatistics,
    syncResultsWithBackend,
    getLatestResult,
    getExerciseHistory,
    deleteResultById,
    RESULTS_KEY
};
