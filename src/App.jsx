import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./paginas/Login-SignIn/Registro";
import SignIn from "./paginas/Login-SignIn/SignIn";
import PageNotFound from "./paginas/Error/PageNotFound";
import HomeAlt from "./paginas/HomeAlt/HomeAlt";
import Dashboard from "./paginas/Admin/Inicio/dashboard";
import Gestion from "./paginas/Admin/Gestion/Gestion";
import IngresoSist from "./paginas/Admin/Ingresos/Ingresos";
import Actividad from "./paginas/Admin/Actividad/Actividad";
import PasswordChange from "./paginas/Error/ChangePassword";

import ProtectedRoute from "./componentes/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeAlt />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="*" element={<PageNotFound />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gestion" element={<Gestion />} />
        <Route path="/ingresos" element={<IngresoSist />} />
        <Route path="/actividad" element={<Actividad />} />
      </Route>
      <Route path="/forgotpasswd" element={<PasswordChange />} />
    </Routes>
  );
}

export default App;
