import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDhhRxkbIMaA3fUXXckV0uqviDM3xz8zYs",
  authDomain: "signin-d5be0.firebaseapp.com",
  projectId: "signin-d5be0",
  storageBucket: "signin-d5be0.firebasestorage.app",
  messagingSenderId: "843276240434",
  appId: "1:843276240434:web:b5abfb27ecd017c7475e2b",
  measurementId: "G-T7WZ6FK967"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Función para iniciar sesión con Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return {
      name: user.displayName,
      email: user.email,
      photo: user.photoURL
    };
  } catch (error) {
    console.error("Error en la autenticación:", error);
    return null;
  }
};

export { auth };
