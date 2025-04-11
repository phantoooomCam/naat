// src/utils/fetchWithAuth.js
import { toast } from "react-hot-toast";

const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = localStorage.getItem("token");
    
    const response = await fetch(url, {
      ...options,
      // 🔐 importante para enviar cookies
      credentials: "include",
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${token}`
      }
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