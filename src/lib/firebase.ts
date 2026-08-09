import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  increment 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqgouaaTMHiTBPKGuQAeXUOvzV0mLiIkM",
  authDomain: "advance-gadget-1ptg6.firebaseapp.com",
  projectId: "advance-gadget-1ptg6",
  storageBucket: "advance-gadget-1ptg6.firebasestorage.app",
  messagingSenderId: "343526436385",
  appId: "1:343526436385:web:8ad6f692c6a777c5a97d60"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, "ai-studio-outbubble-45e8fa5c-4f00-4901-8763-6a4bb12047b7");

export {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  increment
};
