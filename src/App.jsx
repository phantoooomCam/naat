import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./paginas/Login-SignIn/Registro"
import SignIn from './paginas/Login-SignIn/SignIn';
import PageNotFound from './paginas/Error/PageNotFound';
import HomeAlt from "./paginas/HomeAlt/HomeAlt";
import Dashboard from './paginas/Dashboard/dashboard';

import ProtectedRoute from "./componentes/ProtectedRoute"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeAlt />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="*" element={<PageNotFound />}/>
      <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
    </Routes>
  );
}

export default App;
