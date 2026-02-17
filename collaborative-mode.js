// collaborative-mode.js
const CollaborativeMode = {
    peer: null,
    connections: [],
    roomId: null,
    userName: 'مستخدم',
    
    init() {
        if (typeof Peer === 'undefined') {
            console.error('❌ مكتبة PeerJS غير محملة');
            return false;
        }
        
        this.userName = localStorage.getItem('collab_user') || `طالب_${Math.floor(Math.random() * 1000)}`;
        
        this.peer = new Peer(null, {
            debug: 2,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });
        
        this.setupPeerEvents();
        this.setupUI();
        
        return true;
    },
    
    setupPeerEvents() {
        this.peer.on('open', (id) => {
            console.log('✅ اتصال Peer جاهز، المعرف:', id);
            this.showStatus('✅ متصل');
        });
        
        this.peer.on('connection', (conn) => {
            console.log('🔗 اتصال جديد من:', conn.peer);
            this.handleNewConnection(conn);
        });
        
        this.peer.on('error', (err) => {
            console.error('❌ خطأ في Peer:', err);
            this.showStatus('❌ خطأ في الاتصال');
        });
    },
    
    setupUI() {
        const collabUI = document.createElement('div');
        collabUI.id = 'collaborative-ui';
        collabUI.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #00ffcc;
            z-index: 9999;
            min-width: 300px;
        `;
        
        collabUI.innerHTML = `
            <h3 style="margin-bottom: 10px; color: #00ffcc;">👥 الوضع التعاوني</h3>
            <div style="margin-bottom: 10px;">
                <label>الاسم: </label>
                <input type="text" id="collab-name" value="${this.userName}" 
                       style="padding: 5px; border-radius: 5px; border: 1px solid #ccc;">
            </div>
            <div style="margin-bottom: 10px;">
                <button id="create-room" style="padding: 8px 15px; margin-right: 5px; background: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🏠 إنشاء غرفة
                </button>
                <button id="join-room" style="padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔗 الانضمام لغرفة
                </button>
            </div>
            <div id="room-section" style="display: none;">
                <div style="margin-bottom: 10px;">
                    <label>رقم الغرفة: </label>
                    <input type="text" id="room-input" style="padding: 5px; border-radius: 5px; border: 1px solid #ccc; width: 150px;">
                    <button id="connect-room" style="padding: 5px 10px; margin-left: 5px; background: #9b59b6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        اتصال
                    </button>
                </div>
                <div id="room-info" style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;"></div>
            </div>
            <div id="status" style="padding: 5px; background: rgba(255,255,255,0.1); border-radius: 5px; font-size: 0.9em;"></div>
            <div id="participants" style="margin-top: 10px; max-height: 200px; overflow-y: auto;"></div>
            <button id="close-collab" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: white; cursor: pointer; font-size: 16px;">
                ✕
            </button>
        `;
        
        document.body.appendChild(collabUI);
        
        document.getElementById('collab-name').addEventListener('change', (e) => {
            this.userName = e.target.value;
            localStorage.setItem('collab_user', this.userName);
        });
        
        document.getElementById('create-room').addEventListener('click', () => this.createRoom());
        document.getElementById('join-room').addEventListener('click', () => this.showRoomInput());
        document.getElementById('connect-room').addEventListener('click', () => this.joinRoom());
        document.getElementById('close-collab').addEventListener('click', () => this.closeUI());
    },
    
    createRoom() {
        if (!this.peer || !this.peer.id) {
            alert('⏳ جاري تهيئة الاتصال...');
            return;
        }
        
        this.roomId = this.peer.id;
        this.showStatus(`✅ تم إنشاء الغرفة: ${this.roomId}`);
        this.updateRoomInfo();
        
        document.getElementById('room-input').value = this.roomId;
        document.getElementById('room-section').style.display = 'block';
        
        this.broadcast({ type: 'room_created', roomId: this.roomId, creator: this.userName });
    },
    
    showRoomInput() {
        document.getElementById('room-section').style.display = 'block';
    },
    
    joinRoom() {
        const roomId = document.getElementById('room-input').value.trim();
        if (!roomId) {
            alert('⚠️ الرجاء إدخال رقم الغرفة');
            return;
        }
        
        if (roomId === this.peer.id) {
            alert('⚠️ لا يمكنك الانضمام لغرفتك الخاصة');
            return;
        }
        
        this.roomId = roomId;
        
        const conn = this.peer.connect(roomId, {
            reliable: true,
            metadata: {
                userName: this.userName,
                timestamp: Date.now()
            }
        });
        
        conn.on('open', () => {
            console.log('✅ متصل بالغرفة:', roomId);
            this.connections.push(conn);
            this.handleConnection(conn);
            this.showStatus(`✅ متصل بالغرفة ${roomId}`);
            
            conn.send({
                type: 'join',
                userName: this.userName,
                peerId: this.peer.id
            });
        });
        
        conn.on('error', (err) => {
            console.error('❌ خطأ في الاتصال:', err);
            this.showStatus('❌ فشل الاتصال بالغرفة');
        });
    },
    
    handleNewConnection(conn) {
        this.connections.push(conn);
        this.handleConnection(conn);
        
        conn.on('open', () => {
            console.log('✅ اتصال مفتوح مع:', conn.peer);
            
            conn.send({
                type: 'welcome',
                message: `مرحباً بك في الغرفة ${this.roomId}`,
                userName: this.userName,
                participants: this.getParticipants()
            });
        });
    },
    
    handleConnection(conn) {
        conn.on('data', (data) => {
            console.log('📩 بيانات واردة:', data);
            this.handleIncomingData(data, conn);
        });
        
        conn.on('close', () => {
            console.log('🔒 اتصال مغلق:', conn.peer);
            this.removeConnection(conn.peer);
        });
        
        conn.on('error', (err) => {
            console.error('❌ خطأ في الاتصال:', err);
            this.removeConnection(conn.peer);
        });
    },
    
    handleIncomingData(data, conn) {
        switch(data.type) {
            case 'join':
                this.addParticipant(data.userName, conn.peer);
                this.broadcast({ 
                    type: 'participant_joined', 
                    userName: data.userName,
                    timestamp: Date.now()
                });
                break;
                
            case 'progress':
                this.showProgress(data.userName, data.progress);
                break;
                
            case 'answer':
                this.showAnswer(data.userName, data.answer, data.correct);
                break;
                
            case 'message':
                this.showMessage(data.userName, data.message);
                break;
                
            case 'welcome':
                this.showStatus(data.message);
                this.updateParticipants(data.participants);
                break;
                
            case 'room_created':
                this.showStatus(`✅ انضممت لغرفة ${data.roomId} بقيادة ${data.creator}`);
                break;
        }
    },
    
    broadcast(data) {
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send({
                    ...data,
                    sender: this.userName,
                    timestamp: Date.now()
                });
            }
        });
    },
    
    shareProgress(progress) {
        this.broadcast({
            type: 'progress',
            progress: progress,
            exercise: window.location.pathname.split('/').pop()
        });
    },
    
    shareAnswer(question, answer, correct) {
        this.broadcast({
            type: 'answer',
            question: question,
            answer: answer,
            correct: correct
        });
    },
    
    sendMessage(message) {
        this.broadcast({
            type: 'message',
            message: message
        });
    },
    
    addParticipant(userName, peerId) {
        const participantsDiv = document.getElementById('participants');
        const participantId = `participant-${peerId}`;
        
        let participantDiv = document.getElementById(participantId);
        if (!participantDiv) {
            participantDiv = document.createElement('div');
            participantDiv.id = participantId;
            participantDiv.className = 'participant';
            participantDiv.style.cssText = `
                padding: 5px;
                margin: 2px 0;
                background: rgba(255,255,255,0.1);
                border-radius: 5px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            participantsDiv.appendChild(participantDiv);
        }
        
        participantDiv.innerHTML = `
            <span>👤 ${userName}</span>
            <span style="font-size: 0.8em; color: #00ffcc;">${peerId.substring(0, 6)}</span>
        `;
    },
    
    removeConnection(peerId) {
        this.connections = this.connections.filter(conn => conn.peer !== peerId);
        
        const participantDiv = document.getElementById(`participant-${peerId}`);
        if (participantDiv) {
            participantDiv.remove();
        }
    },
    
    updateParticipants(participants) {
        const participantsDiv = document.getElementById('participants');
        participantsDiv.innerHTML = '';
        
        participants.forEach(p => {
            this.addParticipant(p.userName, p.peerId);
        });
    },
    
    getParticipants() {
        return this.connections.map(conn => ({
            userName: conn.metadata?.userName || 'مجهول',
            peerId: conn.peer
        }));
    },
    
    showProgress(userName, progress) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(46, 204, 113, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `👤 ${userName}: ${progress}%`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    },
    
    showMessage(userName, message) {
        console.log(`💬 ${userName}: ${message}`);
    },
    
    showAnswer(userName, answer, correct) {
        console.log(`✅ ${userName}: ${answer} (${correct ? 'صحيح' : 'خطأ'})`);
    },
    
    showStatus(message) {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = message.includes('✅') ? '#2ecc71' : 
                                  message.includes('❌') ? '#e74c3c' : 
                                  message.includes('⚠️') ? '#f39c12' : 'white';
        }
    },
    
    updateRoomInfo() {
        const roomInfo = document.getElementById('room-info');
        if (roomInfo) {
            roomInfo.innerHTML = `
                <strong>رقم الغرفة:</strong> ${this.roomId}<br>
                <strong>المشاركون:</strong> ${this.connections.length + 1}<br>
                <strong>الحالة:</strong> ${this.connections.length > 0 ? 'نشطة' : 'منتظرة'}
            `;
        }
    },
    
    closeUI() {
        const ui = document.getElementById('collaborative-ui');
        if (ui) {
            ui.remove();
        }
        
        this.connections.forEach(conn => conn.close());
        if (this.peer) {
            this.peer.destroy();
        }
    }
};

export default CollaborativeMode;