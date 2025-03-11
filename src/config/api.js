const BASE_URL = "http://localhost:44444/api"; // ✅ Definir y usar BASE_URL correctamente

export const apiRequest = async (endpoint, method = "GET", body = null) => {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}/${endpoint}`, options); // ✅ Usar BASE_URL correctamente
        
        if (response.status === 401 && endpoint !== "usuarios/refresh") {
            console.warn("Token expirado, intentando refrescar...");

            const refreshResponse = await fetch(`${BASE_URL}/usuarios/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (refreshResponse.ok) {
                console.log("Token renovado con éxito. Reintentando petición...");
                return apiRequest(endpoint, method, body);
            } else {
                console.error("No se pudo renovar el token. Redirigiendo a login...");
                window.location.href = "/login";
                return;
            }
        }

        return await response.json();
    } catch (error) {
        console.error("Error en la petición a la API:", error);
        throw error;
    }
};
