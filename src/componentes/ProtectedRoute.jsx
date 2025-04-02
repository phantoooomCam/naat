import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const userData = localStorage.getItem("user");

  if (!userData) {
    return <Navigate to="/" />;
  }

  const user = JSON.parse(userData);
  const dashboardLevels = [1, 2, 3, 4, 5];

  if (dashboardLevels.includes(user.nivel)) {
    return <Outlet />;
  }

  return <Navigate to="/home" />;
};

export default ProtectedRoute;