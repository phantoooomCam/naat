import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token"); 
  const userData = localStorage.getItem("user"); // Datos del usuario en formato JSON

  if (!token || !userData) {
    return <Navigate to="/login" />; // Redirigir al login si no hay sesión
  }

  const user = JSON.parse(userData); // Convertir el JSON a objeto
  const dashboardLevels = [1, 2]; // Solo estos niveles pueden acceder al dashboard

  if (dashboardLevels.includes(user.nivel)) {
    return <Outlet />; // Permitir acceso a las rutas protegidas
  }

  return <Navigate to="/home" />; // Redirigir niveles 3, 4 y 5 a otra ruta
};

export default ProtectedRoute;
