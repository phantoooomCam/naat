import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import fetchWithAuth from "../utils/fetchWithAuth";
import LoadingThreeDotsJumping from "../componentes/LoadingThreeDotsJumping"; // Asegúrate de que la ruta sea correcta

const ProtectedRoute = () => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchWithAuth("/api/me");
        if (!response || !response.ok) {
          throw new Error("Usuario no autenticado");
        }

        const data = await response.json();

        setUsuario({
          idUsuario: parseInt(data.idUsuario, 10),
          nivel: parseInt(data.nivel, 10),
        });

      } catch (err) {
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <LoadingThreeDotsJumping />;
  }

  if (!usuario) {
    return <Navigate to="/" />;
  }

  const dashboardLevels = [1, 2, 3, 4, 5];

  if (dashboardLevels.includes(usuario.nivel)) {
    return <Outlet />;
  }

  return <Navigate to="/home" />;
};

export default ProtectedRoute;
