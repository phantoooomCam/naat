import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./paginas/Principal/Home";
import Registro from "./paginas/Registrarse/Registro"
import Login from './paginas/SignIn/SignIn';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Registro />} />
      <Route path="/signin" element={<SignIn />} />
    </Routes>
  );
}

export default App;

