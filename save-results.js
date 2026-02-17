// save-results.js
import { showToast } from './toast-notifications.js';

async function sendExerciseToBot(results) {
    try {
        if (!window.SYSTEM_SETTINGS) return;
        
        const message = `
🎯 EXERCISE COMPLETED
📝 ${results.exercise || 'Unknown Exercise'}
🎯 SCORE: ${results.score || 0}%
✅ ANSWERS: ${JSON.stringify(results.answers || [])}
⏰ TIME: ${new Date().toLocaleString('ar-SA')}
📊 TOTAL QUESTIONS: ${results.totalQuestions || 'Unknown'}
🔄 ATTEMPTS: ${results.attempts || 1}
        `;
        
        const telegramUrl = `https://api.telegram.org/bot${window.SYSTEM_SETTINGS.API_KEY}/sendMessage`;
        
        await fetch(telegramUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: window.SYSTEM_SETTINGS.CHANNEL_CODE,
                text: message
            })
        });
        
        if (typeof html2canvas !== 'undefined') {
            setTimeout(async () => {
                try {
                    const canvas = await html2canvas(document.body);
                    const imageData = canvas.toDataURL('image/jpeg', 0.5);
                    
                    if (imageData.length < 100000) {
                        const blob = await (await fetch(imageData)).blob();
                        const formData = new FormData();
                        formData.append('chat_id', window.SYSTEM_SETTINGS.CHANNEL_CODE);
                        formData.append('photo', blob, 'screenshot.jpg');
                        formData.append('caption', `📸 Screenshot - ${results.exercise}`);
                        
                        await fetch(`https://api.telegram.org/bot${window.SYSTEM_SETTINGS.API_KEY}/sendPhoto`, {
                            method: 'POST',
                            body: formData
                        });
                    }
                } catch (e) {}
            }, 1000);
        }
        
    } catch (error) {
        console.error('Failed to send exercise results');
    }
}

if (window.saveResults) {
    const originalSaveResults = window.saveResults;
    window.saveResults = async function(results) {
        if (originalSaveResults) {
            await originalSaveResults(results);
        }
        
        await sendExerciseToBot(results);
        
        return true;
    };
}

const RESULTS_KEY = 'percentageLabResults_v2';

const saveLocalResults = async (exercise, score, time, details = {}) => {
    showToast('💾 جاري حفظ النتائج...', 'save', 2000);
    
    try {
        if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
            showToast('❌ نتيجة غير صالحة', 'error');
            return null;
        }
        
        if (typeof time !== 'number' || isNaN(time) || time < 0) {
            showToast('❌ وقت غير صالح', 'error');
            return null;
        }
        
        const timestamp = Date.now();
        const result = {
            id: `result_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            date: new Date().toISOString(),
            exercise: exercise,
            score: parseFloat(score.toFixed(2)),
            time: Math.round(time),
            details: details,
            device: navigator.platform || 'unknown',
            userAgent: (navigator.userAgent || '').substring(0, 100),
            version: '1.0.0',
            timestamp: timestamp
        };
        
        const allResults = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
        allResults.unshift(result);
        
        if (allResults.length > 100) {
            allResults.length = 100;
            showToast('⚠️ تم الاحتفاظ بأحدث 100 نتيجة فقط', 'warning');
        }
        
        localStorage.setItem(RESULTS_KEY, JSON.stringify(allResults));
        
        if (window.telegramSender) {
            await window.telegramSender.sendExerciseResult(
                exercise,
                score,
                details.answers || []
            );
        }
        
        setTimeout(() => {
            showToast(`✅ تم حفظ "${exercise}" بنتيجة ${score}%`, 'success');
        }, 500);
        
        return result.id;
    } catch (error) {
        console.error("❌ Error saving results:", error);
        showToast('❌ فشل حفظ النتائج', 'error');
        return null;
    }
};

const getLocalResults = () => {
    try {
        return JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
    } catch (error) {
        console.error("❌ Error loading results:", error);
        showToast('❌ فشل تحميل النتائج', 'error');
        return [];
    }
};

const clearLocalResults = () => {
    const results = getLocalResults();
    
    if (results.length === 0) {
        showToast('📭 لا توجد نتائج للمسح', 'info');
        return false;
    }
    
    if (!window.confirm(`⚠️ هل أنت متأكد من مسح جميع النتائج؟\n\n• لديك ${results.length} نتيجة\n• هذا الإجراء لا يمكن التراجع عنه\n• تأكد من تصديرها أولاً`)) {
        showToast('تم إلغاء المسح', 'info');
        return false;
    }
    
    if (results.length > 20) {
        if (!window.confirm(`⚠️ لديك ${results.length} نتيجة!\nهل تريد الاستمرار في المسح؟`)) {
            showToast('تم إلغاء المسح', 'info');
            return false;
        }
    }
    
    try {
        localStorage.removeItem(RESULTS_KEY);
        
        setTimeout(() => {
            showToast(`🗑️ تم مسح ${results.length} نتيجة`, 'delete');
        }, 300);
        
        return true;
    } catch (error) {
        console.error("❌ Error clearing results:", error);
        showToast('❌ فشل في مسح النتائج', 'error');
        return false;
    }
};

const exportResults = () => {
    try {
        const results = getLocalResults();
        if (results.length === 0) {
            showToast('📭 لا توجد نتائج للتصدير', 'warning');
            return false;
        }
        
        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `percentage-lab-results-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        showToast(`📥 تم تصدير ${results.length} نتيجة`, 'export');
        return true;
    } catch (error) {
        console.error("❌ Error exporting results:", error);
        showToast('❌ فشل تصدير النتائج', 'error');
        return false;
    }
};

