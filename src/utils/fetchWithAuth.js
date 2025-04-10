// src/utils/fetchWithAuth.js
import { toast } from "react-hot-toast";

const fetchWithAuth = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include", // 🔐 importante para enviar cookies
    });

    if ([401, 403, 404].includes(response.status)) {
      toast.error("⚠ Tu sesión ha expirado. Redirigiendo...", {
        duration: 3000,
      });

      localStorage.clear();
      window.location.href = "/";
      return null;
    }

    return response;
  } catch (error) {
    console.error("🌐 Error en la solicitud:", error);
    toast.error("Ocurrió un error de red. Intenta de nuevo.");
    return null;
  }
};

export default fetchWithAuth;
