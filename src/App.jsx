import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./paginas/Principal/Home";
import Registro from "./paginas/Registrarse/Registro"
import Login from './paginas/Signin/Login';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Registro" element={<Registro />} />
      <Route path="/SignIn" element={<SignIn />} />
    </Routes>
  );
}

export default App;

