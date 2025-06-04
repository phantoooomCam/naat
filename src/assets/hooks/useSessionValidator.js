import { useEffect } from "react";
import { toast } from "react-hot-toast";

const useSessionValidator = () => {
  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/usuarios/perfil", {
          method: "GET",
          credentials: "include",
        });

        if ([401, 403, 404].includes(response.status)) {
          toast.error("⚠ Tu sesión ha expirado. Por favor inicia sesión de nuevo.");
          localStorage.clear();
          window.location.href = "/"; 
        }
      } catch (error) {
        console.error("Error validando sesión:", error);
      }
    };

    validateSession();
    const interval = setInterval(validateSession, 5000);
    return () => clearInterval(interval);
  }, []);
};

export default useSessionValidator;
