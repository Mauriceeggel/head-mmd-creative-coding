// Firebase partagé par tous les navigateurs qui regardent la ville.
// Même projet que les autres prototypes, Flux World utilise sa propre branche.
const FIREBASE_CONFIG = {
	apiKey: "AIzaSyBRBVKFWJQUuRbbEpFQQsUakYUcaiXB1VE",
	authDomain: "vibe-724ae.firebaseapp.com",
	databaseURL: "https://vibe-724ae-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "vibe-724ae",
	storageBucket: "vibe-724ae.firebasestorage.app",
	messagingSenderId: "385206351842",
	appId: "1:385206351842:web:aa47b2a23c8a32a26e6bbb"
};

// ville-v1 : la ville commune (l'ancienne version avec les pylônes dessinés utilisait flux-v1)
const RACINE = "ville-v1";

firebase.initializeApp(FIREBASE_CONFIG);
const base = firebase.database();
