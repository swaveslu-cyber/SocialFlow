
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// REPLACE WITH YOUR FIREBASE CONFIG OBJECT
const firebaseConfig = {
  apiKey: "AIzaSycUaVRFwlXQhLrGBPoVojDYs9s27HoQAGI",
  authDomain: "socialflow-483017.firebaseapp.com",
  projectId: "socialflow-483017",
  storageBucket: "socialflow-483017.firebasestorage.app",
  messagingSenderId: "1015366189686",
  appId: "1:1015366189686:web:23dd0c5661d4d976421557",
  measurementId: "G-H7552P6SKK"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