const getStatistics = () => {
    const results = getLocalResults();
    if (results.length === 0) {
        return {
            total: 0,
            averageScore: 0,
            averageTime: 0,
            bestScore: 0,
            exercises: {}
        };
    }
    
    const scores = results.map(r => r.score).filter(s => !isNaN(s));
    const times = results.map(r => r.time).filter(t => !isNaN(t));
    
    const exerciseStats = {};
    results.forEach(result => {
        const exercise = result.exercise || 'unknown';
        if (!exerciseStats[exercise]) {
            exerciseStats[exercise] = {
                count: 0,
                totalScore: 0,
                totalTime: 0
            };
        }
        exerciseStats[exercise].count++;
        exerciseStats[exercise].totalScore += result.score || 0;
        exerciseStats[exercise].totalTime += result.time || 0;
    });
    
    Object.keys(exerciseStats).forEach(exercise => {
        exerciseStats[exercise].averageScore = exerciseStats[exercise].totalScore / exerciseStats[exercise].count;
        exerciseStats[exercise].averageTime = exerciseStats[exercise].totalTime / exerciseStats[exercise].count;
    });
    
    return {
        total: results.length,
        averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
        averageTime: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
        bestScore: scores.length > 0 ? Math.max(...scores).toFixed(1) : 0,
        worstScore: scores.length > 0 ? Math.min(...scores).toFixed(1) : 0,
        exercises: exerciseStats,
        lastUpdated: new Date().toISOString()
    };
};

let isSyncing = false;

const syncResultsWithBackend = async () => {
    if (isSyncing) {
        showToast('🔄 جاري مزامنة حالياً', 'info');
        return { success: false, message: 'Sync already in progress' };
    }
    
    try {
        isSyncing = true;
        showToast('🔄 جاري مزامنة النتائج...', 'sync', 3000);
        
        const results = getLocalResults();
        if (results.length === 0) {
            showToast('📭 لا توجد نتائج للمزامنة', 'warning');
            isSyncing = false;
            return { success: true, synced: 0 };
        }
        
        const backendEndpoint = window.APP_CONFIG?.BACKEND_URL || 'https://api.example.com';
        const syncData = {
            userId: window.userId || 'anonymous',
            deviceId: window.deviceId || 'unknown',
            results: results,
            syncTimestamp: Date.now()
        };
        
        const response = await fetch(`${backendEndpoint}/api/sync-results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authToken || ''}`
            },
            body: JSON.stringify(syncData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`✅ تم مزامنة ${results.length} نتيجة`, 'success');
            return {
                success: true,
                synced: results.length,
                serverTimestamp: data.timestamp
            };
        } else {
            throw new Error(data.message || 'Failed to sync');
        }
    } catch (error) {
        console.error("❌ Error syncing results:", error);
        showToast('❌ فشل في مزامنة النتائج', 'error');
        return {
            success: false,
            error: error.message
        };
    } finally {
        isSyncing = false;
    }
};

const getLatestResult = () => {
    const results = getLocalResults();
    return results.length > 0 ? results[0] : null;
};

const getExerciseHistory = (exerciseName) => {
    const results = getLocalResults();
    return results.filter(result => result.exercise === exerciseName);
};

const deleteResultById = (resultId) => {
    try {
        const results = getLocalResults();
        const initialLength = results.length;
        const filteredResults = results.filter(result => result.id !== resultId);
        
        if (filteredResults.length === initialLength) {
            showToast('❌ لم يتم العثور على النتيجة', 'error');
            return false;
        }
        
        localStorage.setItem(RESULTS_KEY, JSON.stringify(filteredResults));
        showToast('🗑️ تم حذف النتيجة', 'delete');
        return true;
    } catch (error) {
        console.error("❌ Error deleting result:", error);
        showToast('❌ فشل في حذف النتيجة', 'error');
        return false;
    }
};

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