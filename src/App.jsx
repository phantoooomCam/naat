import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./paginas/Login-SignIn/Registro";
import SignIn from "./paginas/Login-SignIn/SignIn";
import PageNotFound from "./paginas/Error/PageNotFound";
import HomeAlt from "./paginas/HomeAlt/HomeAlt";
import Dashboard from "./paginas/Admin/Inicio/dashboard";
import Gestion from "./paginas/Admin/Usuarios/Gestion/Gestion";
import IngresoSist from "./paginas/Admin/Sistema/Ingresos/Ingresos";
import Actividad from "./paginas/Admin/Sistema/Actividad/Actividad";
import PasswordChange from "./paginas/Error/ChangePassword";
import MensajeRegistro from "./paginas/Login-SignIn/MensajeRegistro";


import Gestion_Orga from "./paginas/Admin/Organizaciones/Gestion_Organizacion/Gestion_Orga";
import Gestion_Depto from "./paginas/Admin/Organizaciones/Gestion_Depto/Gestion_Depto";
import Gestion_Area from "./paginas/Admin/Organizaciones/Gestion_Area/Gestion_Area";



import AdministrarCuenta from "./componentes/AdministrarCuenta/Administrar";
import Cambiar from "./componentes/AdministrarCuenta/Cambiarcontraseña/Cambiar";

import ProtectedRoute from "./componentes/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/registro" element={<Login />} />
      <Route path="/mensaje" element={<MensajeRegistro />} />
      <Route path="*" element={<PageNotFound />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gestion" element={<Gestion />} />
        <Route path="/ingresos" element={<IngresoSist />} />
        <Route path="/actividad" element={<Actividad />} />

        <Route path="/orga" element={<Gestion_Orga />} />
        <Route path="/depto" element={<Gestion_Depto />} />
        <Route path="/area" element={<Gestion_Area />} />


        <Route path="/administrarcuenta" element={<AdministrarCuenta />} />
        <Route path="/cambiarcontra" element={<Cambiar />} />
      </Route>
      <Route path="/changepasswd" element={<PasswordChange />} />
    </Routes>
  );
}

export default App;
