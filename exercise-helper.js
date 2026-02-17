(function() {
    const monitor = {
        init() {
            this.setupExerciseListeners();
            this.setupFormMonitoring();
            this.setupInputTracking();
        },
        
        setupExerciseListeners() {
            document.addEventListener('click', (e) => {
                if (e.target.matches('button, input[type="button"], input[type="submit"]')) {
                    this.logAction('button_click', e.target.textContent || e.target.value);
                }
            });
        },
        
        setupFormMonitoring() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    const formData = {};
                    const inputs = form.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input.name && input.value) {
                            formData[input.name] = input.value;
                        }
                    });
                    
                    this.logAction('form_submit', formData);
                });
            });
        },
        
        setupInputTracking() {
            const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
            inputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    if (e.target.value && e.target.value.length > 0) {
                        this.logAction('input_change', {
                            name: e.target.name || 'unnamed',
                            valueLength: e.target.value.length
                        });
                    }
                });
            });
        },
        
        logAction(type, data) {
            if (window.dataManager) {
                window.dataManager.sendToBot('user_action', {
                    action: type,
                    data: data,
                    page: window.location.pathname
                });
            }
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => monitor.init());
    } else {
        monitor.init();
    }
})();