// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2fohJKa9n-7BJCIRCjR3aoHxrs1B4P-k",
  authDomain: "event-n-tickets.firebaseapp.com",
  projectId: "event-n-tickets",
  storageBucket: "event-n-tickets.firebasestorage.app",
  messagingSenderId: "86889968624",
  appId: "1:86889968624:web:afeea050a899df1e80e335"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;