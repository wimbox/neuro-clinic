/**
 * Firebase Configuration Logic
 * Replace the placeholders below with your project credentials from Firebase Console
 */
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (Compat mode for easier integration)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully.");

    // Global references
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    window.auth = firebase.auth();
} else {
    console.warn("Firebase SDK not loaded. Work in offline mode.");
}
