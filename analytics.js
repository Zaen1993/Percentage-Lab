const trackEvent = (category, action, label, value) => {
    const event = {
        timestamp: Date.now(),
        category,
        action,
        label,
        value,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`
    };
    
    const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    events.push(event);
    if (events.length > 1000) events.shift();
    localStorage.setItem('analyticsEvents', JSON.stringify(events));
    
    if (typeof gtag !== 'undefined') gtag('event', action, { event_category: category });
};

export { trackEvent };