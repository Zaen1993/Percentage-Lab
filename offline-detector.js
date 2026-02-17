const OFFLINE_EVENTS_KEY = 'offlineEvents_v1';

const detectConnection = () => {
    const isOnline = navigator.onLine;
    const event = {
        time: Date.now(),
        online: isOnline,
        type: isOnline ? 'online' : 'offline'
    };
    
    const events = JSON.parse(localStorage.getItem(OFFLINE_EVENTS_KEY) || '[]');
    events.push(event);
    localStorage.setItem(OFFLINE_EVENTS_KEY, JSON.stringify(events));
    
    return isOnline;
};

const syncWhenOnline = async () => {
    if (!navigator.onLine) return false;
    
    const offlineData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    if (offlineData.length === 0) return true;
    
    try {
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: offlineData })
        });
        
        if (response.ok) localStorage.removeItem('pendingSync');
        return response.ok;
    } catch {
        return false;
    }
};

export { detectConnection, syncWhenOnline };