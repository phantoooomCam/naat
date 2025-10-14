import { toast } from "react-hot-toast";

export default async function fetchWithAuth(url, options = {}) {
    try {
        const response = await fetch(url, {
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
        throw error;
    }
}
