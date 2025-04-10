// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";


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

let db;
try {
  db = initializeFirestore(appfirebase, {
    localCache: persistentLocalCache({
      cacheSizeBytes: 100 * 1024 * 1024, // 100 MB (opcional, para limitar tamaño)
    }),
  });
  console.log("Firestore inicializado con persistencia offline.");
} catch (error) {
  console.error("Error al inicializar Firestore con persistencia:", error);
  // Fallback: inicializar sin persistencia si falla
  db = initializeFirestore(appfirebase, {});
}

//Inicializa autenticación 
const auth = getAuth(appfirebase);

// Inicializa Storage
const storage = getStorage(appfirebase);

export { appfirebase, db, auth, storage };