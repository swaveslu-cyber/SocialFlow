
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// REPLACE WITH YOUR FIREBASE CONFIG OBJECT
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:12345:web:abcde"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
