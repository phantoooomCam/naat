import { toast } from "react-hot-toast";

// Obtener la URL base del backend desde las variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default async function fetchWithAuth(url, options = {}) {
    try {
        // Construir la URL completa solo si no es una URL absoluta
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        
        const response = await fetch(fullUrl, {
            ...options,
            credentials: "include", 
            headers: {
                ...options.headers
            }
        });

        if ([401, 403].includes(response.status)) {
            toast.error("⚠ Tu sesión ha expirado. Redirigiendo...", { duration: 3000 });
            window.location.href = "/";
            return null;
        }

        if (response.status === 404) {
            toast.error("Recurso no encontrado.");
            return null;
        }

        return response;
    } catch (error) {
        // Evitar ruido en consola y rethrow para AbortError (p. ej. React Strict Mode)
        if (error && error.name === "AbortError") {
            // Intención: devolver null para que el llamador pueda manejarlo silenciosamente
            return null;
        }
        // Para otros errores sí loguear y relanzar
        console.error("Error en la solicitud:", error);
        toast.error("Error de conexión con el servidor");
        throw error;
    }
}
