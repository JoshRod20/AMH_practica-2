// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";  
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBEz1HleGg7l_t3PnfV1I7_1ljv27saafY",
  authDomain: "practicaamh.firebaseapp.com",
  projectId: "practicaamh",
  storageBucket: "practicaamh.firebasestorage.app",
  messagingSenderId: "33818536199",
  appId: "1:33818536199:web:10d67978f3f098a2b27da2",
  measurementId: "G-WWJ7XNR7HZ"
};

// Initialize Firebase
const appfirebase = initializeApp(firebaseConfig);

//Inicializa Firestore
const db = getFirestore(appfirebase);

//Inicializa autenticación 
const auth = getAuth(appfirebase);

// Inicializa Storage
const storage = getStorage(appfirebase);

export { appfirebase, db, auth, storage };