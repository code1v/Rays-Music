
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyA5RlZMrFW_9x6g8fZnMx0wq0KTB_T8NbA",
  authDomain: "rays-music.firebaseapp.com",
  projectId: "rays-music",
  storageBucket: "rays-music.firebasestorage.app",
  messagingSenderId: "797140365169",
  appId: "1:797140365169:web:f180225cb8a0f398f090d0"
};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider,db};