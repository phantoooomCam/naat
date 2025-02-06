import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import Home from "./paginas/Home";
import Registro from './paginas/Registro';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Registro" element={<Registro />} />
    </Routes>
  );
}

export default App;

