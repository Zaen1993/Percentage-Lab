// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForNowReplaceWithReal",
    authDomain: "percentage-lab.firebaseapp.com",
    projectId: "percentage-lab",
    storageBucket: "percentage-lab.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456",
    measurementId: "G-ABC123DEF"
};

let firebaseApp = null;
let firestore = null;
let auth = null;

if (typeof firebase !== 'undefined') {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firestore = firebase.firestore();
        auth = firebase.auth();
        
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
            firestore.useEmulator("localhost", 8080);
            auth.useEmulator("http://localhost:9099");
        }
        
        console.log("✅ Firebase initialized successfully");
    } catch (error) {
        console.error("❌ Firebase initialization error:", error);
    }
} else {
    console.warn("⚠️ Firebase SDK not loaded");
}

export { firebaseApp, firestore, auth, firebaseConfig };