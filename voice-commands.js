const VoiceCommands = {
    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = 'ar-SA';
        this.recognition.interimResults = false;
        
        return true;
    },
    
    start() {
        if (!this.recognition) return;
        this.recognition.start();
    },
    
    onResult(callback) {
        if (!this.recognition) return;
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            callback(transcript);
        };
    }
};

export default VoiceCommands;