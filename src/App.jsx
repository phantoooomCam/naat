import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./paginas/Home/Home";
import Login from "./paginas/Login"
import Registro from './paginas/Registro/Registro';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/Registro" element={<Registro />} />
    </Routes>
  );
}

export default App;

