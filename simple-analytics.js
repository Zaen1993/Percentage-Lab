// simple-analytics.js
const SimpleAnalytics = {
    trackClick(buttonId) {
        const clicks = JSON.parse(localStorage.getItem('clicks') || '{}');
        clicks[buttonId] = (clicks[buttonId] || 0) + 1;
        localStorage.setItem('clicks', JSON.stringify(clicks));
    },
    
    getPopularButtons() {
        const clicks = JSON.parse(localStorage.getItem('clicks') || '{}');
        return Object.entries(clicks)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }
};