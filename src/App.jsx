import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./paginas/Login-SignIn/Registro";
import SignIn from "./paginas/Login-SignIn/SignIn";
import PageNotFound from "./paginas/Error/PageNotFound";
import ForgotPassword from "./paginas/Login-SignIn/OlvidarContra";
import ResetPassword from "./paginas/Login-SignIn/Resetpassword";
import HomeAlt from "./paginas/HomeAlt/HomeAlt";
import Dashboard from "./paginas/Admin/Inicio/dashboard";
import Gestion from "./paginas/Admin/Usuarios/Gestion/Gestion";
import IngresoSist from "./paginas/Admin/Sistema/Ingresos/Ingresos";
import PasswordChange from "./paginas/Error/ChangePassword";
import MensajeRegistro from "./paginas/Login-SignIn/MensajeRegistro";
import Solicitud from "./paginas/Admin/Usuarios/Solicitud/Solicitud";

import Gestion_Orga from "./paginas/Admin/Organizaciones/Gestion_Organizacion/Gestion_Orga";
import Gestion_Depto from "./paginas/Admin/Organizaciones/Gestion_Depto/Gestion_Depto";
import Gestion_Area from "./paginas/Admin/Organizaciones/Gestion_Area/Gestion_Area";

import ActividadesGestion from "./paginas/Admin/Sistema/Actividad/Actividades";

import AdministrarCuenta from "./componentes/AdministrarCuenta/Administrar";
import Cambiar from "./componentes/AdministrarCuenta/Cambiarcontraseña/Cambiar";

import Home_Organizacion from "./paginas/AdminOrganizacion/Home_Organizacion/Home_Organizacion";
import Home_Area from "./paginas/AdminOrganizacion/Areas_Organizacion/Home_Area";
import Home_Depto from "./paginas/AdminOrganizacion/Departamentos_organizacion/Home_Depto";
import Home_Analista from "./paginas/Analista/Home_Analista";

import ProtectedRoute from "./componentes/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/registro" element={<Login />} />
      <Route path="/mensaje" element={<MensajeRegistro />} />
      <Route path="*" element={<PageNotFound />} />
      <Route path="forgot_password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword  />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/gestion" element={<Gestion />} />
        <Route path="/solicitudes" element={<Solicitud />} />
        <Route path="/ingresos" element={<IngresoSist />} />
        <Route path="/actividad" element={<ActividadesGestion />} />

        <Route path="/orga" element={<Gestion_Orga />} />
        <Route path="/depto" element={<Gestion_Depto />} />
        <Route path="/area" element={<Gestion_Area />} />

        <Route path="/administrarcuenta" element={<AdministrarCuenta />} />
        <Route path="/cambiarcontra" element={<Cambiar />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home_org" element={<Home_Organizacion />} />
        <Route path="/home_area" element={<Home_Area />} />
        <Route path="/home_depto" element={<Home_Depto />} />
        <Route path="/home_analista" element={<Home_Analista />} />
      </Route>
      

      <Route path="/changepasswd" element={<PasswordChange />} />
    </Routes>
  );
}

export default App;
