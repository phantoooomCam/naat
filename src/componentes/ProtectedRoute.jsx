import { Navigate, Outlet } from "react-router-dom";

const checkAuth = async () => {
  try {
    const response = await fetch("http://localhost:44444/api/usuarios/me", {
      method: "GET",
      credentials: "include", // ✅ Envía cookies HTTPOnly
    });

    if (!response.ok) throw new Error("No autenticado");
    
    return await response.json();
  } catch (error) {
    console.warn("No autenticado, redirigiendo a login.");
    return null;
  }
};

const ProtectedRoute = () => {
  const fetchUser = async () => {
    const user = await checkAuth();
    if (!user) {
      return <Navigate to="/login" />;
    }
  };

  fetchUser();

  return <Outlet />;
};

export default ProtectedRoute;
