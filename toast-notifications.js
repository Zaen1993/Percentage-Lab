// toast-notifications.js
const ToastManager = {
    container: null,
    
    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
        
        this.addStyles();
    },
    
    addStyles() {
        if (document.getElementById('toast-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes toastSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes toastSlideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            camera: '📷',
            save: '💾',
            export: '📥',
            delete: '🗑️'
        };
        
        const icon = icons[type] || icons.info;
        
        toast.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                background: ${this.getBackgroundColor(type)};
                color: white;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                border-left: 4px solid ${this.getBorderColor(type)};
                animation: toastSlideIn 0.3s ease-out;
                cursor: pointer;
            ">
                <span style="font-size: 20px;">${icon}</span>
                <span style="
                    flex: 1;
                    font-weight: 500;
                    font-size: 14px;
                    line-height: 1.4;
                ">${message}</span>
                <span style="
                    font-size: 12px;
                    opacity: 0.8;
                    margin-left: 8px;
                    cursor: pointer;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: rgba(255,255,255,0.2);
                ">✕</span>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.querySelector('div').style.animation = 'toastSlideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentNode === this.container) {
                    this.container.removeChild(toast);
                }
            }, 300);
        }, duration);
        
        toast.addEventListener('click', (e) => {
            if (e.target.textContent === '✕' || e.target.closest('span:last-child')) {
                toast.querySelector('div').style.animation = 'toastSlideOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (toast.parentNode === this.container) {
                        this.container.removeChild(toast);
                    }
                }, 300);
            }
        });
        
        return toast;
    },
    
    getBackgroundColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #00b09b, #96c93d)',
            error: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
            warning: 'linear-gradient(135deg, #f7971e, #ffd200)',
            info: 'linear-gradient(135deg, #4a00e0, #8e2de2)',
            camera: 'linear-gradient(135deg, #3498db, #2980b9)',
            save: 'linear-gradient(135deg, #2ecc71, #27ae60)',
            export: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
            delete: 'linear-gradient(135deg, #e74c3c, #c0392b)'
        };
        return colors[type] || colors.info;
    },
    
    getBorderColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#c0392b',
            warning: '#e67e22',
            info: '#2980b9',
            camera: '#2980b9',
            save: '#27ae60',
            export: '#8e44ad',
            delete: '#c0392b'
        };
        return colors[type] || colors.info;
    }
};

function showToast(message, type = 'info', duration = 3000) {
    return ToastManager.show(message, type, duration);
}

export { ToastManager, showToast };