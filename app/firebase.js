import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBi2V4I64CA7xt2JsMaufceg7vJ2jQmGNk",
  authDomain: "next-todo-app2.firebaseapp.com",
  projectId: "next-todo-app2",
  storageBucket: "next-todo-app2.firebasestorage.app",
  messagingSenderId: "557621184124",
  appId: "1:557621184124:web:0cf9ad888d4387f4deebf9",
  measurementId: "G-X48E23MP2M"
};

// Initialize Firebase
let app;
let db;

try {
  if (!app) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully");
  }
  if (!db) {
    db = getFirestore(app);
    console.log("Firestore initialized successfully");
  }
} catch (error) {
  console.error("Firebase initialization error:", error.message);
}

export { db };
