import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// -----------------------------------------------------Principales_NoProtegidas
//Rutas NO Protegidas
import SignIn from "./paginas/Princiales_NoProtegidas/SignIn";
import Login from "./paginas/Princiales_NoProtegidas/Registro";
import MensajeRegistro from "./paginas/Princiales_NoProtegidas/MensajeRegistro";
import PageNotFound from "./paginas/Princiales_NoProtegidas/PageNotFound";
import ForgotPassword from "./paginas/Princiales_NoProtegidas/OlvidarContra";
import ResetPassword from "./paginas/Princiales_NoProtegidas/Resetpassword";
import CuentaBloqueada from "./paginas/Princiales_NoProtegidas/CuentaBloqueada";

// -----------------------------------------------------SuperAdmin_Funciones
// Rutas de SuperAdmin
import Dashboard from "./paginas/SuperAdmin_Funciones/Inicio/dashboard";
import Gestion from "./paginas/SuperAdmin_Funciones/Usuarios/Gestion/Gestion";
import Solicitud from "./paginas/SuperAdmin_Funciones/Usuarios/Solicitud/Solicitud";
import IngresoSist from "./paginas/SuperAdmin_Funciones/Sistema/Ingresos/Ingresos";
import ActividadesGestion from "./paginas/SuperAdmin_Funciones/Sistema/Actividad/Actividades";
// CRUD's Organizacion/Area/Departamento
import Gestion_Orga from "./paginas/SuperAdmin_Funciones/Organizaciones/Gestion_Organizacion/Gestion_Orga";
import Gestion_Depto from "./paginas/SuperAdmin_Funciones/Organizaciones/Gestion_Depto/Gestion_Depto";
import Gestion_Area from "./paginas/SuperAdmin_Funciones/Organizaciones/Gestion_Area/Gestion_Area";

// -----------------------------------------------------Editar_Perfil
// Personalizar Perfil c/Usuario
import AdministrarCuenta from "./paginas/Editar_Perfil/Administrar";
import Cambiar from "./paginas/Editar_Perfil/Cambiar";

// Vista Home Usuarios
import Home_Organizacion from "./paginas/Vistas_Usuarios/Home_Organizacion/Home_Organizacion";
import Home_Area from "./paginas/Vistas_Usuarios/Areas_Organizacion/Home_Area";
import Home_Depto from "./paginas/Vistas_Usuarios/Departamentos_organizacion/Home_Depto";
import Home_Analista from "./paginas/Vistas_Usuarios/Analista/Home_Analista";

// Componentes
import ProtectedRoute from "./componentes/ProtectedRoute";

// Funciones Analista
import Sabana from "./paginas/Vistas_Usuarios/Analista/Sabana/Sabana";
import Caso from "./paginas/Vistas_Usuarios/Analista/Caso/Caso";
import LogsCasos from "./paginas/Vistas_Usuarios/Analista/Caso/LogsCasos";


///Procesamiento de Sabanas
import InfoSabana from "./paginas/Analisis_Sabanas/Informacion_Sabana/informacion_sabana";

//Redes Sociales
import RedesSociales from "./paginas/RedesSociales/redes_sociales_general";


function App() {
  return (
    <Routes>
      {/* Rutas NO Protegidas */}
      <Route path="/" element={<SignIn />} />
      <Route path="/registro" element={<Login />} />
      <Route path="/mensaje" element={<MensajeRegistro />} />
      <Route path="*" element={<PageNotFound />} />
      <Route path="forgot_password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/cuenta_bloqueada" element={<CuentaBloqueada />} />

      <Route element={<ProtectedRoute />}>
        {/* RUtas de SuperAdmin */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gestion" element={<Gestion />} />
        <Route path="/solicitudes" element={<Solicitud />} />
        <Route path="/ingresos" element={<IngresoSist />} />
        <Route path="/actividad" element={<ActividadesGestion />} />

        {/* Rutas de CRUD's Organizacion/Area/Departamento */}
        <Route path="/orga" element={<Gestion_Orga />} />
        <Route path="/depto" element={<Gestion_Depto />} />
        <Route path="/area" element={<Gestion_Area />} />

        {/* Personalizar Perfil c/Usuario */}
        <Route path="/administrarcuenta" element={<AdministrarCuenta />} />
        <Route path="/cambiarcontra" element={<Cambiar />} />

        {/* Vistas Home Usuarios */}
        <Route path="/home_org" element={<Home_Organizacion />} />
        <Route path="/home_area" element={<Home_Area />} />
        <Route path="/home_depto" element={<Home_Depto />} />
        <Route path="/home_analista" element={<Home_Analista />} />

        {/* Funciones Analista */}
        <Route path="/sabana" element={<Sabana />} />
        <Route path="/logscasos" element={<LogsCasos />} />
        <Route path="/casos" element={<Caso />} />

        {/* Procesamiento de Sabanas */}
        <Route path="/procesamiento_sabana" element={<InfoSabana/>}/>
        <Route path="/redes_sociales" element={<RedesSociales/>}/>


      </Route>
    </Routes>
  );
}

export default App;
