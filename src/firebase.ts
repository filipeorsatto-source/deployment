import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBcdIyRSlZek-OFrsatILRVksyZty6C9dQ",
  authDomain: "frame-deployment.firebaseapp.com",
  databaseURL: "https://frame-deployment-default-rtdb.firebaseio.com",
  projectId: "frame-deployment",
  storageBucket: "frame-deployment.firebasestorage.app",
  messagingSenderId: "884796341411",
  appId: "1:884796341411:web:e4071aee879e8f7c019316",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: "rivio.com.br" });

// Domínio permitido (a segurança real é garantida pelas regras do Realtime Database).
export const ALLOWED_DOMAIN = "rivio.com.br";
