import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./paginas/Principal/Home";
import Login from "./paginas/Registrarse/Registro"
import SignIn from './paginas/SignIn/SignIn';
import PageNotFound from './paginas/Error/PageNotFound';
import Auth from './paginas/Auth/Auth';
import Dashboard from "./paginas/Dashboard/Dashboard";
import HomeAlt from "./paginas/HomeAlt/HomeAlt";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeAlt />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="*" element={<PageNotFound />}/>
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
